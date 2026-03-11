import { CheckCircle2, Calendar, Clock, Hash, ListTodo, Trophy, ArrowRight, FileText } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { Button } from './Button';
import { MarkdownRenderer } from './MarkdownRenderer';

export const SessionSummary: React.FC = () => {
  const { session, tasks } = useSessionStore();

  if (!session) return null;

  const completedTasks = tasks.filter((t) => t.status === 'completed' && t.storyPoints);
  const totalTasks = tasks.length;
  const estimatedTasks = completedTasks.length;
  
  // Calculate average story points (only for numeric values)
  const numericPoints = completedTasks
    .map((t) => parseFloat(t.storyPoints || '0'))
    .filter((n) => !isNaN(n));
  const averagePoints = numericPoints.length > 0
    ? (numericPoints.reduce((a, b) => a + b, 0) / numericPoints.length).toFixed(1)
    : '-';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStartNewSession = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Session Completed!</h1>
          <p className="text-white/80">{session.name}</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
          {/* Session Info */}
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium text-gray-900">{formatDate(session.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="font-medium text-gray-900">
                    {session.completedAt ? formatDate(session.completedAt) : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <ListTodo className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Tasks</p>
                  <p className="font-medium text-gray-900">{totalTasks}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estimatedTasks}</p>
                <p className="text-sm text-gray-500">Tasks with Estimates</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
                <Hash className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{averagePoints}</p>
                <p className="text-sm text-gray-500">Average Story Points</p>
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              Task Estimates
            </h2>
            
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No tasks were created in this session</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">#</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Task</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Story Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task, index) => (
                      <tr key={task.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                        <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{task.title}</p>
                          {task.description && (
                            <div className="mt-1 text-sm text-gray-600 max-w-md">
                              <MarkdownRenderer content={task.description} />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              task.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : task.status === 'voting'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {task.storyPoints ? (
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 text-primary-700 font-bold">
                              {task.storyPoints}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 bg-gray-50/50 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleStartNewSession}
                variant="primary"
                className="flex items-center justify-center gap-2"
              >
                Start New Session
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-6">
          Thank you for using Planning Poker!
        </p>
      </div>
    </div>
  );
};
