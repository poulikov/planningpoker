import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { z } from 'zod';

const router = Router();

// Inactivity timeout: 2 minutes (same as in handlers)
const INACTIVITY_TIMEOUT = 2 * 60 * 1000;

const createSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required'),
  authorId: z.string().min(1, 'Author ID is required'),
  votingTimeout: z.number().min(10).max(600).optional().default(120),
  storyPointsScale: z.string().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createSessionSchema.parse(req.body);
    const session = await prisma.session.create({
      data: {
        name: data.name,
        authorId: data.authorId,
        votingTimeout: data.votingTimeout,
        storyPointsScale: data.storyPointsScale || JSON.stringify(['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕']), // Default: Standard Fibonacci
      },
    });
    res.json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Error creating session:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const cutoffTime = new Date(Date.now() - INACTIVITY_TIMEOUT);
    
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        participants: {
          where: {
            lastSeenAt: {
              gte: cutoffTime
            }
          },
          orderBy: { joinedAt: 'asc' },
        },
        tasks: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Complete a session
router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { participantId } = req.body;
    
    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    // Get session to verify author
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Only author can complete the session
    if (session.authorId !== participantId) {
      return res.status(403).json({ error: 'Only session author can complete the session' });
    }

    // Check if already completed
    if (session.status === 'completed') {
      return res.status(400).json({ error: 'Session is already completed' });
    }

    // Update session status
    const updatedSession = await prisma.session.update({
      where: { id: req.params.id },
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

    res.json(updatedSession);
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

export default router;
