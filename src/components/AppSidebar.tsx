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
  { title: 'Manage Users', to: '/users', icon: UserPlus, roles: ['SUPER_ADMIN', 'HR'] },
  { title: 'Payroll', to: '/payroll', icon: FileSpreadsheet, roles: ['SUPER_ADMIN'] },
];

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { user, logout } = useAuth();

  const filteredItems = navItems.filter(
    item => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside className={cn(
      'flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out',
      collapsed ? 'w-[68px]' : 'w-[260px]'
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-base font-bold text-sidebar-primary-foreground">NexHR</h1>
            <p className="text-[10px] font-medium tracking-wider text-sidebar-foreground/60 uppercase">Nexon Solutions</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {filteredItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-sidebar-accent text-sidebar-primary shadow-sm'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="animate-fade-in">{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {!collapsed && user && (
          <div className="px-3 py-2 animate-fade-in">
            <p className="text-sm font-medium text-sidebar-foreground/90 truncate">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')} />
        </button>
      </div>
    </aside>
  );
}
