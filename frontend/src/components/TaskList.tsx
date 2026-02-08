import { Task } from '../types';
import { useSessionStore } from '../store/sessionStore';
import { cn } from '../lib/utils';
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';

interface TaskListProps {
  onTaskSelect: (task: Task) => void;
}

export const TaskList = ({ onTaskSelect }: TaskListProps) => {
  const { tasks, currentTask, votingState } = useSessionStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'voting':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'voting':
        return <PlayCircle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const handleTaskClick = (task: Task) => {
    console.log('[TaskList] Task clicked:', task.id, task.title);
    onTaskSelect(task);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-5 border border-white/20">
      <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
        <span>Tasks</span>
        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {tasks.length}
        </span>
      </h3>
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Circle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tasks yet</p>
          <p className="text-xs mt-1">Add your first task above</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {tasks.map((task, index) => (
            <button
              key={task.id}
              onClick={() => handleTaskClick(task)}
              disabled={votingState !== null && votingState.taskId !== task.id}
              className={cn(
                'w-full text-left p-4 rounded-xl border-2 transition-all duration-200',
                'hover:shadow-lg active:scale-[0.98]',
                currentTask?.id === task.id
                  ? 'border-primary-500 bg-white shadow-lg ring-2 ring-primary-100'
                  : 'border-transparent bg-white/95 hover:bg-white hover:border-gray-200 shadow-md',
                votingState !== null && votingState.taskId !== task.id && 'opacity-50'
              )}
            >
              <div className="flex items-center gap-3">
                {/* Номер задачи */}
                <span className={cn(
                  'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
                  currentTask?.id === task.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                )}>
                  {index + 1}
                </span>
                
                {/* Контент задачи */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{task.title}</h4>
                  {task.storyPoints && (
                    <p className="text-sm text-primary-600 font-semibold mt-1">
                      {task.storyPoints} points
                    </p>
                  )}
                </div>
                
                {/* Статус */}
                <span
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap border',
                    getStatusColor(task.status)
                  )}
                >
                  {getStatusIcon(task.status)}
                  {task.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
