import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StatusChip } from '@/components/StatusChip';
import { leaveApi, LeaveResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { CalendarIcon, CalendarOff, Loader2, CheckCircle2, AlertTriangle, Clock, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeaveApply() {
  const [date, setDate] = useState<Date>();
  const [calendarOpen, setCalendarOpen] = useState(false);
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
      handleApiError(err, { title: 'Leave Request Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in-up">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-28 w-28 rounded-full bg-accent/5 blur-xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <CalendarOff className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">Apply Leave</h1>
            <p className="text-sm text-primary-foreground/60">Submit a leave request</p>
          </div>
        </div>
      </div>

      {/* Policy cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success shrink-0">
            <CheckCircle2 className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">1st Leave Free</p>
            <p className="text-xs text-muted-foreground mt-0.5">No salary deduction</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning shrink-0">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">Extra Leave</p>
            <p className="text-xs text-muted-foreground mt-0.5">Full day salary deduction</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 text-info shrink-0">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">Before 11:30 AM</p>
            <p className="text-xs text-muted-foreground mt-0.5">Same-day cutoff time</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <Ban className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">Leave Request</h2>
            <p className="text-xs text-muted-foreground">Fill in the details below</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Date</label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full justify-start text-left font-normal rounded-xl h-12', !date && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : 'Select a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { setDate(d); setCalendarOpen(false); }}
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
            rows={4}
            required
            className="rounded-xl resize-none"
          />
        </div>

        <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={loading || !date || !reason.trim()}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CalendarOff className="h-5 w-5 mr-2" />}
          Submit Leave
        </Button>
      </form>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-success/20 bg-success/5 p-6 shadow-card space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 shrink-0">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <h3 className="font-semibold text-card-foreground text-base">Leave Applied</h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 rounded-xl bg-card border border-border p-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Date</p>
                <p className="text-sm font-semibold text-card-foreground mt-1">{result.date}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Status</p>
                <div className="mt-1"><StatusChip status={result.status} /></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Salary Deduction</p>
                {result.salaryDeductionApplicable ? (
                  <p className="text-sm font-semibold text-warning mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Applicable
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-success mt-1">Not Applicable</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
