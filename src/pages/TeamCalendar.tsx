import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { teamCalendarApi, TeamCalendarDay } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Loader2, Home, CalendarOff, Globe, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const typeConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Home }> = {
  LEAVE: { label: 'Leave', color: 'text-warning', bg: 'bg-warning/10 border-warning/20', icon: CalendarOff },
  WFH: { label: 'WFH', color: 'text-success', bg: 'bg-success/10 border-success/20', icon: Home },
  HOLIDAY: { label: 'Holiday', color: 'text-info', bg: 'bg-info/10 border-info/20', icon: Star },
  CLIENT_HOLIDAY: { label: 'Client Holiday', color: 'text-accent', bg: 'bg-accent/10 border-accent/20', icon: Globe },
};

export default function TeamCalendar() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading } = useQuery({
    queryKey: ['team-calendar', year, month],
    queryFn: () => teamCalendarApi.get(year, month),
    staleTime: 60 * 1000,
    enabled: !!user,
  });

  const calendarDays = data?.data || [];

  // Build a map: date string -> array of events
  const eventsByDate = useMemo(() => {
    const map: Record<string, TeamCalendarDay[]> = {};
    for (const day of calendarDays) {
      if (!map[day.date]) map[day.date] = [];
      map[day.date].push(day);
    }
    return map;
  }, [calendarDays]);

  // Generate calendar grid
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const calendarGrid: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) calendarGrid.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarGrid.push(d);
  while (calendarGrid.length % 7 !== 0) calendarGrid.push(null);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Summary counts
  const leaveDays = calendarDays.filter(d => d.type === 'LEAVE').length;
  const wfhDays = calendarDays.filter(d => d.type === 'WFH').length;
  const holidays = calendarDays.filter(d => d.type === 'HOLIDAY').length;

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-28 w-28 rounded-full bg-accent/5 blur-xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <CalendarDays className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">Team Calendar</h1>
            <p className="text-sm text-primary-foreground/60">View leaves, WFH, and holidays across the team</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning shrink-0">
            <CalendarOff className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-card-foreground">{leaveDays}</p>
            <p className="text-xs text-muted-foreground">Leaves</p>
          </div>
        </div>
        <div className="rounded-xl border border-success/20 bg-success/5 p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success shrink-0">
            <Home className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-card-foreground">{wfhDays}</p>
            <p className="text-xs text-muted-foreground">WFH Days</p>
          </div>
        </div>
        <div className="rounded-xl border border-info/20 bg-info/5 p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 text-info shrink-0">
            <Star className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-card-foreground">{holidays}</p>
            <p className="text-xs text-muted-foreground">Holidays</p>
          </div>
        </div>
      </div>

      {/* Month navigation */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-bold text-card-foreground">{monthNames[month - 1]} {year}</h2>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {dayNames.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="min-h-[80px]" />;

                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const events = eventsByDate[dateStr] || [];
                const isToday = dateStr === todayStr;
                const isWeekend = idx % 7 === 0 || idx % 7 === 6;

                return (
                  <div
                    key={dateStr}
                    className={`min-h-[80px] rounded-xl border p-1.5 transition-colors ${
                      isToday ? 'border-accent/40 bg-accent/5' :
                      isWeekend ? 'border-border/40 bg-muted/20' :
                      'border-border/40 hover:border-border'
                    }`}
                  >
                    <p className={`text-xs font-semibold mb-1 ${
                      isToday ? 'text-accent' : isWeekend ? 'text-muted-foreground/50' : 'text-card-foreground'
                    }`}>
                      {day}
                    </p>
                    <div className="space-y-0.5">
                      {events.slice(0, 3).map((evt, i) => {
                        const config = typeConfig[evt.type] || typeConfig.LEAVE;
                        return (
                          <div
                            key={`${evt.userId}-${evt.type}-${i}`}
                            className={`text-[9px] leading-tight font-medium px-1 py-0.5 rounded border truncate ${config.bg} ${config.color}`}
                            title={`${evt.employeeName} — ${config.label}`}
                          >
                            {evt.type === 'HOLIDAY' ? evt.employeeName : `${evt.employeeName?.split(' ')[0]} · ${config.label}`}
                          </div>
                        );
                      })}
                      {events.length > 3 && (
                        <p className="text-[9px] text-muted-foreground font-medium px-1">+{events.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-2">
        {Object.entries(typeConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-sm border ${config.bg}`} />
            <span className="text-xs text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
