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
import { CalendarIcon, CalendarOff, Loader2, CheckCircle2, AlertTriangle, Clock, Ban, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeaveApply() {
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState<'regular' | 'client' | null>(null);
  const [results, setResults] = useState<LeaveResponse[]>([]);
  const { toast } = useToast();

  const effectiveToDate = toDate || fromDate; // single day if toDate not set

  const handleSubmit = async (type: 'regular' | 'client') => {
    if (!fromDate || !reason.trim()) return;
    setLoading(type);
    setResults([]);
    try {
      const from = format(fromDate, 'yyyy-MM-dd');
      const to = format(effectiveToDate!, 'yyyy-MM-dd');

      const res = await leaveApi.applyRange({
        fromDate: from,
        toDate: to,
        reason: reason.trim(),
        leaveType: type === 'client' ? 'CLIENT_HOLIDAY' : 'REGULAR',
      });

      setResults(res.data || []);
      const count = (res.data || []).length;
      toast({
        title: type === 'regular' ? `${count} Leave(s) Applied` : `${count} Client Leave(s) Requested`,
        description: type === 'regular'
          ? `${count} leave(s) applied successfully`
          : `${count} request(s) sent to your manager for approval`,
      });
      setFromDate(undefined); setToDate(undefined); setReason('');
    } catch (err: any) {
      handleApiError(err, { title: type === 'regular' ? 'Leave Failed' : 'Client Leave Failed' });
    } finally {
      setLoading(null);
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
            <p className="text-sm text-primary-foreground/60">Submit a regular or client holiday leave</p>
          </div>
        </div>
      </div>

      {/* Policy cards */}
      <div className="grid sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">12 Leaves / Year</p>
            <p className="text-xs text-muted-foreground mt-0.5">Annual casual leave allowance</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">Beyond 12</p>
            <p className="text-xs text-muted-foreground mt-0.5">Full day salary deducted</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 text-info shrink-0">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">Before 11:30 AM</p>
            <p className="text-xs text-muted-foreground mt-0.5">Same-day cutoff</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">Client Holiday</p>
            <p className="text-xs text-muted-foreground mt-0.5">No deduction, needs approval</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <Ban className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">Leave Request</h2>
            <p className="text-xs text-muted-foreground">Select date(s) and choose the leave type. Weekends & holidays are automatically skipped.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">From Date</label>
            <Popover open={fromOpen} onOpenChange={setFromOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal rounded-xl h-12', !fromDate && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, 'dd MMM yyyy') : 'Start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={(d) => { setFromDate(d); setFromOpen(false); if (toDate && d && toDate < d) setToDate(undefined); }}
                  disabled={d => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">To Date <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Popover open={toOpen} onOpenChange={setToOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal rounded-xl h-12', !toDate && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, 'dd MMM yyyy') : 'Same as from'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={(d) => { setToDate(d); setToOpen(false); }}
                  disabled={d => d < (fromDate || new Date(new Date().setHours(0, 0, 0, 0)))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Reason</label>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for leave or client holiday name (e.g., Good Friday — Client XYZ)"
            rows={4}
            required
            className="rounded-xl resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handleSubmit('regular')}
            className="h-12 rounded-xl text-base gap-2"
            disabled={loading !== null || !fromDate || !reason.trim()}
          >
            {loading === 'regular' ? <Loader2 className="h-5 w-5 animate-spin" /> : <CalendarOff className="h-5 w-5" />}
            Submit Leave
          </Button>
          <Button
            onClick={() => handleSubmit('client')}
            className="h-12 rounded-xl text-base gap-2 bg-accent hover:bg-accent/90 text-white"
            disabled={loading !== null || !fromDate || !reason.trim()}
          >
            {loading === 'client' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Globe className="h-5 w-5" />}
            Submit Client Leave
          </Button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-6 shadow-card space-y-4 ${
              results[0]?.leaveType === 'CLIENT_HOLIDAY'
                ? 'border-info/20 bg-info/5'
                : 'border-success/20 bg-success/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                results[0]?.leaveType === 'CLIENT_HOLIDAY' ? 'bg-info/10' : 'bg-success/10'
              }`}>
                {results[0]?.leaveType === 'CLIENT_HOLIDAY'
                  ? <Globe className="h-5 w-5 text-info" />
                  : <CheckCircle2 className="h-5 w-5 text-success" />}
              </div>
              <h3 className="font-semibold text-card-foreground text-base">
                {results.length} Leave(s) {results[0]?.leaveType === 'CLIENT_HOLIDAY' ? 'Requested' : 'Applied'}
              </h3>
            </div>
            <div className="space-y-2">
              {results.map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-xl bg-card border border-border px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-card-foreground">
                      {new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <StatusChip status={r.status} />
                  </div>
                  {r.salaryDeductionApplicable ? (
                    <span className="text-xs text-warning font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />Deducted
                    </span>
                  ) : (
                    <span className="text-xs text-success font-semibold">No Deduction</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
