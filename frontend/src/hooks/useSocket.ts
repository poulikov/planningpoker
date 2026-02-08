import { useEffect, useCallback } from 'react';
import { getSocket, disconnectSocket } from '../lib/socket';
import { useSessionStore } from '../store/sessionStore';
import type { VotingState } from '../types';

export const useSocket = () => {
  const {
    session,
    setParticipants,
    addParticipant,
    removeParticipant,
    addTask,
    updateTask,
    setCurrentTask,
    setVotingState,
    setVotes,
    setMyVote,
    setConnected,
    setError,
  } = useSessionStore();

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      console.log('[useSocket] Connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[useSocket] Disconnected');
      setConnected(false);
    });

    socket.on('error', (error) => {
      console.error('[useSocket] Error:', error);
      setError(error.message);
    });

    socket.on('participant_joined', (participant) => {
      console.log('[useSocket] Participant joined:', participant.name);
      addParticipant(participant);
    });

    socket.on('participants_updated', (updatedParticipants) => {
      console.log('[useSocket] Participants updated:', updatedParticipants.length);
      setParticipants(updatedParticipants);
    });

    socket.on('participant_left', ({ participantId }) => {
      console.log('[useSocket] Participant left:', participantId);
      removeParticipant(participantId);
    });

    socket.on('task_added', (task) => {
      console.log('[useSocket] Task added:', task.title, task.id);
      addTask(task);
    });

    socket.on('voting_started', ({ taskId, timeout }) => {
      console.log('[useSocket] voting_started event received:', { taskId, timeout });
      
      const currentParticipants = useSessionStore.getState().participants;
      console.log('[useSocket] Current participants count:', currentParticipants.length);
      
      setCurrentTask(taskId);
      
      setVotingState({
        taskId,
        participantsVoted: [],
        isRevealed: false,
        remainingTime: timeout,
        votesCount: 0,
        participantsCount: currentParticipants.length,
      });
      
      setMyVote(null);
      updateTask(taskId, { status: 'voting' });
      
      console.log('[useSocket] voting_started processing complete');
    });

    socket.on('vote_received', ({ taskId, participantId, votesCount, participantsCount }) => {
      console.log('[useSocket] Vote received:', { taskId, participantId, votesCount, participantsCount });
      setVotingState((prev: VotingState | null): VotingState | null => {
        if (!prev || prev.taskId !== taskId) return prev;
        return {
          ...prev,
          participantsVoted: [...prev.participantsVoted, participantId],
          votesCount: votesCount || 0,
          participantsCount: participantsCount || 0,
        } as VotingState;
      });
    });

    socket.on('votes_revealed', (data) => {
      console.log('[useSocket] votes_revealed event received:', data);
      const { taskId, votes } = data;
      
      setVotingState((prev: VotingState | null): VotingState | null => {
        if (!prev || prev.taskId !== taskId) return prev;
        console.log('[useSocket] Updating votingState - isRevealed: true');
        return {
          ...prev,
          isRevealed: true,
          remainingTime: 0,
        } as VotingState;
      });
      
      setVotes(votes || []);
      console.log('[useSocket] votes_revealed processing complete');
    });

    socket.on('voting_reset', ({ taskId }) => {
      console.log('[useSocket] Voting reset for task:', taskId);
      setVotingState((prev: VotingState | null): VotingState | null => {
        if (!prev || prev.taskId !== taskId) return prev;
        return {
          ...prev,
          participantsVoted: [],
          isRevealed: false,
          remainingTime: prev.remainingTime || 120,
          votesCount: 0,
        } as VotingState;
      });
      setVotes([]);
      setMyVote(null);
    });

    socket.on('timer_updated', ({ taskId, remainingTime }) => {
      setVotingState((prev: VotingState | null): VotingState | null => {
        if (!prev || prev.taskId !== taskId) return prev;
        return { ...prev, remainingTime } as VotingState;
      });
    });

    socket.on('task_completed', ({ taskId, storyPoints }) => {
      console.log('[useSocket] Task completed:', taskId, storyPoints);
      updateTask(taskId, { status: 'completed', storyPoints });
      setVotingState(null);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('error');
      socket.off('participant_joined');
      socket.off('participants_updated');
      socket.off('participant_left');
      socket.off('task_added');
      socket.off('voting_started');
      socket.off('vote_received');
      socket.off('votes_revealed');
      socket.off('voting_reset');
      socket.off('timer_updated');
      socket.off('task_completed');
    };
  }, []);

  const joinSession = useCallback((sessionId: string, participantName: string) => {
    const socket = getSocket();
    socket.emit('join_session', { sessionId, participantName });
  }, []);

  const createTask = useCallback((sessionId: string, title: string, description?: string) => {
    const socket = getSocket();
    socket.emit('create_task', { sessionId, title, description });
  }, []);

  const startVoting = useCallback((taskId: string) => {
    const socket = getSocket();
    socket.emit('start_voting', { sessionId: session?.id, taskId });
  }, [session?.id]);

  const submitVote = useCallback((taskId: string, value: string) => {
    const socket = getSocket();
    socket.emit('submit_vote', { taskId, value });
    setMyVote(value as any);
  }, []);

  const revealVotes = useCallback((taskId: string) => {
    const socket = getSocket();
    socket.emit('reveal_votes', { sessionId: session?.id, taskId });
  }, [session?.id]);

  const resetVoting = useCallback((taskId: string) => {
    const socket = getSocket();
    socket.emit('reset_voting', { sessionId: session?.id, taskId });
  }, [session?.id]);

  const completeTask = useCallback((taskId: string, storyPoints: string) => {
    const socket = getSocket();
    socket.emit('complete_task', { taskId, storyPoints });
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
  }, []);

  return {
    joinSession,
    createTask,
    startVoting,
    submitVote,
    revealVotes,
    resetVoting,
    completeTask,
    disconnect,
  };
};
