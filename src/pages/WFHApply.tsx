import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StatusChip } from '@/components/StatusChip';
import { PageHeader } from '@/components/PageHeader';
import { wfhApi, WfhResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { CalendarIcon, Home, Loader2, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WFHApply() {
  const [date, setDate] = useState<Date>();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WfhResponse | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !reason.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await wfhApi.apply({ date: format(date, 'yyyy-MM-dd'), reason: reason.trim() });
      setResult(res.data);
      toast({ title: 'WFH Request Submitted', description: res.message });
    } catch (err: any) {
      handleApiError(err, { title: 'WFH Request Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-fade-in-up">
      <PageHeader title="Apply WFH" description="Request to work from home" icon={Home} iconClassName="bg-success/10 text-success" />

      {/* Policy hint */}
      <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/5 p-4">
        <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
        <div className="text-sm text-card-foreground">
          <p className="font-semibold">WFH Policy</p>
          <p className="mt-1 text-muted-foreground leading-relaxed">
            1st WFH per month is auto-approved. Additional WFH requests require manager approval. WFH can only be applied before 11:30 AM.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full justify-start text-left font-normal rounded-xl h-11', !date && 'text-muted-foreground')}>
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
            placeholder="Why do you need to work from home?"
            rows={3}
            required
            className="rounded-xl"
          />
        </div>

        <Button type="submit" className="w-full h-11 rounded-xl" disabled={loading || !date || !reason.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Submit Request
        </Button>
      </form>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-success/20 bg-success/5 p-5 shadow-card space-y-3"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <h3 className="font-semibold text-card-foreground">Request Submitted</h3>
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Salary Deduction</span>
                <span className="font-medium">{result.salaryDeductionApplicable ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
