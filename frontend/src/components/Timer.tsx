import { cn } from '../lib/utils';

interface TimerProps {
  remainingTime: number | null;
  totalTime?: number;
}

export const Timer = ({ remainingTime, totalTime = 120 }: TimerProps) => {
  if (remainingTime === null) return null;

  const percentage = (remainingTime / totalTime) * 100;
  const getColor = () => {
    if (percentage > 50) return '#22c55e';
    if (percentage > 20) return '#f59e0b';
    return '#ef4444';
  };

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="absolute w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke={getColor()}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            'transition-all duration-300',
            percentage <= 10 && 'animate-pulse'
          )}
        />
      </svg>
      <div className="text-3xl font-bold" style={{ color: getColor() }}>
        {remainingTime}
      </div>
    </div>
  );
};
