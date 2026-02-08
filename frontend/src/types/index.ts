export type StoryPoint = '0' | '1' | '2' | '3' | '5' | '8' | '13' | '21' | '?' | '☕';

export type TaskStatus = 'pending' | 'voting' | 'completed';

export interface Session {
  id: string;
  name: string;
  createdAt: string;
  votingTimeout: number;
  currentTaskId: string | null;
  storyPointsScale: string;
}

export interface Task {
  id: string;
  sessionId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  storyPoints?: string;
  createdAt: string;
}

export interface Participant {
  id: string;
  name: string;
  sessionId: string;
  joinedAt: string;
  lastSeenAt: string;
}

export interface Vote {
  id: string;
  taskId: string;
  participantId: string;
  value: string;
  votedAt: string;
  participant?: Participant;
}

export interface VotingState {
  taskId: string;
  participantsVoted: string[];
  isRevealed: boolean;
  remainingTime: number | null;
  votesCount: number;
  participantsCount: number;
}
