import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Inactivity timeout: 2 minutes
const INACTIVITY_TIMEOUT = 2 * 60 * 1000;

// Track last activity for each participant
const lastActivityMap = new Map<string, Date>();

export function setupSocketHandlers(socket: Socket, io: Server, prisma: PrismaClient) {
  const timerMap = new Map<string, NodeJS.Timeout>();
  const revealedTasks = new Set<string>();

  // Heartbeat handler
  socket.on('ping', async () => {
    const participantId = socket.data.participantId;
    const sessionId = socket.data.sessionId;
    
    if (participantId) {
      lastActivityMap.set(participantId, new Date());
      
      // Update lastSeenAt in database
      try {
        await prisma.participant.update({
          where: { id: participantId },
          data: { lastSeenAt: new Date() },
        });
      } catch (error) {
        // Participant might have been deleted, ignore
      }
    }
    
    socket.emit('pong');
  });

  socket.on('join_session', async ({ sessionId, participantName, participantId, authorId }: { sessionId: string; participantName: string; participantId?: string; authorId?: string }) => {
    try {
      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Clean up inactive participants before joining
      await cleanupInactiveParticipants(sessionId, io, prisma);

      let participant = null;

      // If participantId provided, try to find existing participant by clientId
      if (participantId) {
        participant = await prisma.participant.findFirst({
          where: {
            sessionId,
            clientId: participantId,
          },
        });
      }

      if (!participant) {
        // Create new participant
        participant = await prisma.participant.create({
          data: {
            sessionId,
            name: participantName,
            clientId: participantId || undefined,
          },
        });
      } else {
        // Update existing participant's lastSeenAt and name (in case they changed it)
        await prisma.participant.update({
          where: { id: participant.id },
          data: { 
            lastSeenAt: new Date(),
            name: participantName,
          },
        });
      }

      // Track activity
      lastActivityMap.set(participant.id, new Date());

      // Check if this participant is the session author
      const isAuthor = session.authorId === participantId || session.authorId === authorId;
      
      socket.join(sessionId);
      socket.data.sessionId = sessionId;
      socket.data.participantId = participant.id;
      socket.data.participantName = participantName;
      socket.data.isAuthor = isAuthor;

      io.to(sessionId).emit('participant_joined', participant);

      const participants = await getActiveParticipants(sessionId, prisma);
      io.to(sessionId).emit('participants_updated', participants);

      // Send confirmation to the joined participant with their ID
      socket.emit('join_confirmed', { participantId: participant.id });

      // Check if there's active voting and notify the reconnected participant
      const activeVotingTask = await prisma.task.findFirst({
        where: { sessionId, status: 'voting' },
      });

      if (activeVotingTask) {
        logger.info(`[WS] Active voting found for task ${activeVotingTask.id}, notifying reconnected participant`);
        
        // Get current votes for this task
        const votes = await prisma.vote.findMany({
          where: { taskId: activeVotingTask.id },
          include: { participant: true },
        });

        // Send voting_started event to the reconnected participant only
        // Include current votes info for proper state restoration
        socket.emit('voting_started', { 
          taskId: activeVotingTask.id, 
          timeout: session.votingTimeout || 120, 
          participantsCount: participants.length,
          isRejoin: true, // Flag to indicate this is a rejoin
          currentVotes: votes.map(v => ({ participantId: v.participantId, value: v.value })),
        });

        // If votes are already revealed, send votes_revealed event
        // Note: In current implementation, votes are revealed immediately when timer ends or all voted
        // But we need to track if votes were revealed. For now, we check if votes exist but timer would have ended
        // This is a simplified approach - ideally we should store 'isRevealed' in the task
        logger.info(`[WS] Sent voting state to reconnected participant: ${votes.length} votes`);
      }

      logger.info(`Participant ${participantName} joined session ${sessionId}`);
    } catch (error) {
      logger.error('Error joining session:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  socket.on('create_task', async ({ sessionId, title, description }: { sessionId: string; title: string; description?: string }) => {
    try {
      // Check if the user is the session author
      if (!socket.data.isAuthor) {
        logger.warn(`[WS] create_task rejected: ${socket.data.participantName} is not the session author`);
        socket.emit('error', { message: 'Only the session author can create tasks' });
        return;
      }

      const task = await prisma.task.create({
        data: { sessionId, title, description },
      });
      io.to(sessionId).emit('task_added', task);
      logger.info(`Task ${title} created in session ${sessionId}`);
    } catch (error) {
      logger.error('Error creating task:', error);
      socket.emit('error', { message: 'Failed to create task' });
    }
  });

  socket.on('start_voting', async ({ sessionId, taskId }: { sessionId: string; taskId: string }) => {
    try {
      logger.info(`[WS] ★★★ start_voting received from participant: ${socket.data.participantName} for task: ${taskId} in session: ${sessionId}`);
      
      // Check if the user is the session author
      if (!socket.data.isAuthor) {
        logger.warn(`[WS] start_voting rejected: ${socket.data.participantName} is not the session author`);
        socket.emit('error', { message: 'Only the session author can start voting' });
        return;
      }
      
      // Clean up inactive participants before starting voting
      await cleanupInactiveParticipants(sessionId, io, prisma);
      
      // Get session to use configured voting timeout
      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }
      
      const timeout = session.votingTimeout || 120;

      await prisma.session.update({
        where: { id: sessionId },
        data: { currentTaskId: taskId },
      });

      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'voting' },
      });

      await prisma.vote.deleteMany({ where: { taskId } });

      // Reset revealed status for this task when starting new voting
      revealedTasks.delete(taskId);

      logger.info(`[WS] Emitting voting_started to session ${sessionId}`);
      
      const activeParticipants = await getActiveParticipants(sessionId, prisma);
      io.to(sessionId).emit('voting_started', { taskId, timeout, participantsCount: activeParticipants.length });

      let remainingTime = timeout;
      const timer = setInterval(() => {
        // Don't send updates if votes were already revealed (race condition protection)
        if (revealedTasks.has(taskId)) {
          clearInterval(timer);
          return;
        }

        remainingTime--;
        io.to(sessionId).emit('timer_updated', { taskId, remainingTime });

        if (remainingTime <= 0) {
          clearInterval(timer);
          timerMap.delete(taskId);
          revealVotes(sessionId, taskId, prisma, io, revealedTasks);
        }
      }, 1000);

      timerMap.set(taskId, timer);

      logger.info(`Voting started for task ${taskId} in session ${sessionId}`);
    } catch (error) {
      logger.error('Error starting voting:', error);
      socket.emit('error', { message: 'Failed to start voting' });
    }
  });

  socket.on('submit_vote', async ({ taskId, value }: { taskId: string; value: string }) => {
    try {
      const participantId = socket.data.participantId;
      const sessionId = socket.data.sessionId;

      // Update activity
      if (participantId) {
        lastActivityMap.set(participantId, new Date());
      }

      const existingVote = await prisma.vote.findUnique({
        where: {
          taskId_participantId: {
            taskId,
            participantId,
          },
        },
      });

      if (existingVote) {
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { value, votedAt: new Date() },
        });
      } else {
        await prisma.vote.create({
          data: { taskId, participantId, value },
        });
      }

      const votes = await prisma.vote.findMany({ where: { taskId } });
      const participants = await getActiveParticipants(sessionId, prisma);

      logger.info(`[WS] Vote submitted for task ${taskId}: votes=${votes.length}, participants=${participants.length}`);

      io.to(sessionId).emit('vote_received', {
        taskId,
        participantId,
        votesCount: votes.length,
        participantsCount: participants.length,
      });

      if (votes.length === participants.length) {
        logger.info(`[WS] All votes received, revealing votes for task ${taskId}`);
        const timer = timerMap.get(taskId);
        if (timer) {
          clearInterval(timer);
          timerMap.delete(taskId);
        }
        revealVotes(sessionId, taskId, prisma, io, revealedTasks);
      }

      logger.info(`Vote submitted for task ${taskId}`);
    } catch (error) {
      logger.error('Error submitting vote:', error);
      socket.emit('error', { message: 'Failed to submit vote' });
    }
  });

  socket.on('reveal_votes', async ({ sessionId, taskId }: { sessionId: string; taskId: string }) => {
    try {
      // Check if the user is the session author
      if (!socket.data.isAuthor) {
        logger.warn(`[WS] reveal_votes rejected: ${socket.data.participantName} is not the session author`);
        socket.emit('error', { message: 'Only the session author can reveal votes' });
        return;
      }

      logger.info(`[WS] Manual reveal votes requested for task ${taskId}`);
      const timer = timerMap.get(taskId);
      if (timer) {
        clearInterval(timer);
        timerMap.delete(taskId);
      }
      revealVotes(sessionId, taskId, prisma, io, revealedTasks);
    } catch (error) {
      logger.error('Error revealing votes:', error);
      socket.emit('error', { message: 'Failed to reveal votes' });
    }
  });

  socket.on('reset_voting', async ({ sessionId, taskId }: { sessionId: string; taskId: string }) => {
    try {
      // Check if the user is the session author
      if (!socket.data.isAuthor) {
        logger.warn(`[WS] reset_voting rejected: ${socket.data.participantName} is not the session author`);
        socket.emit('error', { message: 'Only the session author can reset voting' });
        return;
      }

      // Clear existing timer if any
      const existingTimer = timerMap.get(taskId);
      if (existingTimer) {
        clearInterval(existingTimer);
        timerMap.delete(taskId);
      }

      await prisma.vote.deleteMany({ where: { taskId } });

      // Get session to use configured voting timeout
      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      const timeout = session?.votingTimeout || 120;
      
      // Reset revealed status for this task when resetting voting
      revealedTasks.delete(taskId);
      
      // Restart the timer
      let remainingTime = timeout;
      
      const timer = setInterval(() => {
        // Don't send updates if votes were already revealed (race condition protection)
        if (revealedTasks.has(taskId)) {
          clearInterval(timer);
          return;
        }

        remainingTime--;
        io.to(sessionId).emit('timer_updated', { taskId, remainingTime });

        if (remainingTime <= 0) {
          clearInterval(timer);
          timerMap.delete(taskId);
          revealVotes(sessionId, taskId, prisma, io, revealedTasks);
        }
      }, 1000);

      timerMap.set(taskId, timer);

      io.to(sessionId).emit('voting_reset', { taskId, timeout });
      logger.info(`Voting reset for task ${taskId}, timer restarted with ${timeout}s`);
    } catch (error) {
      logger.error('Error resetting voting:', error);
      socket.emit('error', { message: 'Failed to reset voting' });
    }
  });

  socket.on('complete_task', async ({ taskId, storyPoints }: { taskId: string; storyPoints: string }) => {
    try {
      // Check if the user is the session author
      if (!socket.data.isAuthor) {
        logger.warn(`[WS] complete_task rejected: ${socket.data.participantName} is not the session author`);
        socket.emit('error', { message: 'Only the session author can complete tasks' });
        return;
      }

      const sessionId = socket.data.sessionId;

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          storyPoints,
        },
      });

      io.to(sessionId).emit('task_completed', { taskId, storyPoints });
      logger.info(`Task ${taskId} completed with ${storyPoints} points`);
    } catch (error) {
      logger.error('Error completing task:', error);
      socket.emit('error', { message: 'Failed to complete task' });
    }
  });

  socket.on('complete_session', async ({ sessionId }: { sessionId: string }) => {
    try {
      // Check if the user is the session author
      if (!socket.data.isAuthor) {
        logger.warn(`[WS] complete_session rejected: ${socket.data.participantName} is not the session author`);
        socket.emit('error', { message: 'Only the session author can complete the session' });
        return;
      }

      // Get session to check status
      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      if (session.status === 'completed') {
        socket.emit('error', { message: 'Session is already completed' });
        return;
      }

      // Update session status
      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
        include: {
          tasks: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      // Notify all participants that session is completed
      io.to(sessionId).emit('session_completed', { 
        sessionId, 
        status: 'completed',
        completedAt: updatedSession.completedAt,
        tasks: updatedSession.tasks,
      });

      logger.info(`Session ${sessionId} completed by ${socket.data.participantName}`);
    } catch (error) {
      logger.error('Error completing session:', error);
      socket.emit('error', { message: 'Failed to complete session' });
    }
  });

  socket.on('disconnect', async () => {
    const sessionId = socket.data.sessionId;
    const participantId = socket.data.participantId;

    if (sessionId && participantId) {
      try {
        // Delete participant's votes first (to not block voting)
        await prisma.vote.deleteMany({
          where: { participantId }
        });
        
        // Remove participant
        await prisma.participant.delete({
          where: { id: participantId }
        });
        
        logger.info(`Participant ${participantId} and their votes removed from session ${sessionId}`);
        
        // Check if there's active voting and update counts
        const session = await prisma.session.findUnique({
          where: { id: sessionId },
          include: { tasks: { where: { status: 'voting' } } }
        });
        
        if (session && session.tasks.length > 0) {
          const currentTask = session.tasks[0];
          const votes = await prisma.vote.findMany({ where: { taskId: currentTask.id } });
          const activeParticipants = await getActiveParticipants(sessionId, prisma);
          
          // Notify about updated vote count
          io.to(sessionId).emit('vote_received', {
            taskId: currentTask.id,
            participantId,
            votesCount: votes.length,
            participantsCount: activeParticipants.length,
          });
          
          // Check if all remaining participants voted
          if (votes.length === activeParticipants.length && activeParticipants.length > 0) {
            logger.info(`[WS] All remaining participants voted after disconnect, revealing votes`);
            const timer = timerMap.get(currentTask.id);
            if (timer) {
              clearInterval(timer);
              timerMap.delete(currentTask.id);
            }
            revealVotes(sessionId, currentTask.id, prisma, io, revealedTasks);
          }
        }
      } catch (error) {
        logger.warn(`Error removing participant ${participantId}:`, error);
      }
      
      lastActivityMap.delete(participantId);
      
      // Notify others that participant left
      io.to(sessionId).emit('participant_left', { participantId });
      
      // Update participants list for everyone
      const activeParticipants = await getActiveParticipants(sessionId, prisma);
      io.to(sessionId).emit('participants_updated', activeParticipants);
    }
  });
}

// Helper function to get active participants (not timed out)
async function getActiveParticipants(sessionId: string, prisma: PrismaClient) {
  const cutoffTime = new Date(Date.now() - INACTIVITY_TIMEOUT);
  
  const participants = await prisma.participant.findMany({
    where: { 
      sessionId,
      lastSeenAt: {
        gte: cutoffTime
      }
    },
    orderBy: { joinedAt: 'asc' },
  });
  
  return participants;
}

// Clean up inactive participants
async function cleanupInactiveParticipants(sessionId: string, io: Server, prisma: PrismaClient) {
  try {
    const cutoffTime = new Date(Date.now() - INACTIVITY_TIMEOUT);
    
    // Find inactive participants
    const inactiveParticipants = await prisma.participant.findMany({
      where: {
        sessionId,
        lastSeenAt: {
          lt: cutoffTime
        }
      }
    });
    
    if (inactiveParticipants.length > 0) {
      logger.info(`[Cleanup] Removing ${inactiveParticipants.length} inactive participants from session ${sessionId}`);
      
      // Delete inactive participants
      for (const participant of inactiveParticipants) {
        await prisma.participant.delete({
          where: { id: participant.id }
        });
        
        // Notify others
        io.to(sessionId).emit('participant_left', { participantId: participant.id });
        
        // Clean up from activity map
        lastActivityMap.delete(participant.id);
      }
      
      // Send updated participants list
      const activeParticipants = await getActiveParticipants(sessionId, prisma);
      io.to(sessionId).emit('participants_updated', activeParticipants);
    }
  } catch (error) {
    logger.error('[Cleanup] Error cleaning up inactive participants:', error);
  }
}

async function revealVotes(sessionId: string, taskId: string, prismaClient: PrismaClient, io: Server, revealedTasks?: Set<string>) {
  logger.info(`[WS] Revealng votes for task ${taskId}`);

  // Mark task as revealed to prevent stale timer updates
  if (revealedTasks) {
    revealedTasks.add(taskId);
  }

  const votes = await prismaClient.vote.findMany({
    where: { taskId },
    include: {
      participant: true,
    },
  });

  logger.info(`[WS] Emitting votes_revealed: ${votes.length} votes`);

  io.to(sessionId).emit('votes_revealed', { taskId, votes });
}

// Export for use in periodic cleanup job
export { cleanupInactiveParticipants, getActiveParticipants, lastActivityMap, INACTIVITY_TIMEOUT };
