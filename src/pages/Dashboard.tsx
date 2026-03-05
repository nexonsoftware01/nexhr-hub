import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/StatCard';
import { StatusChip } from '@/components/StatusChip';
import { Clock, BarChart3, Home, CalendarOff, Users, UserPlus, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '@/lib/api';

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
  const avgHours = stats?.avgHoursPerCompletedDay
    ? `${stats.avgHoursPerCompletedDay.toFixed(1)}h`
    : '—';
  const totalHours = stats?.totalWorkedMinutes
    ? `${Math.round(stats.totalWorkedMinutes / 60)}h`
    : '—';

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Welcome back, {user.name.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here's your overview for today • {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Role badge */}
      <StatusChip status={user.role} />

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Present Days"
          value={isLoading ? '…' : String(presentDays)}
          subtitle="This month"
          icon={BarChart3}
          iconClassName="bg-info/10 text-info"
        />
        <StatCard
          title="Avg Hours/Day"
          value={isLoading ? '…' : avgHours}
          subtitle="Per completed day"
          icon={Clock}
          iconClassName="bg-accent/10 text-accent"
        />
        <StatCard
          title="Total Hours"
          value={isLoading ? '…' : totalHours}
          subtitle="This month"
          icon={Home}
          iconClassName="bg-success/10 text-success"
        />
        <StatCard
          title="Completed Days"
          value={isLoading ? '…' : String(stats?.completedDays ?? '—')}
          subtitle="Full day attendance"
          icon={CalendarOff}
          iconClassName="bg-warning/10 text-warning"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            to="/attendance"
            icon={Clock}
            title="Punch In / Out"
            description="Record your attendance with location"
            color="bg-accent/10 text-accent"
          />
          <QuickAction
            to="/wfh/apply"
            icon={Home}
            title="Apply WFH"
            description="Request to work from home"
            color="bg-success/10 text-success"
          />
          <QuickAction
            to="/leave/apply"
            icon={CalendarOff}
            title="Apply Leave"
            description="Submit a leave request"
            color="bg-warning/10 text-warning"
          />
          <QuickAction
            to="/attendance/my-monthly"
            icon={BarChart3}
            title="My Reports"
            description="View your monthly attendance"
            color="bg-info/10 text-info"
          />
          {(user.role === 'DIRECTOR' || user.role === 'HR') && (
            <QuickAction
              to="/users"
              icon={UserPlus}
              title="Manage Users"
              description="Create and manage employees"
              color="bg-primary/10 text-primary"
            />
          )}
          {user.role === 'DIRECTOR' && (
            <QuickAction
              to="/payroll"
              icon={FileSpreadsheet}
              title="Payroll"
              description="Generate monthly payroll Excel"
              color="bg-accent/10 text-accent"
            />
          )}
          <QuickAction
            to="/attendance/team"
            icon={Users}
            title="Team Reports"
            description="View team attendance summary"
            color="bg-destructive/10 text-destructive"
          />
        </div>
      </div>
    </div>
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
      <div className="group flex items-start gap-4 rounded-lg border border-border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
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
