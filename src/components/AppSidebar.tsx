import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Clock,
  BarChart3,
  Users,
  UserPlus,
  Home,
  CalendarOff,
  LogOut,
  ChevronLeft,
  Building2,
  FileSpreadsheet,
  UserCircle,
  FileEdit,
  ClipboardCheck,
} from 'lucide-react';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  title: string;
  to: string;
  icon: React.ElementType;
  roles?: string[];
  end?: boolean;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { title: 'Punch In/Out', to: '/attendance', icon: Clock, end: true },
  { title: 'My Reports', to: '/attendance/my-monthly', icon: BarChart3 },
  { title: 'Team Reports', to: '/attendance/team', icon: Users },
  { title: 'Apply WFH', to: '/wfh/apply', icon: Home },
  { title: 'Apply Leave', to: '/leave/apply', icon: CalendarOff },
  { title: 'Regularization', to: '/attendance/regularization', icon: FileEdit, end: true },
  { title: 'Approvals', to: '/attendance/regularization/approvals', icon: ClipboardCheck },
  { title: 'My Profile', to: '/profile', icon: UserCircle },
  { title: 'Manage Users', to: '/users', icon: UserPlus, roles: ['DIRECTOR', 'HR'] },
  { title: 'Payroll', to: '/payroll', icon: FileSpreadsheet, roles: ['DIRECTOR'] },
];

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { user, logout } = useAuth();

  const filteredItems = navItems.filter(
    item => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside className={cn(
      'relative flex h-dvh flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out overflow-hidden',
      collapsed ? 'w-[68px]' : 'w-[264px]'
    )}>
      {/* Subtle gradient overlay for depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sidebar-primary/[0.03] via-transparent to-sidebar-primary/[0.02]" />

      {/* Logo */}
      <NavLink to="/dashboard" className="relative flex h-[72px] items-center gap-3 border-b border-sidebar-border/60 px-4 hover:opacity-90 transition-opacity">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20 transition-transform duration-200 hover:scale-105">
          <Building2 className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <h1 className="text-lg font-extrabold tracking-tight text-sidebar-primary-foreground">
              Nex<span className="text-sidebar-primary">HR</span>
            </h1>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-sidebar-foreground/40 uppercase">
              Nexon Software Solutions
            </p>
          </div>
        )}
      </NavLink>

      {/* Section label */}
      {!collapsed && (
        <div className="relative px-5 pt-5 pb-1">
          <p className="text-[10px] font-bold tracking-[0.15em] text-sidebar-foreground/30 uppercase">
            Menu
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="relative flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {filteredItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
              isActive
                ? 'bg-sidebar-primary/[0.12] text-sidebar-primary shadow-sm'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground/90'
            )}
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-sidebar-primary animate-scale-in" />
                )}
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary/20 text-sidebar-primary'
                    : 'text-sidebar-foreground/50 group-hover:bg-sidebar-accent/60 group-hover:text-sidebar-foreground/80'
                )}>
                  <item.icon className="h-[17px] w-[17px]" />
                </div>
                {!collapsed && (
                  <span className={cn(
                    'animate-fade-in truncate',
                    isActive && 'font-semibold'
                  )}>
                    {item.title}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="relative border-t border-sidebar-border/40 p-3 space-y-1">
        {!collapsed && user && (
          <div className="mx-1 mb-2 rounded-xl bg-sidebar-accent/30 px-3 py-2.5 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground/90 truncate">{user.name}</p>
                <p className="text-[11px] text-sidebar-foreground/40 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        {collapsed && user && (
          <div className="flex justify-center py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-sidebar-foreground/50 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-[17px] w-[17px] shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-xl p-2 text-sidebar-foreground/30 transition-all duration-200 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground/70"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')} />
        </button>
      </div>
    </aside>
  );
}
