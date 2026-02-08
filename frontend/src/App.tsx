import { useEffect, useRef } from 'react';
import { useSessionStore } from './store/sessionStore';
import { useSocket } from './hooks/useSocket';
import { CreateSessionForm } from './components/CreateSessionForm';
import { SessionLobby } from './components/SessionLobby';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { ParticipantsList } from './components/ParticipantsList';
import { VotingArea } from './components/VotingArea';
import { Task } from './types';

function App() {
  const { session, participants, tasks, votes, currentTask, setSession, setTasks, error } = useSessionStore();
  const { disconnect, joinSession } = useSocket();
  const hasAutoJoined = useRef(false);
  const hasJoinedSocket = useRef(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    const participantName = urlParams.get('name');

    if (sessionId) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/sessions/${sessionId}`)
        .then((res) => {
          if (!res.ok) {
            if (res.status === 404) {
              throw new Error('Session not found. It may have been deleted.');
            }
            throw new Error(`Failed to fetch session: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log('[App] Session loaded:', data);
          setSession(data);
          setTasks(data.tasks || []);

          if (participantName && !hasAutoJoined.current) {
            hasAutoJoined.current = true;
            setTimeout(() => {
              joinSession(data.id, decodeURIComponent(participantName));
              hasJoinedSocket.current = true;
            }, 100);
          }

          if (!participantName || hasAutoJoined.current) {
            const currentState = useSessionStore.getState();
            console.log('[App] Checking if we need to clear state. Current state:', {
              hasVotingState: !!currentState.votingState,
              hasVotingTaskId: !!currentState.votingState?.taskId,
              hasCurrentTask: !!currentState.currentTask,
            });
            
            if (!currentState.votingState || !currentState.currentTask) {
              console.log('[App] Clearing state on session load');
              useSessionStore.setState({
                currentTask: null,
                votingState: null,
                votes: [],
                myVote: null,
              });
            } else {
              console.log('[App] Not clearing state - votingState or currentTask already exists');
            }
          }
        })
        .catch((error) => {
          console.error('[App] Failed to fetch session:', error);
          useSessionStore.setState({ error: error.message || 'Failed to load session' });
        });
    }

    return () => {
      disconnect();
    };
  }, []);

  const handleTaskSelect = (task: Task) => {
    useSessionStore.setState({ currentTask: task });
  };

  console.log('[App] Render:', { session: !!session, participants: participants.length, currentTask: !!currentTask, error: !!error });

  if (error) {
    console.error('[App] Showing error screen:', error);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="btn btn-primary w-full"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    console.log('[App] Showing CreateSessionForm');
    return <CreateSessionForm />;
  }

  console.log('[App] Session exists, checking join status:', { hasJoined: hasJoinedSocket.current, participants: participants.length });

  if (!hasJoinedSocket.current && participants.length === 0) {
    console.log('[App] Showing SessionLobby');
    return <SessionLobby />;
  }

  console.log('[App] Showing main session screen');
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{session.name}</h1>
          <p className="text-white/80">
            Share this link: <span className="font-mono bg-white/20 px-2 py-1 rounded">
              {window.location.href.split('&')[0]}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <ParticipantsList votes={votes} />
            <TaskForm />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <VotingArea task={currentTask} />
            <TaskList onTaskSelect={handleTaskSelect} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
