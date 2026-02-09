// In production (with nginx proxy), use relative URLs
// In development, use environment variables or localhost defaults
const isProd = import.meta.env.PROD;

export const config = {
  apiBaseUrl: isProd ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001'),
  wsUrl: isProd ? '' : (import.meta.env.VITE_WS_URL || 'http://localhost:3001'),
  defaultTimeout: 120,
  defaultScale: [0, 1, 2, 3, 5, 8, 13, 21] as const,
  specialCards: ['?', '☕'] as const,
};
