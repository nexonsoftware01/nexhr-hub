import { cn } from '@/lib/utils';

type ChipVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const variantClasses: Record<ChipVariant, string> = {
  success: 'bg-success/8 text-success border-success/15 shadow-[0_1px_4px_-1px] shadow-success/10',
  warning: 'bg-warning/8 text-warning border-warning/15 shadow-[0_1px_4px_-1px] shadow-warning/10',
  error: 'bg-destructive/8 text-destructive border-destructive/15 shadow-[0_1px_4px_-1px] shadow-destructive/10',
  info: 'bg-info/8 text-info border-info/15 shadow-[0_1px_4px_-1px] shadow-info/10',
  neutral: 'bg-muted text-muted-foreground border-border',
};

const statusMap: Record<string, ChipVariant> = {
  ACCEPTED: 'success',
  APPROVED: 'success',
  APPLIED: 'warning',
  REJECTED: 'error',
  PENDING: 'warning',
  CHECKED_IN: 'info',
  LEAVE: 'warning',
  WFH: 'success',
  HOLIDAY: 'info',
  DIRECTOR: 'info',
  HR: 'success',
  EMPLOYEE: 'neutral',
  PRESENT: 'success',
  HALF_DAY: 'warning',
  ABSENT: 'error',
};

interface StatusChipProps {
  status: string;
  variant?: ChipVariant;
  className?: string;
}

export function StatusChip({ status, variant, className }: StatusChipProps) {
  const v = variant || statusMap[status] || 'neutral';
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
      variantClasses[v],
      className
    )}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
