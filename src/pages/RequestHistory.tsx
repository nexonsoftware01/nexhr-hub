import { useState, useEffect } from 'react';
import { StatusChip } from '@/components/StatusChip';
import { leaveApi, wfhApi, LeaveResponse, WfhResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CalendarOff, Home, Loader2, Clock, AlertTriangle, History } from 'lucide-react';
import { motion } from 'framer-motion';

type HistoryItem = {
  id: number;
  type: 'LEAVE' | 'WFH';
  date: string;
  status: string;
  reason: string;
  salaryDeduction: boolean;
};

export default function RequestHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'LEAVE' | 'WFH'>('ALL');
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      leaveApi.myRequests().catch(() => ({ data: [] as LeaveResponse[] })),
      wfhApi.myRequests().catch(() => ({ data: [] as WfhResponse[] })),
    ]).then(([leaveRes, wfhRes]) => {
      const leaves: HistoryItem[] = (leaveRes.data || []).map(l => ({
        id: l.id,
        type: 'LEAVE' as const,
        date: l.date,
        status: l.status,
        reason: l.reason,
        salaryDeduction: l.salaryDeductionApplicable,
      }));
      const wfhs: HistoryItem[] = (wfhRes.data || []).map(w => ({
        id: w.id,
        type: 'WFH' as const,
        date: w.date,
        status: w.status,
        reason: w.reason,
        salaryDeduction: w.salaryDeductionApplicable,
      }));
      const all = [...leaves, ...wfhs].sort((a, b) => b.date.localeCompare(a.date));
      setItems(all);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? items : items.filter(i => i.type === filter);

  const leaveCount = items.filter(i => i.type === 'LEAVE').length;
  const wfhCount = items.filter(i => i.type === 'WFH').length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in-up">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-28 w-28 rounded-full bg-accent/5 blur-xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <History className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">Leave & WFH History</h1>
            <p className="text-sm text-primary-foreground/60">All your past requests in one place</p>
          </div>
        </div>
      </div>

      {/* Stats + Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-3 flex-1">
          <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-card flex items-center gap-3 min-w-[120px]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning shrink-0">
              <CalendarOff className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-card-foreground">{leaveCount}</p>
              <p className="text-xs text-muted-foreground">Leaves</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-card flex items-center gap-3 min-w-[120px]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success shrink-0">
              <Home className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-card-foreground">{wfhCount}</p>
              <p className="text-xs text-muted-foreground">WFH</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1 self-center bg-muted/50 rounded-xl p-1 border border-border/50">
          {(['ALL', 'LEAVE', 'WFH'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                filter === f
                  ? 'bg-card shadow-sm text-card-foreground'
                  : 'text-muted-foreground hover:text-card-foreground'
              }`}
            >
              {f === 'ALL' ? 'All' : f === 'LEAVE' ? 'Leave' : 'WFH'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {filtered.map(item => (
            <div key={`${item.type}-${item.id}`} className="rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                    item.type === 'LEAVE' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                  }`}>
                    {item.type === 'LEAVE' ? <CalendarOff className="h-5 w-5" /> : <Home className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground">{item.type === 'LEAVE' ? 'Leave' : 'Work From Home'}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <StatusChip status={item.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Reason</p>
                  <p className="font-medium text-card-foreground mt-0.5">{item.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Salary Deduction</p>
                  {item.salaryDeduction ? (
                    <p className="font-semibold text-warning mt-0.5 flex items-center justify-end gap-1">
                      <AlertTriangle className="h-3 w-3" />Applicable
                    </p>
                  ) : (
                    <p className="font-semibold text-success mt-0.5">Not Applicable</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <History className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No requests found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Your leave and WFH requests will appear here</p>
        </div>
      )}
    </div>
  );
}
