import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export function setupSocketHandlers(socket: Socket, io: Server, prisma: PrismaClient) {
  const timerMap = new Map<string, NodeJS.Timeout>();

  socket.on('join_session', async ({ sessionId, participantName }: { sessionId: string; participantName: string }) => {
    try {
      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      let participant = await prisma.participant.findUnique({
        where: {
          sessionId_name: {
            sessionId,
            name: participantName,
          },
        },
      });

      if (!participant) {
        participant = await prisma.participant.create({
          data: {
            sessionId,
            name: participantName,
          },
        });
      } else {
        await prisma.participant.update({
          where: { id: participant.id },
          data: { lastSeenAt: new Date() },
        });
      }

      socket.join(sessionId);
      socket.data.sessionId = sessionId;
      socket.data.participantId = participant.id;

      io.to(sessionId).emit('participant_joined', participant);

      const participants = await prisma.participant.findMany({ where: { sessionId } });
      io.to(sessionId).emit('participants_updated', participants);

      logger.info(`Participant ${participantName} joined session ${sessionId}`);
    } catch (error) {
      logger.error('Error joining session:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  socket.on('create_task', async ({ sessionId, title, description }: { sessionId: string; title: string; description?: string }) => {
    try {
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
      
      const timeout = 120;

      await prisma.session.update({
        where: { id: sessionId },
        data: { currentTaskId: taskId },
      });

      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'voting' },
      });

      await prisma.vote.deleteMany({ where: { taskId } });

      logger.info(`[WS] Emitting voting_started to session ${sessionId}`);
      io.to(sessionId).emit('voting_started', { taskId, timeout });

      let remainingTime = timeout;
      const timer = setInterval(() => {
        remainingTime--;
        io.to(sessionId).emit('timer_updated', { taskId, remainingTime });

        if (remainingTime <= 0) {
          clearInterval(timer);
          timerMap.delete(taskId);
          revealVotes(sessionId, taskId, prisma);
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
      const participants = await prisma.participant.findMany({
        where: { sessionId },
      });

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
        revealVotes(sessionId, taskId, prisma);
      }

      logger.info(`Vote submitted for task ${taskId}`);
    } catch (error) {
      logger.error('Error submitting vote:', error);
      socket.emit('error', { message: 'Failed to submit vote' });
    }
  });

  socket.on('reveal_votes', async ({ sessionId, taskId }: { sessionId: string; taskId: string }) => {
    try {
      logger.info(`[WS] Manual reveal votes requested for task ${taskId}`);
      const timer = timerMap.get(taskId);
      if (timer) {
        clearInterval(timer);
        timerMap.delete(taskId);
      }
      revealVotes(sessionId, taskId, prisma);
    } catch (error) {
      logger.error('Error revealing votes:', error);
      socket.emit('error', { message: 'Failed to reveal votes' });
    }
  });

  socket.on('reset_voting', async ({ sessionId, taskId }: { sessionId: string; taskId: string }) => {
    try {
      await prisma.vote.deleteMany({ where: { taskId } });

      io.to(sessionId).emit('voting_reset', { taskId });
      logger.info(`Voting reset for task ${taskId}`);
    } catch (error) {
      logger.error('Error resetting voting:', error);
      socket.emit('error', { message: 'Failed to reset voting' });
    }
  });

  socket.on('complete_task', async ({ taskId, storyPoints }: { taskId: string; storyPoints: string }) => {
    try {
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

  socket.on('disconnecting', async () => {
    const sessionId = socket.data.sessionId;
    const participantId = socket.data.participantId;

    if (sessionId && participantId) {
      await prisma.participant.update({
        where: { id: participantId },
        data: { lastSeenAt: new Date() },
      });

      io.to(sessionId).emit('participant_left', { participantId });
      logger.info(`Participant ${participantId} left session ${sessionId}`);
    }
  });
}

async function revealVotes(sessionId: string, taskId: string, prismaClient: PrismaClient) {
  const { io } = await import('../index');

  logger.info(`[WS] Revealng votes for task ${taskId}`);

  const votes = await prismaClient.vote.findMany({
    where: { taskId },
    include: {
      participant: true,
    },
  });

  logger.info(`[WS] Emitting votes_revealed: ${votes.length} votes`);

  io.to(sessionId).emit('votes_revealed', { taskId, votes });
}
