import { useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { useSocket } from '../hooks/useSocket';
import { useSessionStore } from '../store/sessionStore';

export const TaskForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { session } = useSessionStore();
  const { createTask } = useSocket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !session) return;

    createTask(session.id, title, description);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-5 border border-white/20">
      <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Task description (optional)"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          rows={2}
        />
        <Button type="submit" variant="primary" className="w-full">
          Add Task
        </Button>
      </form>
    </div>
  );
};
