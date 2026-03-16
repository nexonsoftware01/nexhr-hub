import { useAuth } from '@/contexts/AuthContext';
import { StatusChip } from '@/components/StatusChip';
import { Clock, BarChart3, Home, CalendarOff, Users, UserPlus, FileSpreadsheet, AlertTriangle, ClockAlert, CheckCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '@/lib/api';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Dashboard() {
  const { user } = useAuth();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: monthlyData, isLoading } = useQuery({
    queryKey: ['my-monthly-attendance', year, month],
    queryFn: () => attendanceApi.myMonthly(year, month),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  if (!user) return null;

  const stats = monthlyData?.data;
  const presentDays = stats?.presentDays ?? 0;
  const halfDays = stats?.halfDayCount ?? 0;
  const absentDays = stats?.absentCount ?? 0;
  const totalMinutes = stats?.totalWorkedMinutes ?? 0;
  const totalHours = Math.round(totalMinutes / 60);
  const avgHoursPerDay = presentDays > 0 ? (totalMinutes / 60 / (presentDays + halfDays)).toFixed(1) : '—';

  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const monthName = now.toLocaleDateString('en-IN', { month: 'long' });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

      {/* Hero */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8 text-primary-foreground">
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-accent/10 blur-2xl" />
        <div className="absolute bottom-4 right-12 h-24 w-24 rounded-full bg-accent/5 blur-xl" />
        <div className="absolute top-1/2 -left-8 h-32 w-32 rounded-full bg-accent/5 blur-xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusChip status={user.role} />
              </div>
              <h1 className="text-2xl font-bold md:text-3xl">
                Welcome back, {user.name.split(' ')[0]}
              </h1>
              <p className="mt-1.5 text-sm text-primary-foreground/60">{dateStr}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl md:text-4xl font-extrabold tracking-tight">{timeStr}</p>
              <p className="text-xs text-primary-foreground/40 mt-1">Indian Standard Time</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <StatTile
          label="Present"
          value={isLoading ? '…' : String(presentDays)}
          sub={`days in ${monthName}`}
          icon={CheckCircle}
          color="success"
        />
        <StatTile
          label="Half Days"
          value={isLoading ? '…' : String(halfDays)}
          sub="5–9 hrs worked"
          icon={ClockAlert}
          color="warning"
        />
        <StatTile
          label="Absent"
          value={isLoading ? '…' : String(absentDays)}
          sub="< 5 hrs worked"
          icon={AlertTriangle}
          color="destructive"
        />
        <StatTile
          label="Total Hours"
          value={isLoading ? '…' : `${totalHours}h`}
          sub={`in ${monthName}`}
          icon={Clock}
          color="info"
        />
        <StatTile
          label="Avg / Day"
          value={isLoading ? '…' : `${avgHoursPerDay}h`}
          sub="per working day"
          icon={TrendingUp}
          color="accent"
        />
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={item}>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction to="/attendance" icon={Clock} title="Punch In / Out" description="Record attendance with geofence" color="accent" />
          <QuickAction to="/wfh/apply" icon={Home} title="Apply WFH" description="Request to work from home" color="success" />
          <QuickAction to="/leave/apply" icon={CalendarOff} title="Apply Leave" description="Submit a leave request" color="warning" />
          <QuickAction to="/attendance/my-monthly" icon={BarChart3} title="My Reports" description="View monthly attendance" color="info" />
          {(user.role === 'DIRECTOR' || user.role === 'HR') && (
            <QuickAction to="/users" icon={UserPlus} title="Manage Users" description="Create and manage employees" color="primary" />
          )}
          {user.role === 'DIRECTOR' && (
            <QuickAction to="/payroll" icon={FileSpreadsheet} title="Payroll" description="Generate monthly payroll" color="accent" />
          )}
          <QuickAction to="/attendance/team" icon={Users} title="Team Reports" description="View team attendance" color="destructive" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatTile({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub: string; icon: React.ElementType; color: string;
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
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, description, color }: {
  to: string; icon: React.ElementType; title: string; description: string; color: string;
}) {
  return (
    <Link to={to}>
      <div className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 overflow-hidden">
        <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-${color}/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-${color}/10 text-${color} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-card-foreground group-hover:text-accent transition-colors">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </Link>
  );
}
