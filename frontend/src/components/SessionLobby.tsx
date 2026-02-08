import { useState } from 'react';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import { useSessionStore } from '../store/sessionStore';
import { useSocket } from '../hooks/useSocket';

export const SessionLobby = () => {
  const [participantName, setParticipantName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { session, participants, setLoading, setError } = useSessionStore();
  const { joinSession } = useSocket();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim() || !session) return;

    setIsJoining(true);
    setLoading(true);
    setError(null);

    joinSession(session.id, participantName);
  };

  const copyInviteLink = () => {
    if (!session) return;
    const link = `${window.location.origin}/?session=${session.id}`;
    navigator.clipboard.writeText(link);
    alert('Invite link copied to clipboard!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-4">Session Lobby</h2>
        <p className="text-gray-600 text-center mb-6">
          Waiting for participants to join the session
        </p>

        {session && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Session: {session.name}</p>
            <Button onClick={copyInviteLink} variant="secondary" className="w-full text-sm">
              Copy Invite Link
            </Button>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Participants ({participants.length})
          </h3>
          {participants.length === 0 ? (
            <p className="text-gray-500 text-sm">No participants yet</p>
          ) : (
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium">
                    {participant.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm">{participant.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <Input
            label="Your Name"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Enter your name"
            required
          />
          <Button type="submit" disabled={isJoining || !participantName.trim()} className="w-full">
            {isJoining ? 'Joining...' : 'Join Session'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
