import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StatusChip } from '@/components/StatusChip';
import { regularizationApi, RegularizationResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { CalendarIcon, ClockAlert, Loader2, CheckCircle, Shield, Clock, Send, FileEdit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AttendanceRegularization() {
  const [date, setDate] = useState<Date>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [punchIn, setPunchIn] = useState('');
  const [punchOut, setPunchOut] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegularizationResponse | null>(null);
  const [history, setHistory] = useState<RegularizationResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const { toast } = useToast();

  const fetchHistory = () => {
    setHistoryLoading(true);
    regularizationApi.myRequests()
      .then(res => setHistory(res.data || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !punchIn || !punchOut || !reason.trim()) return;

    const dateStr = format(date, 'yyyy-MM-dd');

    setLoading(true);
    setResult(null);
    try {
      const res = await regularizationApi.apply({
        date: dateStr,
        punchIn: `${dateStr}T${punchIn}:00`,
        punchOut: `${dateStr}T${punchOut}:00`,
        reason: reason.trim(),
      });
      setResult(res.data);
      toast({ title: 'Request Submitted', description: 'Your regularization request has been sent to your manager.' });
      setDate(undefined); setPunchIn(''); setPunchOut(''); setReason('');
      fetchHistory();
    } catch (err: any) {
      handleApiError(err, { title: 'Regularization Failed' });
    } finally {
      setLoading(false);
    }
  };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in-up">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-28 w-28 rounded-full bg-accent/5 blur-xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <FileEdit className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">Attendance Regularization</h1>
            <p className="text-sm text-primary-foreground/60">Request correction for past attendance</p>
          </div>
        </div>
      </div>

      {/* Policy cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 text-info shrink-0">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">Past Dates Only</p>
            <p className="text-xs text-muted-foreground mt-0.5">Cannot regularize today or future</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning shrink-0">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">Manager Approval</p>
            <p className="text-xs text-muted-foreground mt-0.5">Requires manager to approve</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success shrink-0">
            <CheckCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">Updates Record</p>
            <p className="text-xs text-muted-foreground mt-0.5">Corrects attendance & payroll</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <ClockAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">Correction Request</h2>
            <p className="text-xs text-muted-foreground">Provide the correct punch times for the date</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Date</label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full justify-start text-left font-normal rounded-xl h-12', !date && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : 'Select a past date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { setDate(d); setCalendarOpen(false); }}
                disabled={d => d >= new Date(new Date().setHours(0, 0, 0, 0)) || d.getDay() === 0 || d.getDay() === 6}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Punch In Time</label>
            <Input
              type="time"
              value={punchIn}
              onChange={e => setPunchIn(e.target.value)}
              required
              className="rounded-xl h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Punch Out Time</label>
            <Input
              type="time"
              value={punchOut}
              onChange={e => setPunchOut(e.target.value)}
              required
              className="rounded-xl h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Reason</label>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Why do you need this correction? e.g., forgot to punch out, network issue..."
            rows={3}
            required
            className="rounded-xl resize-none"
          />
        </div>

        <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={loading || !date || !punchIn || !punchOut || !reason.trim()}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
          Submit Request
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
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <h3 className="font-semibold text-card-foreground text-base">Request Submitted</h3>
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
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Requested Times</p>
                <p className="text-sm font-semibold text-card-foreground mt-1">
                  {result.requestedPunchIn?.substring(11, 16)} — {result.requestedPunchOut?.substring(11, 16)}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request history */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">My Requests</h2>
        {historyLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-3">
            {history.map(req => (
              <div key={req.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-card-foreground">{req.date}</span>
                  </div>
                  <StatusChip status={req.status} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Requested In</p>
                    <p className="font-medium text-card-foreground mt-0.5">{req.requestedPunchIn?.substring(11, 16)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Requested Out</p>
                    <p className="font-medium text-card-foreground mt-0.5">{req.requestedPunchOut?.substring(11, 16)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Original Status</p>
                    <p className="font-medium text-card-foreground mt-0.5">{req.originalStatus?.replace('_', ' ') || 'No record'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reason</p>
                    <p className="font-medium text-card-foreground mt-0.5 truncate">{req.reason}</p>
                  </div>
                </div>
                {req.managerComment && (
                  <div className="mt-3 pt-3 border-t border-border text-xs">
                    <p className="text-muted-foreground">Manager Comment</p>
                    <p className="text-card-foreground mt-0.5">{req.managerComment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 mb-3">
              <FileEdit className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">No regularization requests yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
