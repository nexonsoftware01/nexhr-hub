import { cn } from '@/lib/utils';

type ChipVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const variantClasses: Record<ChipVariant, string> = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-info/10 text-info border-info/20',
  neutral: 'bg-muted text-muted-foreground border-border',
};

const statusMap: Record<string, ChipVariant> = {
  ACCEPTED: 'success',
  APPROVED: 'success',
  APPLIED: 'warning',
  REJECTED: 'error',
  PENDING: 'warning',
  SUPER_ADMIN: 'info',
  HR: 'success',
  EMPLOYEE: 'neutral',
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
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide',
      variantClasses[v],
      className
    )}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
