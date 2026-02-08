import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { z } from 'zod';

const router = Router();

const createTaskSchema = z.object({
  sessionId: z.string().uuid(),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const task = await prisma.task.create({
      data: {
        sessionId: data.sessionId,
        title: data.title,
        description: data.description,
      },
    });
    res.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
});

router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { sessionId: req.params.sessionId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { status, storyPoints } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status,
        storyPoints,
      },
    });
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

export default router;
