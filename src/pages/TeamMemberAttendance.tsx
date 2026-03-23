import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { attendanceApi, MonthlyAttendance } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, BarChart3, CheckCircle, Loader2, ArrowLeft, AlertTriangle, ClockAlert } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TeamMemberAttendance() {
  const { employeeId } = useParams();
  const [searchParams] = useSearchParams();
  const year = Number(searchParams.get('year')) || new Date().getFullYear();
  const month = Number(searchParams.get('month')) || new Date().getMonth() + 1;
  const [data, setData] = useState<MonthlyAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    attendanceApi.teamMemberMonthly(Number(employeeId), year, month)
      .then(res => setData(res.data))
      .catch(err => toast({ title: 'Error', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [employeeId, year, month]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <Link to="/attendance/team" className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Employee Report</h1>
          <p className="text-sm text-muted-foreground">Employee #{employeeId} — {new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Present Days" value={data.presentDays} icon={CheckCircle} iconClassName="bg-success/10 text-success" />
            <StatCard title="Half Days" value={data.halfDayCount} icon={ClockAlert} iconClassName="bg-warning/10 text-warning" />
            <StatCard title="Absent Days" value={data.absentCount} icon={AlertTriangle} iconClassName="bg-destructive/10 text-destructive" />
            <StatCard title="Total Hours" value={(data.totalWorkedMinutes / 60).toFixed(1)} icon={Clock} iconClassName="bg-info/10 text-info" />
          </div>

          {data.days.length > 0 ? (
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Date</TableHead>
                    <TableHead>Punch In</TableHead>
                    <TableHead>Punch Out</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.days.map(day => (
                    <TableRow key={day.date} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium">{new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</TableCell>
                      <TableCell>{day.punchInTime ? new Date(day.punchInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</TableCell>
                      <TableCell>{day.punchOutTime ? new Date(day.punchOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          day.status === 'PRESENT' ? 'bg-success/10 text-success border-success/20'
                          : day.status === 'WFH' ? 'bg-success/10 text-success border-success/20'
                          : day.status === 'HALF_DAY' ? 'bg-warning/10 text-warning border-warning/20'
                          : day.status === 'LEAVE' ? 'bg-warning/10 text-warning border-warning/20'
                          : day.status === 'HOLIDAY' ? 'bg-accent/10 text-accent border-accent/20'
                          : day.status === 'CHECKED_IN' ? 'bg-info/10 text-info border-info/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                        }`}>
                          {day.status === 'PRESENT' ? 'Present'
                            : day.status === 'WFH' ? 'WFH'
                            : day.status === 'HALF_DAY' ? 'Half Day'
                            : day.status === 'LEAVE' ? 'Leave'
                            : day.status === 'HOLIDAY' ? 'Holiday'
                            : day.status === 'CHECKED_IN' ? 'Checked In'
                            : 'Absent'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{(day.totalWorkedMinutes / 60).toFixed(1)}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState message="No records found" />
          )}
        </>
      ) : (
        <EmptyState message="Could not load data" />
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
        <Calendar className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
