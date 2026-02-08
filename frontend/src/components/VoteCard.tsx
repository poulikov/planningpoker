import { cn } from '../lib/utils';
import { StoryPoint } from '../types';

interface VoteCardProps {
  value: StoryPoint;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const VoteCard = ({ value, isSelected, onClick, disabled }: VoteCardProps) => {
  const getGradient = (value: StoryPoint) => {
    if (value === '?' || value === '☕') {
      return 'from-gray-200 to-gray-300';
    }
    const num = parseInt(value);
    if (num === 0) return 'from-gray-300 to-gray-400';
    if (num <= 3) return 'from-green-400 to-green-500';
    if (num <= 8) return 'from-yellow-400 to-yellow-500';
    if (num <= 13) return 'from-orange-400 to-orange-500';
    return 'from-red-400 to-red-500';
  };

  const isSpecial = value === '?' || value === '☕';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative w-20 h-20 rounded-xl bg-gradient-to-br shadow-md',
        'transition-all duration-200 hover:scale-105 hover:shadow-lg',
        'flex items-center justify-center text-2xl font-bold',
        'active:scale-95',
        getGradient(value),
        isSelected && 'ring-4 ring-primary-500 scale-110 shadow-xl',
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
      )}
    >
      <span className="drop-shadow-md">{isSpecial ? value : value}</span>
    </button>
  );
};
