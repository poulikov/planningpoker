import { useEffect, useRef, useState } from 'react';
import { useSessionStore } from './store/sessionStore';
import { useSocket } from './hooks/useSocket';
import { CreateSessionForm } from './components/CreateSessionForm';
import { SessionLobby } from './components/SessionLobby';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { ParticipantsList } from './components/ParticipantsList';
import { VotingArea } from './components/VotingArea';
import { Task } from './types';
import { config } from './lib/config';
import { getUserId, getUserName, setUserId, setUserName } from './lib/userId';

function App() {
  const { session, votes, currentTask, setSession, setTasks, error, isConnected } = useSessionStore();
  const { disconnect, joinSession } = useSocket();
  const hasAutoJoined = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  // Get URL params
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session');
  const urlName = urlParams.get('name');
  const urlUserId = urlParams.get('pid'); // participant ID

  console.log('[App] Initial render:', { 
    sessionId, 
    urlName,
    urlUserId,
    fullUrl: window.location.href,
    search: window.location.search 
  });

  useEffect(() => {
    console.log('[App] useEffect triggered, sessionId:', sessionId);

    if (sessionId) {
      setIsLoading(true);
      fetch(`${config.apiBaseUrl}/api/sessions/${sessionId}`)
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

          // Auto-join if we have both name and userId in URL
          if (urlName && urlUserId && !hasAutoJoined.current) {
            console.log('[App] Auto-joining with name and userId from URL:', { urlName, urlUserId });
            hasAutoJoined.current = true;
            setIsJoining(true);
            
            // Save to localStorage for consistency
            setUserId(sessionId, urlUserId);
            setUserName(sessionId, decodeURIComponent(urlName));
            
            setTimeout(() => {
              joinSession(data.id, decodeURIComponent(urlName), urlUserId);
            }, 100);
          } 
          // Also auto-join if we have saved credentials in localStorage (for old links)
          else {
            const savedUserId = getUserId(sessionId);
            const savedName = getUserName(sessionId);
            
            if (savedName && savedUserId && !hasAutoJoined.current) {
              console.log('[App] Auto-joining from localStorage:', { savedName, savedUserId });
              hasAutoJoined.current = true;
              setIsJoining(true);
              
              // Update URL to include the credentials
              const newUrl = `/?session=${sessionId}&pid=${savedUserId}&name=${encodeURIComponent(savedName)}`;
              window.history.replaceState({}, '', newUrl);
              
              setTimeout(() => {
                joinSession(data.id, savedName, savedUserId);
              }, 100);
            } else {
              console.log('[App] No auto-join:', { urlName, urlUserId, hasAutoJoined: hasAutoJoined.current });
            }
          }

          setIsLoading(false);
        })
        .catch((error) => {
          console.error('[App] Failed to fetch session:', error);
          useSessionStore.setState({ error: error.message || 'Failed to load session' });
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      disconnect();
    };
  }, []); // Run only once on mount

  // Track connection status
  useEffect(() => {
    console.log('[App] Connection status changed:', { isConnected, isJoining });
    if (isConnected && isJoining) {
      setIsJoining(false);
    }
  }, [isConnected, isJoining]);

  const handleTaskSelect = (task: Task) => {
    useSessionStore.setState({ currentTask: task });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
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

  // SIMPLE LOGIC:
  // - If name AND userId are in URL -> auto-join or show main screen
  // - If NO name or NO userId in URL -> show lobby
  
  console.log('[App] Render decision:', { 
    urlName, 
    urlUserId,
    isConnected, 
    isJoining,
    hasAutoJoined: hasAutoJoined.current 
  });

  // Has name and userId in URL - should be auto-joining or already joined
  if (urlName && urlUserId) {
    if (isConnected) {
      console.log('[App] Showing main screen - connected with credentials in URL');
      return (
        <div className="min-h-screen p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">{session.name}</h1>
              <p className="text-white/80 text-sm">
                Share: <span className="font-mono bg-white/20 px-2 py-1 rounded">
                  {window.location.origin}/?session={session.id}
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
    } else {
      // Still connecting
      console.log('[App] Showing connecting screen - credentials in URL but not connected yet');
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Connecting as {decodeURIComponent(urlName)}...</p>
          </div>
        </div>
      );
    }
  }

  // No credentials in URL - show lobby
  console.log('[App] Showing SessionLobby - no credentials in URL');
  return <SessionLobby />;
}

export default App;
