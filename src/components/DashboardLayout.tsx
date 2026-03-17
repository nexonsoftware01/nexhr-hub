import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Menu, Building2, Bell, X, Clock, User } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { announcementApi, AnnouncementResponse } from '@/lib/api';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [readIds, setReadIds] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem('nexhr_read_announcements');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const bellRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    announcementApi.list()
      .then(res => setAnnouncements(res.data || []))
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    if (bellOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [bellOpen]);

  const unreadCount = announcements.filter(a => !readIds.has(a.id)).length;

  const markAllRead = () => {
    const allIds = new Set(announcements.map(a => a.id));
    setReadIds(allIds);
    localStorage.setItem('nexhr_read_announcements', JSON.stringify([...allIds]));
  };

  const handleBellClick = () => {
    setBellOpen(prev => !prev);
  };

  const BellButton = (
    <div ref={bellRef} className="relative">
      <button
        onClick={handleBellClick}
        className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {bellOpen && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
            <h3 className="font-semibold text-card-foreground text-sm">Announcements</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-accent hover:underline font-medium">
                  Mark all read
                </button>
              )}
              <button onClick={() => setBellOpen(false)} className="text-muted-foreground hover:text-card-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {announcements.length > 0 ? (
              announcements.slice(0, 10).map(a => (
                <div
                  key={a.id}
                  className={`px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer ${
                    !readIds.has(a.id) ? 'bg-accent/5' : ''
                  }`}
                  onClick={() => {
                    const newRead = new Set(readIds);
                    newRead.add(a.id);
                    setReadIds(newRead);
                    localStorage.setItem('nexhr_read_announcements', JSON.stringify([...newRead]));
                    setBellOpen(false);
                    navigate('/announcements');
                  }}
                >
                  <div className="flex items-start gap-3">
                    {!readIds.has(a.id) && (
                      <div className="h-2 w-2 rounded-full bg-accent mt-1.5 shrink-0" />
                    )}
                    <div className={`flex-1 min-w-0 ${readIds.has(a.id) ? 'ml-5' : ''}`}>
                      <p className="text-sm font-semibold text-card-foreground truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.content}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground/60">
                        <span className="flex items-center gap-0.5"><User className="h-2.5 w-2.5" />{a.createdByName}</span>
                        <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell className="h-6 w-6 mb-2 opacity-30" />
                <p className="text-sm">No announcements</p>
              </div>
            )}
          </div>
          {announcements.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border bg-muted/10">
              <button
                onClick={() => { setBellOpen(false); navigate('/announcements'); }}
                className="text-xs text-accent hover:underline font-medium w-full text-center"
              >
                View all announcements
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-0 h-dvh">
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 lg:hidden">
          <div className="flex items-center gap-3">
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
          </div>
          {BellButton}
        </header>

        {/* Desktop header */}
        <header className="hidden lg:flex h-14 items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-6">
          <div />
          <div className="flex items-center gap-4">
            {BellButton}
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
          </div>
        </header>

        {/* Page content with dot pattern */}
        <main className="flex-1 overflow-y-auto bg-dot-pattern p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
