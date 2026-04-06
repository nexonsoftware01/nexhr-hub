import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusChip } from '@/components/StatusChip';
import { deviceChangeApi, DeviceChangeResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error';
import { Smartphone, Loader2, CheckCircle, XCircle, Send, Clock, History, Mail, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DeviceChange() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'DIRECTOR' || user?.role === 'HR';

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-28 w-28 rounded-full bg-accent/5 blur-xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <Smartphone className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">Device Management</h1>
            <p className="text-sm text-primary-foreground/60">
              {isAdmin ? 'Review and approve device change requests' : 'Request to register a new device for attendance'}
            </p>
          </div>
        </div>
      </div>

      {/* Admin view: pending approvals */}
      {isAdmin && <PendingApprovals />}

      {/* Employee view: request form (Director doesn't punch in, so no form for them) */}
      {user?.role !== 'DIRECTOR' && <RequestForm />}

      {/* Request history — visible to all */}
      {user?.role !== 'DIRECTOR' && <RequestHistory />}
    </div>
  );
}

function RequestForm() {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    deviceChangeApi.myRequests()
      .then(res => {
        if ((res.data || []).some(r => r.status === 'PENDING')) setHasPending(true);
      })
      .catch(() => {});
  }, [submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await deviceChangeApi.apply({ reason: reason.trim() });
      toast({ title: 'Request Submitted', description: 'Your device change request has been sent for approval.' });
      setReason('');
      setSubmitted(true);
      setHasPending(true);
    } catch (err: any) {
      handleApiError(err, { title: 'Request Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">Request Device Change</h2>
            <p className="text-xs text-muted-foreground">Your current device will be removed once approved by HR</p>
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
              Your device change request has been sent to HR for approval. Once approved, your current device will be removed and you can register your new device on next login.
            </p>
          </div>
        </motion.div>
      )}
    </>
  );
}

function RequestHistory() {
  const [history, setHistory] = useState<DeviceChangeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deviceChangeApi.myRequests()
      .then(res => setHistory(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <History className="h-5 w-5 text-muted-foreground" />
        My Requests
      </h2>

      {loading ? (
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
  );
}

function PendingApprovals() {
  const [pending, setPending] = useState<DeviceChangeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    deviceChangeApi.pending()
      .then(res => setPending(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: number, action: 'APPROVE' | 'REJECT') => {
    setActioningId(id);
    try {
      await deviceChangeApi.action({ id, action, comment: comments[id]?.trim() || undefined });
      toast({
        title: action === 'APPROVE' ? 'Approved' : 'Rejected',
        description: `Device change request has been ${action.toLowerCase()}d.${action === 'APPROVE' ? ' Employee can now register their new device.' : ''}`,
      });
      setPending(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      handleApiError(err, { title: `${action} Failed` });
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        Pending Approvals
        {pending.length > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-white px-1.5">
            {pending.length}
          </span>
        )}
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : pending.length > 0 ? (
        <div className="space-y-4">
          {pending.map(req => (
            <motion.div
              key={req.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10 text-info font-semibold text-sm shrink-0">
                    {req.employeeName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground">{req.employeeName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />{req.employeeEmail}
                    </p>
                  </div>
                </div>
                <StatusChip status={req.status} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 rounded-xl bg-muted/20 border border-border/50 p-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Request Type</p>
                  <p className="text-sm font-semibold text-info mt-1 flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" />Device Change</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Submitted</p>
                  <p className="text-sm font-semibold text-card-foreground mt-1">
                    {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-info/5 border border-info/10 p-3">
                <Smartphone className="h-4 w-4 text-info shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reason</p>
                  <p className="text-sm text-card-foreground mt-0.5">{req.reason}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Textarea
                  placeholder="Add a comment (optional)..."
                  value={comments[req.id] || ''}
                  onChange={e => setComments(prev => ({ ...prev, [req.id]: e.target.value }))}
                  rows={2}
                  className="rounded-xl resize-none text-sm"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAction(req.id, 'APPROVE')}
                    disabled={actioningId === req.id}
                    className="flex-1 h-11 rounded-xl gap-2 bg-success hover:bg-success/90 text-white"
                  >
                    {actioningId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleAction(req.id, 'REJECT')}
                    disabled={actioningId === req.id}
                    variant="outline"
                    className="flex-1 h-11 rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
                  >
                    {actioningId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-12 text-center">
          <Smartphone className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No pending device change requests</p>
        </div>
      )}
    </div>
  );
}
