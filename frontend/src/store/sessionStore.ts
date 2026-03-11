import { create } from 'zustand';
import { Session, Task, Participant, Vote, VotingState } from '../types';

// Default: Standard Fibonacci (0, 1, 2, 3, 5, 8, 13, 21, ?, ☕)
const DEFAULT_SCALE = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];

export const parseStoryPointsScale = (scale: string): string[] => {
  try {
    const parsed = JSON.parse(scale);
    return Array.isArray(parsed) ? parsed : DEFAULT_SCALE;
  } catch {
    return DEFAULT_SCALE;
  }
};

interface SessionStore {
  session: Session | null;
  participants: Participant[];
  tasks: Task[];
  currentTask: Task | null;
  votingState: VotingState | null;
  votes: Vote[];
  myVote: string | null;
  currentParticipantId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  setSession: (session: Session) => void;
  setCurrentParticipantId: (id: string | null) => void;
  setParticipants: (participants: Participant[]) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (participantId: string) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  setCurrentTask: (taskId: string | null) => void;
  setVotingState: (votingState: VotingState | null | ((prev: VotingState | null) => VotingState | null)) => void;
  setVotes: (votes: Vote[]) => void;
  setMyVote: (vote: string | null) => void;
  setConnected: (isConnected: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  session: null,
  participants: [],
  tasks: [],
  currentTask: null,
  votingState: null,
  votes: [],
  myVote: null,
  currentParticipantId: null,
  isConnected: false,
  isLoading: false,
  error: null,

  setSession: (session) => set({ session }),

  setParticipants: (participants) => set({ 
    participants: participants.filter((p, index, self) => 
      index === self.findIndex((t) => t.id === p.id)
    ) 
  }),

  addParticipant: (participant) => set((state) => {
    if (state.participants.some((p) => p.id === participant.id)) {
      return state;
    }
    return {
      participants: [...state.participants, participant],
    };
  }),

  removeParticipant: (participantId) => set((state) => ({
    participants: state.participants.filter((p) => p.id !== participantId),
  })),

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => set((state) => {
    if (state.tasks.some(t => t.id === task.id)) {
      console.warn('[Store] Task already exists, skipping:', task.id);
      return state;
    }
    console.log('[Store] Adding task:', task.id, task.title);
    return {
      tasks: [...state.tasks, task],
    };
  }),

  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    ),
    currentTask: state.currentTask?.id === taskId
      ? { ...state.currentTask, ...updates }
      : state.currentTask,
  })),

  setCurrentTask: (taskId) => set((state) => ({
    currentTask: taskId ? state.tasks.find((t) => t.id === taskId) || null : null,
  })),

  setVotingState: (votingState) => set((state) => ({ 
    votingState: typeof votingState === 'function' 
      ? votingState(state.votingState) 
      : votingState 
  })),

  setVotes: (votes) => set({ votes }),

  setMyVote: (myVote) => set({ myVote }),

  setCurrentParticipantId: (id) => set({ currentParticipantId: id }),

  setConnected: (isConnected) => set({ isConnected }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set({
    session: null,
    participants: [],
    tasks: [],
    currentTask: null,
    votingState: null,
    votes: [],
    myVote: null,
    currentParticipantId: null,
    error: null,
  }),
}));
