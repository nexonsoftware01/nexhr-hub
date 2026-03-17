import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusChip } from '@/components/StatusChip';
import { regularizationApi, RegularizationResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error';
import { ClipboardCheck, Loader2, CheckCircle, XCircle, Clock, User, Mail, FileEdit, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegularizationApprovals() {
  const [requests, setRequests] = useState<RegularizationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const fetchPending = () => {
    setLoading(true);
    regularizationApi.pending()
      .then(res => setRequests(res.data || []))
      .catch(err => handleApiError(err, { title: 'Failed to load requests' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (id: number, action: 'APPROVE' | 'REJECT') => {
    setActioningId(id);
    try {
      await regularizationApi.action({ id, action, comment: comments[id]?.trim() || undefined });
      toast({
        title: action === 'APPROVE' ? 'Approved' : 'Rejected',
        description: `Regularization request has been ${action.toLowerCase()}d.`,
      });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      handleApiError(err, { title: `${action} Failed` });
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in-up">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-28 w-28 rounded-full bg-accent/5 blur-xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <ClipboardCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">Regularization Approvals</h1>
              <p className="text-sm text-primary-foreground/60">Review and action pending requests</p>
            </div>
          </div>
          {!loading && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm text-primary-foreground font-bold text-lg">
              {requests.length}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length > 0 ? (
        <AnimatePresence>
          <div className="space-y-4">
            {requests.map(req => (
              <motion.div
                key={req.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
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

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-muted/20 border border-border/50 p-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Date</p>
                    <p className="text-sm font-semibold text-card-foreground mt-1">{req.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Original Status</p>
                    <p className="text-sm font-semibold text-card-foreground mt-1">{req.originalStatus?.replace('_', ' ') || 'No record'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Original Times</p>
                    <p className="text-sm font-semibold text-card-foreground mt-1">
                      {req.originalPunchIn ? req.originalPunchIn.substring(11, 16) : '—'} — {req.originalPunchOut ? req.originalPunchOut.substring(11, 16) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Requested Times</p>
                    <p className="text-sm font-semibold text-accent mt-1">
                      {req.requestedPunchIn?.substring(11, 16)} — {req.requestedPunchOut?.substring(11, 16)}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                <div className="flex items-start gap-3 rounded-xl bg-warning/5 border border-warning/10 p-3">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reason</p>
                    <p className="text-sm text-card-foreground mt-0.5">{req.reason}</p>
                  </div>
                </div>

                {/* Comment + Actions */}
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
        </AnimatePresence>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <ClipboardCheck className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No pending requests</p>
          <p className="text-xs text-muted-foreground/60 mt-1">All regularization requests have been actioned</p>
        </div>
      )}
    </div>
  );
}
