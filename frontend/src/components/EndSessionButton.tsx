import { useState } from 'react';
import { Power } from 'lucide-react';
import { Button } from './Button';
import { ConfirmModal } from './ConfirmModal';
import { useSocket } from '../hooks/useSocket';
import { useSessionStore } from '../store/sessionStore';
import { isSessionAuthor } from '../lib/userId';

export const EndSessionButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { session } = useSessionStore();
  const { completeSession } = useSocket();

  const isAuthor = session ? isSessionAuthor(session.id, session.authorId) : false;

  // Only show for author and active sessions
  if (!isAuthor || session?.status === 'completed') {
    return null;
  }

  const handleEndSession = () => {
    completeSession();
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Power className="w-4 h-4" />
        End Session
      </Button>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleEndSession}
        title="End Session?"
        message="Are you sure you want to end this session? This action cannot be undone. All participants will see the final results."
        confirmText="End Session"
        cancelText="Cancel"
        variant="warning"
      />
    </>
  );
};
