import { memo, useMemo } from 'react';
import { Task, Vote } from '../types';
import { VoteCard, isVotingValue } from './VoteCard';
import { Timer } from './Timer';
import { Button } from './Button';
import { useSessionStore } from '../store/sessionStore';
import { useSocket } from '../hooks/useSocket';
import { isSessionAuthor } from '../lib/userId';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

export const VotingArea = memo(({ task }: { task: Task | null }) => {
  const { votingState, myVote, votes, session } = useSessionStore();
  const { startVoting, submitVote, revealVotes, resetVoting, completeTask } = useSocket();
  
  // Check if current user is the session author
  const isAuthor = session ? isSessionAuthor(session.id, session.authorId) : false;

  // Проверяем, разошлись ли оценки (есть ли разные значения)
  const hasDiverged = useMemo(() => {
    if (!votes || votes.length === 0) return false;
    const uniqueValues = new Set(votes.map((vote: Vote) => vote.value));
    return uniqueValues.size > 1;
  }, [votes]);

  // Default: Standard Fibonacci (0, 1, 2, 3, 5, 8, 13, 21, ?, ☕)
  const DEFAULT_SCALE = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];
  
  const scale = useMemo(() => {
    if (!session?.storyPointsScale) {
      return DEFAULT_SCALE;
    }
    try {
      const parsed = JSON.parse(session.storyPointsScale);
      return Array.isArray(parsed) ? parsed : DEFAULT_SCALE;
    } catch {
      return DEFAULT_SCALE;
    }
  }, [session?.storyPointsScale]);

  console.log('[VotingArea] Render:', { task: task?.id, votingState: !!votingState, isRevealed: votingState?.isRevealed });

  const handleStartVoting = () => {
    if (task) {
      startVoting(task.id);
    }
  };

  const handleSubmitVote = (value: string) => {
    console.log('[VotingArea] Submitting vote:', value, 'for task:', task?.id);
    if (votingState && task) {
      submitVote(task.id, value);
    }
  };

  const handleRevealVotes = () => {
    console.log('[VotingArea] Manual reveal votes requested');
    if (votingState) {
      revealVotes(votingState.taskId);
    }
  };

  const handleResetVoting = () => {
    console.log('[VotingArea] Reset voting requested');
    if (votingState) {
      resetVoting(votingState.taskId);
    }
  };

  const handleCompleteTask = (storyPoints: string) => {
    console.log('[VotingArea] Completing task:', task?.id, 'with points:', storyPoints);
    if (task) {
      completeTask(task.id, storyPoints);
    }
  };

  // Нет выбранной задачи
  if (!task) {
    console.log('[VotingArea] No task selected');
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
        <p className="text-gray-500 text-center">Select a task to start voting</p>
      </div>
    );
  }

  // Задача завершена
  if (task.status === 'completed') {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-3xl">✓</span>
          </div>
          <h3 className="text-2xl font-bold text-green-600 mb-2">Completed!</h3>
          <p className="text-gray-600 mb-4">
            Story Points: <span className="font-semibold text-primary-600">{task.storyPoints}</span>
          </p>
        </div>
      </div>
    );
  }

  // Нет активного голосования - показываем информацию о задаче
  if (!votingState) {
    console.log('[VotingArea] No voting state, showing start button for task:', task.id);
    const canStartVoting = session && isSessionAuthor(session.id, session.authorId);
    
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2 text-gray-900">{task.title}</h3>
        </div>
        {task.description && (
          <div className="mb-4 text-left">
            <MarkdownRenderer content={task.description} />
          </div>
        )}
        <div className="text-center mt-4">
          {canStartVoting ? (
            <Button onClick={handleStartVoting} className="text-lg px-8 py-3">
              Start Voting
            </Button>
          ) : (
            <p className="text-gray-500 text-sm">
              Waiting for the session author to start voting...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Активное голосование
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{task.title}</h3>
          {task.description && (
            <MarkdownRenderer content={task.description} />
          )}
        </div>
        <Timer remainingTime={votingState.remainingTime} totalTime={session?.votingTimeout || 120} />
      </div>

      {votingState.isRevealed ? (
        <div>
          <h4 className="text-lg font-semibold mb-4">Results</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {votes.map((vote) => (
              <div
                key={vote.id}
                className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200"
              >
                <p className="font-medium text-sm truncate">{vote.participant?.name}</p>
                <p className="text-2xl font-bold text-primary-600 mt-1">{vote.value}</p>
              </div>
            ))}
          </div>
          {hasDiverged && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-amber-800 font-medium">
                    Оценки разошлись!
                  </p>
                  <p className="text-amber-700 text-sm mt-1">
                    Участники выбрали разные значения. Можно перезапустить голосование для обсуждения или выбрать итоговую оценку.
                  </p>
                </div>
              </div>
            </div>
          )}
          {isAuthor ? (
            <>
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                <p className="w-full text-center text-gray-600 mb-2">Select final story points:</p>
                {scale
                  .filter((value) => isVotingValue(value))
                  .map((value) => (
                    <Button
                      key={value}
                      onClick={() => handleCompleteTask(value)}
                      variant="secondary"
                      className="px-3 py-1 text-sm"
                    >
                      {value}
                    </Button>
                  ))}
              </div>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={handleResetVoting} 
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Перезапустить голосование
                </Button>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 text-sm">
              Waiting for the session author to select the final estimate...
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="text-center text-gray-600 mb-4">
            {votingState.votesCount === 0
              ? 'Waiting for votes...'
              : `${votingState.votesCount}/${votingState.participantsCount} votes received`}
          </p>
          <div className="grid grid-cols-5 gap-3 mb-4">
            {scale.map((value) => (
              <VoteCard
                key={value}
                value={value}
                isSelected={myVote === value}
                onClick={() => handleSubmitVote(value)}
                disabled={!!myVote}
              />
            ))}
          </div>
          {isAuthor && (
            <div className="flex gap-2 justify-center">
              {votingState.votesCount > 0 && (
                <Button onClick={handleRevealVotes} variant="success">
                  Reveal Votes
                </Button>
              )}
              {votingState.votesCount > 0 && (
                <Button onClick={handleResetVoting} variant="secondary">
                  Reset
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
});
