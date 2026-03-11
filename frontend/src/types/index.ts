// Story point value - can be any string from the scale (number, fraction, t-shirt size, etc.)
export type StoryPoint = string;

// Predefined voting scale systems
export const VOTING_SCALES = {
  standardFibonacci: {
    id: 'standardFibonacci',
    name: 'Standard Fibonacci',
    values: ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'],
  },
  extendedFibonacci: {
    id: 'extendedFibonacci',
    name: 'Extended Fibonacci',
    values: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'],
  },
  modifiedFibonacci: {
    id: 'modifiedFibonacci',
    name: 'Modified Fibonacci (SAFe)',
    values: ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?', '☕'],
  },
  tshirtSizes: {
    id: 'tshirtSizes',
    name: 'T-Shirt Sizes',
    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕'],
  },
  powersOf2: {
    id: 'powersOf2',
    name: 'Powers of 2',
    values: ['0', '1', '2', '4', '8', '16', '32', '64', '?', '☕'],
  },
  confidence: {
    id: 'confidence',
    name: 'Confidence Level',
    values: ['Low', 'Medium', 'High', 'Unknown'],
  },
} as const;

export type VotingScaleId = keyof typeof VOTING_SCALES;

// Get scale values by ID
export const getScaleValues = (scaleId: VotingScaleId): string[] => {
  return [...VOTING_SCALES[scaleId].values];
};

// Get scale name by ID
export const getScaleName = (scaleId: VotingScaleId): string => {
  return VOTING_SCALES[scaleId].name;
};

export type TaskStatus = 'pending' | 'voting' | 'completed';

export type SessionStatus = 'active' | 'completed';

export interface Session {
  id: string;
  name: string;
  authorId: string;
  createdAt: string;
  votingTimeout: number;
  currentTaskId: string | null;
  storyPointsScale: string;
  status: SessionStatus;
  completedAt?: string;
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
