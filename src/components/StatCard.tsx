import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  iconClassName?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, className, iconClassName }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-lg border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-card-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          iconClassName || 'bg-primary/10 text-primary'
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
