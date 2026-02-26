import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StatusChip } from '@/components/StatusChip';
import { leaveApi, LeaveResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CalendarIcon, CalendarOff, Loader2, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeaveApply() {
  const [date, setDate] = useState<Date>();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LeaveResponse | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !reason.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await leaveApi.apply({ date: format(date, 'yyyy-MM-dd'), reason: reason.trim() });
      setResult(res.data);
      toast({ title: 'Leave Applied', description: res.message });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Apply Leave</h1>
        <p className="mt-1 text-sm text-muted-foreground">Submit a leave request</p>
      </div>

      {/* Policy hint */}
      <div className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/5 p-4">
        <Info className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div className="text-sm text-card-foreground">
          <p className="font-medium">Leave Policy</p>
          <p className="mt-1 text-muted-foreground">
            1st leave per month is allowed without salary deduction. Additional leaves may affect your salary. Leave can only be applied before 11:30 AM.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
            <CalendarOff className="h-5 w-5" />
          </div>
          <h2 className="font-semibold text-card-foreground">Leave Request</h2>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={d => d < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Reason</label>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for leave..."
            rows={3}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading || !date || !reason.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Submit Leave
        </Button>
      </form>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <h3 className="font-semibold text-card-foreground">Leave Applied</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{result.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusChip status={result.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Salary Deduction</span>
                {result.salaryDeductionApplicable ? (
                  <span className="flex items-center gap-1 text-warning font-medium text-xs">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Applicable
                  </span>
                ) : (
                  <span className="text-success font-medium text-xs">Not Applicable</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
