import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusChip } from '@/components/StatusChip';
import { regularizationApi, leaveApi, deviceChangeApi, RegularizationResponse, LeaveResponse, DeviceChangeResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error';
import { ClipboardCheck, Loader2, CheckCircle, XCircle, Clock, User, Mail, FileEdit, AlertTriangle, Globe, CalendarOff, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegularizationApprovals() {
  const [requests, setRequests] = useState<RegularizationResponse[]>([]);
  const [clientLeaves, setClientLeaves] = useState<LeaveResponse[]>([]);
  const [regularLeaves, setRegularLeaves] = useState<LeaveResponse[]>([]);
  const [deviceChanges, setDeviceChanges] = useState<DeviceChangeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [clientActioningId, setClientActioningId] = useState<number | null>(null);
  const [regularActioningId, setRegularActioningId] = useState<number | null>(null);
  const [deviceActioningId, setDeviceActioningId] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, string>>({});
  const [clientComments, setClientComments] = useState<Record<number, string>>({});
  const [regularComments, setRegularComments] = useState<Record<number, string>>({});
  const [deviceComments, setDeviceComments] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const fetchPending = () => {
    setLoading(true);
    Promise.all([
      regularizationApi.pending().catch(() => ({ data: [] as RegularizationResponse[] })),
      leaveApi.pendingClientHolidays().catch(() => ({ data: [] as LeaveResponse[] })),
      leaveApi.pendingRegularLeaves().catch(() => ({ data: [] as LeaveResponse[] })),
      deviceChangeApi.pending().catch(() => ({ data: [] as DeviceChangeResponse[] })),
    ]).then(([regRes, clRes, rlRes, dcRes]) => {
      setRequests(regRes.data || []);
      setClientLeaves(clRes.data || []);
      setRegularLeaves(rlRes.data || []);
      setDeviceChanges(dcRes.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (id: number, action: 'APPROVE' | 'REJECT') => {
    setActioningId(id);
    try {
      await regularizationApi.action({ id, action, comment: comments[id]?.trim() || undefined });
      toast({
        title: action === 'APPROVE' ? 'Approved' : 'Rejected',
        description: `Correction request has been ${action.toLowerCase()}d.`,
      });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      handleApiError(err, { title: `${action} Failed` });
    } finally {
      setActioningId(null);
    }
  };

  const handleClientLeaveAction = async (id: number, action: 'APPROVE' | 'REJECT') => {
    setClientActioningId(id);
    try {
      await leaveApi.actionClientHoliday({ id, action, comment: clientComments[id]?.trim() || undefined });
      toast({ title: action === 'APPROVE' ? 'Approved' : 'Rejected', description: `Client leave has been ${action.toLowerCase()}d.` });
      setClientLeaves(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      handleApiError(err, { title: `${action} Failed` });
    } finally {
      setClientActioningId(null);
    }
  };

  const handleRegularLeaveAction = async (id: number, action: 'APPROVE' | 'REJECT') => {
    setRegularActioningId(id);
    try {
      await leaveApi.actionRegularLeave({ id, action, comment: regularComments[id]?.trim() || undefined });
      toast({ title: action === 'APPROVE' ? 'Approved' : 'Rejected', description: `Leave request has been ${action.toLowerCase()}d.` });
      setRegularLeaves(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      handleApiError(err, { title: `${action} Failed` });
    } finally {
      setRegularActioningId(null);
    }
  };

  const handleDeviceChangeAction = async (id: number, action: 'APPROVE' | 'REJECT') => {
    setDeviceActioningId(id);
    try {
      await deviceChangeApi.action({ id, action, comment: deviceComments[id]?.trim() || undefined });
      toast({ title: action === 'APPROVE' ? 'Approved' : 'Rejected', description: `Device change request has been ${action.toLowerCase()}d.` });
      setDeviceChanges(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      handleApiError(err, { title: `${action} Failed` });
    } finally {
      setDeviceActioningId(null);
    }
  };

  const totalPending = requests.length + clientLeaves.length + regularLeaves.length + deviceChanges.length;

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
              <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">Correction Approvals</h1>
              <p className="text-sm text-primary-foreground/60">Review and action pending requests</p>
            </div>
          </div>
          {!loading && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm text-primary-foreground font-bold text-lg">
              {totalPending}
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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-12 text-center">
          <ClipboardCheck className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No pending correction requests</p>
        </div>
      )}

      {/* Regular Leave Approvals (>2 days) */}
      <h2 className="text-lg font-semibold text-foreground">Leave Approvals</h2>

      {regularLeaves.length > 0 ? (
        <div className="space-y-4">
          {regularLeaves.map(req => (
            <motion.div
              key={`rl-${req.id}`}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning font-semibold text-sm shrink-0">
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

              <div className="grid sm:grid-cols-3 gap-4 rounded-xl bg-muted/20 border border-border/50 p-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Date</p>
                  <p className="text-sm font-semibold text-card-foreground mt-1">{req.date}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Type</p>
                  <p className="text-sm font-semibold text-warning mt-1 flex items-center gap-1"><CalendarOff className="h-3.5 w-3.5" />Regular Leave</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Salary Deduction</p>
                  <p className={`text-sm font-semibold mt-1 ${req.salaryDeductionApplicable ? 'text-warning' : 'text-success'}`}>
                    {req.salaryDeductionApplicable ? 'Applicable' : 'Not Applicable'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-warning/5 border border-warning/10 p-3">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reason</p>
                  <p className="text-sm text-card-foreground mt-0.5">{req.reason}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Textarea
                  placeholder="Add a comment (optional)..."
                  value={regularComments[req.id] || ''}
                  onChange={e => setRegularComments(prev => ({ ...prev, [req.id]: e.target.value }))}
                  rows={2}
                  className="rounded-xl resize-none text-sm"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleRegularLeaveAction(req.id, 'APPROVE')}
                    disabled={regularActioningId === req.id}
                    className="flex-1 h-11 rounded-xl gap-2 bg-success hover:bg-success/90 text-white"
                  >
                    {regularActioningId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleRegularLeaveAction(req.id, 'REJECT')}
                    disabled={regularActioningId === req.id}
                    variant="outline"
                    className="flex-1 h-11 rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
                  >
                    {regularActioningId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-12 text-center">
          <CalendarOff className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No pending leave approvals</p>
        </div>
      )}

      {/* Client Holiday Leave Approvals */}
      <h2 className="text-lg font-semibold text-foreground">Client Holiday Leaves</h2>

      {clientLeaves.length > 0 ? (
        <div className="space-y-4">
          {clientLeaves.map(req => (
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

              <div className="grid sm:grid-cols-3 gap-4 rounded-xl bg-muted/20 border border-border/50 p-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Date</p>
                  <p className="text-sm font-semibold text-card-foreground mt-1">{req.date}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Type</p>
                  <p className="text-sm font-semibold text-info mt-1 flex items-center gap-1"><Globe className="h-3.5 w-3.5" />Client Holiday</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Salary Deduction</p>
                  <p className="text-sm font-semibold text-success mt-1">Not Applicable</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-info/5 border border-info/10 p-3">
                <Globe className="h-4 w-4 text-info shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reason</p>
                  <p className="text-sm text-card-foreground mt-0.5">{req.reason}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Textarea
                  placeholder="Add a comment (optional)..."
                  value={clientComments[req.id] || ''}
                  onChange={e => setClientComments(prev => ({ ...prev, [req.id]: e.target.value }))}
                  rows={2}
                  className="rounded-xl resize-none text-sm"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleClientLeaveAction(req.id, 'APPROVE')}
                    disabled={clientActioningId === req.id}
                    className="flex-1 h-11 rounded-xl gap-2 bg-success hover:bg-success/90 text-white"
                  >
                    {clientActioningId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleClientLeaveAction(req.id, 'REJECT')}
                    disabled={clientActioningId === req.id}
                    variant="outline"
                    className="flex-1 h-11 rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
                  >
                    {clientActioningId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-12 text-center">
          <Globe className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No pending client holiday leaves</p>
        </div>
      )}

      {/* Device Change Approvals */}
      <h2 className="text-lg font-semibold text-foreground">Device Change Requests</h2>

      {deviceChanges.length > 0 ? (
        <div className="space-y-4">
          {deviceChanges.map(req => (
            <motion.div
              key={`dc-${req.id}`}
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
                  value={deviceComments[req.id] || ''}
                  onChange={e => setDeviceComments(prev => ({ ...prev, [req.id]: e.target.value }))}
                  rows={2}
                  className="rounded-xl resize-none text-sm"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleDeviceChangeAction(req.id, 'APPROVE')}
                    disabled={deviceActioningId === req.id}
                    className="flex-1 h-11 rounded-xl gap-2 bg-success hover:bg-success/90 text-white"
                  >
                    {deviceActioningId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleDeviceChangeAction(req.id, 'REJECT')}
                    disabled={deviceActioningId === req.id}
                    variant="outline"
                    className="flex-1 h-11 rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
                  >
                    {deviceActioningId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
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
