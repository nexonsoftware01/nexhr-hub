import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/StatCard';
import { StatusChip } from '@/components/StatusChip';
import { Clock, BarChart3, Home, CalendarOff, Users, UserPlus, FileSpreadsheet, AlertTriangle, ClockAlert } from 'lucide-react';
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
  const presentDays = stats?.presentDays ?? '—';
  const halfDays = stats?.halfDays ?? '—';
  const absentDays = stats?.absentDays ?? '—';
  const totalHours = stats?.totalWorkedMinutes
    ? `${Math.round(stats.totalWorkedMinutes / 60)}h`
    : '—';

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Welcome */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8 text-primary-foreground">
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-accent/10" />
        <div className="absolute bottom-4 right-12 h-20 w-20 rounded-full bg-accent/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <StatusChip status={user.role} />
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Welcome back, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="mt-2 text-sm text-primary-foreground/60">
            Here's your overview for today • {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </motion.div>

      {/* Quick stats */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Present Days"
          value={isLoading ? '…' : String(presentDays)}
          subtitle="This month"
          icon={BarChart3}
          iconClassName="bg-success/10 text-success"
        />
        <StatCard
          title="Half Days"
          value={isLoading ? '…' : String(halfDays)}
          subtitle="5–9 hrs worked"
          icon={ClockAlert}
          iconClassName="bg-warning/10 text-warning"
        />
        <StatCard
          title="Absent Days"
          value={isLoading ? '…' : String(absentDays)}
          subtitle="Less than 5 hrs"
          icon={AlertTriangle}
          iconClassName="bg-destructive/10 text-destructive"
        />
        <StatCard
          title="Total Hours"
          value={isLoading ? '…' : totalHours}
          subtitle="This month"
          icon={Clock}
          iconClassName="bg-info/10 text-info"
        />
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={item}>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction to="/attendance" icon={Clock} title="Punch In / Out" description="Record your attendance with location" color="bg-accent/10 text-accent" />
          <QuickAction to="/wfh/apply" icon={Home} title="Apply WFH" description="Request to work from home" color="bg-success/10 text-success" />
          <QuickAction to="/leave/apply" icon={CalendarOff} title="Apply Leave" description="Submit a leave request" color="bg-warning/10 text-warning" />
          <QuickAction to="/attendance/my-monthly" icon={BarChart3} title="My Reports" description="View your monthly attendance" color="bg-info/10 text-info" />
          {(user.role === 'DIRECTOR' || user.role === 'HR') && (
            <QuickAction to="/users" icon={UserPlus} title="Manage Users" description="Create and manage employees" color="bg-primary/10 text-primary" />
          )}
          {user.role === 'DIRECTOR' && (
            <QuickAction to="/payroll" icon={FileSpreadsheet} title="Payroll" description="Generate monthly payroll Excel" color="bg-accent/10 text-accent" />
          )}
          <QuickAction to="/attendance/team" icon={Users} title="Team Reports" description="View team attendance summary" color="bg-destructive/10 text-destructive" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function QuickAction({ to, icon: Icon, title, description, color }: {
  to: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Link to={to}>
      <div className="group relative flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-card-foreground group-hover:text-accent transition-colors">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
  );
}
