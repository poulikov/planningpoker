import { cn } from '../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => {
  return (
    <div className={cn('card bg-white rounded-xl shadow-lg p-6', className)}>
      {children}
    </div>
  );
};
