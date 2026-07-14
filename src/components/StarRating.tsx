import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
};

export function StarRating({ value, onChange, readOnly = false, size = 'md', className }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const interactive = !readOnly && !!onChange;
  const active = hover ?? value;

  return (
    <div
      className={cn('inline-flex items-center gap-1', className)}
      onMouseLeave={() => interactive && setHover(null)}
      role={interactive ? 'radiogroup' : undefined}
      aria-label="Star rating"
    >
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= active;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            aria-checked={interactive ? star === value : undefined}
            role={interactive ? 'radio' : undefined}
            onClick={() => interactive && onChange!(star)}
            onMouseEnter={() => interactive && setHover(star)}
            className={cn(
              'transition-transform duration-150',
              interactive && 'cursor-pointer hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-warning/40 rounded',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizeMap[size],
                'transition-colors duration-150',
                filled ? 'fill-warning text-warning' : 'fill-transparent text-muted-foreground/30'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
