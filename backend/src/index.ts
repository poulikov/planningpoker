import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import sessionRoutes from './routes/sessions';
import taskRoutes from './routes/tasks';
import voteRoutes from './routes/votes';
import { setupSocketHandlers, cleanupInactiveParticipants, INACTIVITY_TIMEOUT } from './websocket/handlers';
import { logger } from './utils/logger';

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3001;

// CORS configuration
// In production, allow all origins (nginx handles the proxy)
// In development, allow the dev server
const corsOrigin = isProd ? '*' : (process.env.VITE_API_URL || 'http://localhost:5173');

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/sessions', sessionRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/votes', voteRoutes);

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  setupSocketHandlers(socket, io, prisma);
});

// Periodic cleanup of inactive participants (runs every minute)
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute

setInterval(async () => {
  try {
    logger.info('[Periodic Cleanup] Checking for inactive participants across all sessions');
    
    // Get all active sessions
    const sessions = await prisma.session.findMany({
      select: { id: true }
    });
    
    for (const session of sessions) {
      await cleanupInactiveParticipants(session.id, io, prisma);
    }
  } catch (error) {
    logger.error('[Periodic Cleanup] Error:', error);
  }
}, CLEANUP_INTERVAL);

const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to database');
    
    // Initial cleanup of old participants on startup
    logger.info('[Startup] Cleaning up stale participants');
    const cutoffTime = new Date(Date.now() - INACTIVITY_TIMEOUT);
    const deleted = await prisma.participant.deleteMany({
      where: {
        lastSeenAt: {
          lt: cutoffTime
        }
      }
    });
    logger.info(`[Startup] Removed ${deleted.count} stale participants`);

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { prisma, io };
