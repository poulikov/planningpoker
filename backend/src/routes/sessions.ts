import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { z } from 'zod';

const router = Router();

const createSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required'),
  votingTimeout: z.number().min(10).max(600).optional().default(120),
  storyPointsScale: z.string().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createSessionSchema.parse(req.body);
    const session = await prisma.session.create({
      data: {
        name: data.name,
        votingTimeout: data.votingTimeout,
        storyPointsScale: data.storyPointsScale || JSON.stringify(['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕']),
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
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        participants: true,
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

export default router;
