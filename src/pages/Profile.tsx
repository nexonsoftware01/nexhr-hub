import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileApi, leaveApi, wfhApi, MyProfile, LeaveResponse, WfhResponse } from '@/lib/api';
import { StatusChip } from '@/components/StatusChip';
import { useAuth } from '@/contexts/AuthContext';
import {
  User, Mail, Shield, Calendar, Clock, CheckCircle, ClockAlert, AlertTriangle,
  Home, CalendarOff, TrendingUp, Briefcase, Loader2, UserCheck, History
} from 'lucide-react';
import { motion } from 'framer-motion';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Profile() {
  const { user: authUser } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => profileApi.me(),
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const profile = data?.data;
  if (!profile) return null;

  const totalHours = (profile.totalWorkedMinutes / 60).toFixed(1);
  const workingDays = profile.presentDays + profile.halfDayCount + profile.absentCount;
  const avgHours = workingDays > 0 ? (profile.totalWorkedMinutes / 60 / workingDays).toFixed(1) : '—';
  const currentMonthName = monthNames[profile.currentMonthMonth - 1];
  const memberSinceDate = new Date(profile.memberSince).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-4xl space-y-6">

      {/* Profile hero */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-28 w-28 rounded-full bg-accent/5 blur-xl" />
        <div className="absolute top-1/2 right-1/4 h-32 w-32 rounded-full bg-accent/5 blur-xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm text-3xl font-bold text-primary-foreground shrink-0">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">{profile.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <StatusChip status={profile.role} />
              <span className="flex items-center gap-1.5 text-sm text-primary-foreground/60">
                <Mail className="h-3.5 w-3.5" />{profile.email}
              </span>
            </div>
            <p className="text-xs text-primary-foreground/40 mt-2 flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />Member since {memberSinceDate}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Info cards row */}
      <motion.div variants={item} className="grid sm:grid-cols-2 gap-4">
        {/* Manager */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reporting Manager</p>
            </div>
          </div>
          {profile.managerName ? (
            <div>
              <p className="text-lg font-bold text-card-foreground">{profile.managerName}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <Mail className="h-3.5 w-3.5" />{profile.managerEmail}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">Not assigned</p>
          )}
        </div>

        {/* Employment */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employment Details</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-semibold text-card-foreground mt-0.5">{profile.role}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-semibold text-success mt-0.5">Active</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Employee ID</p>
              <p className="text-sm font-semibold text-card-foreground mt-0.5">#{profile.userId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Joined</p>
              <p className="text-sm font-semibold text-card-foreground mt-0.5">{new Date(profile.memberSince).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Current month section header */}
      <motion.div variants={item}>
        <h2 className="text-lg font-semibold text-foreground">{currentMonthName} {profile.currentMonthYear} — Attendance</h2>
      </motion.div>

      {/* Attendance stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatTile label="Present" value={String(profile.presentDays)} icon={CheckCircle} color="success" />
        <StatTile label="Half Days" value={String(profile.halfDayCount)} icon={ClockAlert} color="warning" />
        <StatTile label="Absent" value={String(profile.absentCount)} icon={AlertTriangle} color="destructive" />
        <StatTile label="Total Hours" value={`${totalHours}h`} icon={Clock} color="info" />
        <StatTile label="Avg / Day" value={`${avgHours}h`} icon={TrendingUp} color="accent" />
      </motion.div>

      {/* Leave & WFH */}
      <motion.div variants={item}>
        <h2 className="text-lg font-semibold text-foreground">Leave & WFH</h2>
      </motion.div>

      <motion.div variants={item} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label={`Leave (${currentMonthName.substring(0, 3)})`} value={String(profile.leavesTakenThisMonth)} icon={CalendarOff} color="warning" />
        <StatTile label={`WFH (${currentMonthName.substring(0, 3)})`} value={String(profile.wfhTakenThisMonth)} icon={Home} color="success" />
        <StatTile label={`Leave (${profile.currentMonthYear})`} value={String(profile.leavesThisYear)} icon={CalendarOff} color="warning" />
        <StatTile label={`WFH (${profile.currentMonthYear})`} value={String(profile.wfhThisYear)} icon={Home} color="success" />
      </motion.div>

      {/* Request History */}
      <motion.div variants={item}>
        <h2 className="text-lg font-semibold text-foreground">Request History</h2>
      </motion.div>

      <motion.div variants={item}>
        <RequestHistorySection />
      </motion.div>

      {/* Policy reminder */}
      <motion.div variants={item} className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/5 p-4">
        <Shield className="h-5 w-5 text-info shrink-0 mt-0.5" />
        <div className="text-sm text-card-foreground">
          <p className="font-semibold">Monthly Policy</p>
          <ul className="mt-1.5 text-muted-foreground leading-relaxed space-y-1">
            <li>1 free leave and 1 free WFH per month (no salary deduction)</li>
            <li>Additional leave: full day salary deducted. Additional WFH: 25% deducted</li>
            <li>Working 9+ hours = Present. 5–9 hours = Half Day. Less than 5 = Absent</li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RequestHistorySection() {
  type HistoryItem = { id: number; type: 'LEAVE' | 'WFH'; date: string; status: string; reason: string; salaryDeduction: boolean };
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'LEAVE' | 'WFH'>('ALL');

  useEffect(() => {
    Promise.all([
      leaveApi.myRequests().catch(() => ({ data: [] as LeaveResponse[] })),
      wfhApi.myRequests().catch(() => ({ data: [] as WfhResponse[] })),
    ]).then(([leaveRes, wfhRes]) => {
      const leaves: HistoryItem[] = (leaveRes.data || []).map(l => ({ id: l.id, type: 'LEAVE' as const, date: l.date, status: l.status, reason: l.reason, salaryDeduction: l.salaryDeductionApplicable }));
      const wfhs: HistoryItem[] = (wfhRes.data || []).map(w => ({ id: w.id, type: 'WFH' as const, date: w.date, status: w.status, reason: w.reason, salaryDeduction: w.salaryDeductionApplicable }));
      setItems([...leaves, ...wfhs].sort((a, b) => b.date.localeCompare(a.date)));
    }).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? items : items.filter(i => i.type === filter);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 border border-border/50 w-fit">
        {(['ALL', 'LEAVE', 'WFH'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${filter === f ? 'bg-card shadow-sm text-card-foreground' : 'text-muted-foreground hover:text-card-foreground'}`}>
            {f === 'ALL' ? `All (${items.length})` : f === 'LEAVE' ? `Leave (${items.filter(i => i.type === 'LEAVE').length})` : `WFH (${items.filter(i => i.type === 'WFH').length})`}
          </button>
        ))}
      </div>
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map(req => (
            <div key={`${req.type}-${req.id}`} className="rounded-xl border border-border bg-card p-4 shadow-card flex items-center gap-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${req.type === 'LEAVE' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                {req.type === 'LEAVE' ? <CalendarOff className="h-4 w-4" /> : <Home className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-card-foreground">{req.type === 'LEAVE' ? 'Leave' : 'WFH'}</p>
                  <StatusChip status={req.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{new Date(req.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} — {req.reason}</p>
              </div>
              {req.salaryDeduction && (
                <span className="text-xs text-warning font-semibold flex items-center gap-1 shrink-0">
                  <AlertTriangle className="h-3 w-3" />Deducted
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-10 text-center">
          <History className="h-6 w-6 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No requests found</p>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5">
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-${color}/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-${color}/10 text-${color} transition-transform group-hover:scale-110`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="text-2xl font-extrabold tracking-tight text-card-foreground">{value}</p>
    </div>
  );
}
