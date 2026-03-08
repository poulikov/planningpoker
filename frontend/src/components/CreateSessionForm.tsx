import { useState } from 'react';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import { useSessionStore } from '../store/sessionStore';
import { config } from '../lib/config';
import { setUserName, setAuthorId, generateUserId } from '../lib/userId';

export const CreateSessionForm = () => {
  const [sessionName, setSessionName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [votingTimeout, setVotingTimeout] = useState(120);
  const [isLoading, setIsLoading] = useState(false);
  const { setSession, setLoading, setError } = useSessionStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim() || !participantName.trim()) return;

    setIsLoading(true);
    setLoading(true);
    setError(null);

    // Generate authorId for the session creator
    const authorId = generateUserId();

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sessionName, authorId, votingTimeout }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const session = await response.json();
      setSession(session);

      // Save the name and authorId for this session
      setUserName(session.id, participantName.trim());
      setAuthorId(session.id, authorId);
      
      // Don't add name to URL - user will enter it in the lobby
      window.history.pushState({}, '', `/?session=${session.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create session');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          Planning Poker
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Your Name"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Enter your name"
            required
          />
          <Input
            label="Session Name"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Enter session name"
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Voting Timeout (seconds)</label>
            <select
              value={votingTimeout}
              onChange={(e) => setVotingTimeout(Number(e.target.value))}
              className="input w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value={60}>60 seconds</option>
              <option value={90}>90 seconds</option>
              <option value={120}>120 seconds</option>
              <option value={180}>180 seconds</option>
              <option value={300}>300 seconds</option>
            </select>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating...' : 'Create Session'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
