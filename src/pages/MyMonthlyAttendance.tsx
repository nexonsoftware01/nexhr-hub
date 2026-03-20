import { useState, useEffect } from 'react';
import { attendanceApi, MonthlyAttendance } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, BarChart3, CheckCircle, Loader2, AlertTriangle, ClockAlert, TrendingUp, CalendarOff, Home } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MyMonthlyAttendance() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<MonthlyAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    attendanceApi.myMonthly(year, month)
      .then(res => setData(res.data))
      .catch(err => toast({ title: 'Error', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [year, month]);

  const totalHours = data ? (data.totalWorkedMinutes / 60).toFixed(1) : '0';
  const presentDays = data?.presentDays ?? 0;
  const halfDays = data?.halfDayCount ?? 0;
  const absentDays = data?.absentCount ?? 0;
  const leaveDays = data?.leaveDays ?? 0;
  const wfhDays = data?.wfhDays ?? 0;
  const workingDays = presentDays + halfDays + absentDays;
  const avgHours = workingDays > 0 ? (data!.totalWorkedMinutes / 60 / workingDays).toFixed(1) : '—';

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Hero with filters */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-28 w-28 rounded-full bg-accent/5 blur-xl" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">My Reports</h1>
                <p className="text-sm text-primary-foreground/60">{monthNames[month - 1]} {year} attendance summary</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                <SelectTrigger className="w-[110px] bg-white/10 border-white/10 text-primary-foreground backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthsShort.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                <SelectTrigger className="w-[90px] bg-white/10 border-white/10 text-primary-foreground backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
            <StatTile label="Present" value={String(presentDays)} icon={CheckCircle} color="success" />
            <StatTile label="Half Days" value={String(halfDays)} icon={ClockAlert} color="warning" />
            <StatTile label="Absent" value={String(absentDays)} icon={AlertTriangle} color="destructive" />
            <StatTile label="Leave" value={String(leaveDays)} icon={CalendarOff} color="warning" />
            <StatTile label="WFH" value={String(wfhDays)} icon={Home} color="success" />
            <StatTile label="Total Hours" value={`${totalHours}h`} icon={Clock} color="info" />
            <StatTile label="Avg / Day" value={`${avgHours}h`} icon={TrendingUp} color="accent" />
          </div>

          {/* Daily breakdown */}
          {data.days.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border bg-muted/20">
                <h3 className="font-semibold text-card-foreground">Daily Breakdown</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{data.days.length} recorded days</p>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Punch In</TableHead>
                      <TableHead className="font-semibold">Punch Out</TableHead>
                      <TableHead className="text-center font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.days.map((day) => (
                      <TableRow key={day.date} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium">
                          <div>
                            <p className="text-sm">{new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                            <p className="text-xs text-muted-foreground">{new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' })}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {day.punchInTime
                            ? new Date(day.punchInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {day.punchOutTime
                            ? new Date(day.punchOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            day.status === 'PRESENT' ? 'bg-success/10 text-success border-success/20'
                            : day.status === 'WFH' ? 'bg-success/10 text-success border-success/20'
                            : day.status === 'HALF_DAY' ? 'bg-warning/10 text-warning border-warning/20'
                            : day.status === 'LEAVE' ? 'bg-warning/10 text-warning border-warning/20'
                            : day.status === 'CHECKED_IN' ? 'bg-info/10 text-info border-info/20'
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                          }`}>
                            {day.status === 'PRESENT' ? 'Present'
                              : day.status === 'WFH' ? 'WFH'
                              : day.status === 'HALF_DAY' ? 'Half Day'
                              : day.status === 'LEAVE' ? 'Leave'
                              : day.status === 'CHECKED_IN' ? 'Checked In'
                              : 'Absent'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-sm">{(day.totalWorkedMinutes / 60).toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground ml-0.5">h</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          ) : (
            <EmptyState message="No attendance records found for this period" />
          )}
        </>
      ) : (
        <EmptyState message="Could not load attendance data" />
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
        <Calendar className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Try selecting a different month or year</p>
    </div>
  );
}
