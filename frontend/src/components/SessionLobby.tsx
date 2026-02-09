import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import { useSessionStore } from '../store/sessionStore';
import { useSocket } from '../hooks/useSocket';
import { generateUserId, setUserId, setUserName, getUserName } from '../lib/userId';

export const SessionLobby = () => {
  const [participantName, setParticipantName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { session, participants, setLoading, setError } = useSessionStore();
  const { joinSession } = useSocket();

  // Load saved name from localStorage on mount
  useEffect(() => {
    if (session) {
      const savedName = getUserName(session.id);
      if (savedName) {
        console.log('[SessionLobby] Loaded saved name:', savedName);
        setParticipantName(savedName);
      }
    }
  }, [session]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[SessionLobby] handleJoin called:', { participantName, sessionId: session?.id });
    
    if (!participantName.trim() || !session) {
      console.log('[SessionLobby] Cannot join - empty name or no session');
      return;
    }

    setIsJoining(true);
    setLoading(true);
    setError(null);

    // Generate unique ID for this user
    const userId = generateUserId();
    
    // Save to localStorage
    setUserId(session.id, userId);
    setUserName(session.id, participantName.trim());
    
    // Add userId to URL for auto-reconnect on refresh
    // Format: ?session=xxx&pid=uuid&name=username
    const newUrl = `/?session=${session.id}&pid=${userId}&name=${encodeURIComponent(participantName.trim())}`;
    console.log('[SessionLobby] Updating URL to:', newUrl);
    window.history.pushState({}, '', newUrl);
    
    // Join with name and userId
    joinSession(session.id, participantName.trim(), userId);
  };

  const copyInviteLink = () => {
    if (!session) return;
    // ALWAYS copy link WITHOUT name or userId parameters
    const link = `${window.location.origin}/?session=${session.id}`;
    console.log('[SessionLobby] Copying invite link:', link);
    navigator.clipboard.writeText(link);
    alert('Invite link copied! This link does NOT contain your name or ID.');
  };

  console.log('[SessionLobby] Render:', { sessionId: session?.id, participantsCount: participants.length });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-4">Join Session</h2>
        
        {session && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 font-medium mb-2">Session: {session.name}</p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
              <p className="text-xs text-yellow-800 font-medium mb-1">⚠️ Invite Link (SHARE THIS):</p>
              <code className="text-xs bg-white px-2 py-1 rounded block break-all">
                {window.location.origin}/?session={session.id}
              </code>
              <Button onClick={copyInviteLink} variant="secondary" className="w-full text-xs mt-2">
                Copy Clean Invite Link
              </Button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Current Participants ({participants.length})
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
          <p className="text-xs text-gray-500">
            You can use any name. Multiple people can have the same name - each will get a unique ID.
          </p>
          <Button type="submit" disabled={isJoining || !participantName.trim()} className="w-full">
            {isJoining ? 'Joining...' : 'Join Session'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
