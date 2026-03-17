import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Menu, Building2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-0 h-dvh">
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card/80 backdrop-blur-md px-4 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-0 bg-sidebar border-sidebar-border">
              <AppSidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-bold text-foreground">NexHR</span>
          </Link>
        </header>

        {/* Desktop header */}
        <header className="hidden lg:flex h-14 items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-6">
          <div />
          {user && (
            <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role.replace(/_/g, ' ')}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/70 text-accent-foreground text-sm font-bold shadow-md">
                {user.name?.charAt(0) || 'U'}
              </div>
            </Link>
          )}
        </header>

        {/* Page content with dot pattern */}
        <main className="flex-1 overflow-y-auto bg-dot-pattern p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
