import { Router, Request, Response } from 'express';
import { prisma } from '../index';

const router = Router();

router.get('/task/:taskId', async (req: Request, res: Response) => {
  try {
    const votes = await prisma.vote.findMany({
      where: { taskId: req.params.taskId },
      include: {
        participant: true,
      },
    });
    res.json(votes);
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
});

export default router;
