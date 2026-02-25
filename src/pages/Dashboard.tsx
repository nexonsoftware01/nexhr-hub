import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/StatCard';
import { StatusChip } from '@/components/StatusChip';
import { Clock, BarChart3, Home, CalendarOff, Users, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here's your overview for today
        </p>
      </div>

      {/* Role badge */}
      <StatusChip status={user.role} />

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Punch Status"
          value="Not Punched"
          subtitle="Tap to punch in"
          icon={Clock}
          iconClassName="bg-accent/10 text-accent"
        />
        <StatCard
          title="This Month"
          value="—"
          subtitle="Days present"
          icon={BarChart3}
          iconClassName="bg-info/10 text-info"
        />
        <StatCard
          title="WFH Taken"
          value="—"
          subtitle="This month"
          icon={Home}
          iconClassName="bg-success/10 text-success"
        />
        <StatCard
          title="Leaves Taken"
          value="—"
          subtitle="This month"
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
          {(user.role === 'SUPER_ADMIN' || user.role === 'HR') && (
            <QuickAction
              to="/users"
              icon={UserPlus}
              title="Manage Users"
              description="Create and manage employees"
              color="bg-primary/10 text-primary"
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
