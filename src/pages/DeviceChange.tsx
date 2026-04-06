import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusChip } from '@/components/StatusChip';
import { deviceChangeApi, DeviceChangeResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error';
import { Smartphone, Loader2, CheckCircle, Send, Clock, History } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DeviceChange() {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState<DeviceChangeResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const { toast } = useToast();

  const hasPending = history.some(r => r.status === 'PENDING');

  const fetchHistory = () => {
    setHistoryLoading(true);
    deviceChangeApi.myRequests()
      .then(res => setHistory(res.data || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await deviceChangeApi.apply({ reason: reason.trim() });
      toast({ title: 'Request Submitted', description: 'Your device change request has been submitted for approval.' });
      setReason('');
      setSubmitted(true);
      fetchHistory();
    } catch (err: any) {
      handleApiError(err, { title: 'Request Failed' });
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
            <Smartphone className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">Change Device</h1>
            <p className="text-sm text-primary-foreground/60">Request to register a new device for attendance</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">Submit Request</h2>
            <p className="text-xs text-muted-foreground">Your current device will be removed once approved</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Reason</label>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g., Changed my phone, old device lost/damaged..."
            rows={3}
            required
            className="rounded-xl resize-none"
          />
        </div>

        <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={loading || !reason.trim() || hasPending}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Smartphone className="h-5 w-5 mr-2" />}
          {hasPending ? 'Request Already Pending' : 'Submit Request'}
        </Button>
      </form>

      {/* Success */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-success/20 bg-success/5 p-5 flex items-start gap-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 shrink-0">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">Request Submitted</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your device change request has been sent to HR for approval. Once approved, your current device will be removed and you can register your new device.
            </p>
          </div>
        </motion.div>
      )}

      {/* History */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          Request History
        </h2>

        {historyLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-3">
            {history.map(req => (
              <div key={req.id} className="rounded-xl border border-border bg-card p-4 shadow-card flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 text-info shrink-0">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-card-foreground">Device Change</p>
                    <StatusChip status={req.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{req.reason}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {req.comment && <span className="ml-2">— {req.comment}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-10 text-center">
            <Smartphone className="h-6 w-6 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No previous requests</p>
          </div>
        )}
      </div>
    </div>
  );
}
