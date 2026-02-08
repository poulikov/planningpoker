export const config = {
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  wsUrl: import.meta.env.VITE_WS_URL || 'http://localhost:3001',
  defaultTimeout: 120,
  defaultScale: [0, 1, 2, 3, 5, 8, 13, 21] as const,
  specialCards: ['?', '☕'] as const,
};
