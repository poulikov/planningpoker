import { cn } from '../lib/utils';

interface VoteCardProps {
  value: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
}

// Type for value categories used for color mapping
export type ValueCategory = 
  | 'zero' 
  | 'small' 
  | 'medium' 
  | 'large' 
  | 'xlarge' 
  | 'special' 
  | 'low' 
  | 'medium-confidence' 
  | 'high' 
  | 'unknown';

/**
 * Determine the category of a value for color mapping
 * Handles different scale types: numeric, t-shirt sizes, confidence levels
 */
export const getValueCategory = (value: string): ValueCategory => {
  // Special values
  if (value === '?' || value === '☕') return 'special';
  
  // T-shirt sizes
  const tshirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  if (tshirtSizes.includes(value)) {
    switch (value) {
      case 'XS': return 'zero';
      case 'S': return 'small';
      case 'M': return 'medium';
      case 'L': return 'large';
      case 'XL':
      case 'XXL': return 'xlarge';
      default: return 'special';
    }
  }
  
  // Confidence levels
  const confidenceMap: Record<string, ValueCategory> = {
    'Low': 'low',
    'Medium': 'medium-confidence',
    'High': 'high',
    'Unknown': 'unknown',
  };
  if (value in confidenceMap) {
    return confidenceMap[value];
  }
  
  // Numeric values (including fractions like '½')
  if (value === '0' || value === '½') return 'zero';
  
  const num = parseInt(value);
  if (isNaN(num)) return 'special';
  
  if (num <= 3) return 'small';
  if (num <= 8) return 'medium';
  if (num <= 13 || num <= 20) return 'large';
  return 'xlarge';
};

/**
 * Get color gradient based on value category
 */
export const getGradient = (category: ValueCategory): string => {
  switch (category) {
    case 'zero':
      return 'from-gray-300 to-gray-400';
    case 'small':
      return 'from-green-400 to-green-500';
    case 'medium':
    case 'medium-confidence':
      return 'from-yellow-400 to-yellow-500';
    case 'large':
      return 'from-orange-400 to-orange-500';
    case 'xlarge':
      return 'from-red-400 to-red-500';
    case 'low':
      return 'from-red-400 to-red-500';
    case 'high':
      return 'from-green-400 to-green-500';
    case 'unknown':
      return 'from-gray-400 to-gray-500';
    case 'special':
    default:
      return 'from-gray-200 to-gray-300';
  }
};

/**
 * Get text color based on value category for better contrast
 */
export const getTextColor = (category: ValueCategory): string => {
  switch (category) {
    case 'special':
      return 'text-gray-700';
    case 'unknown':
      return 'text-gray-600';
    default:
      return 'text-white';
  }
};

/**
 * Check if a value is a "voting" value (not a special one)
 * Used to filter values when selecting final estimate
 */
export const isVotingValue = (value: string): boolean => {
  const nonVotingValues = ['?', '☕', 'Unknown'];
  return !nonVotingValues.includes(value);
};

export const VoteCard = ({ value, isSelected, onClick, disabled, compact }: VoteCardProps) => {
  const category = getValueCategory(value);
  const gradient = getGradient(category);
  const textColor = getTextColor(category);

  // Determine text size based on content length and compact mode
  const getTextSize = () => {
    const length = value.length;
    if (compact) {
      if (length > 5) return 'text-[9px] leading-tight';
      if (length > 3) return 'text-[10px]';
      return 'text-xs';
    }
    // Normal mode
    if (length > 5) return 'text-xs leading-tight px-1';
    if (length > 3) return 'text-sm';
    if (length > 2) return 'text-lg';
    return 'text-2xl';
  };

  // Determine card size based on content length
  const getCardSize = () => {
    if (compact) {
      return value.length > 5 ? 'w-14 h-14' : 'w-12 h-12';
    }
    return value.length > 5 ? 'w-24 h-20' : 'w-20 h-20';
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative rounded-xl bg-gradient-to-br shadow-md',
        'transition-all duration-200 hover:scale-105 hover:shadow-lg',
        'flex items-center justify-center font-bold text-center',
        'active:scale-95',
        gradient,
        getCardSize(),
        getTextSize(),
        isSelected && 'ring-4 ring-primary-500 scale-110 shadow-xl',
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
      )}
    >
      <span className={cn('drop-shadow-md', textColor)}>
        {value}
      </span>
    </button>
  );
};
