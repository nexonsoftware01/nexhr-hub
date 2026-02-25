import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { attendanceApi, MonthlyAttendance } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, BarChart3, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
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
        <Link to="/attendance/team" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Report</h1>
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
            <StatCard title="Completed Days" value={data.completedDays} icon={Calendar} iconClassName="bg-info/10 text-info" />
            <StatCard title="Total Hours" value={(data.totalWorkedMinutes / 60).toFixed(1)} icon={Clock} iconClassName="bg-accent/10 text-accent" />
            <StatCard title="Avg Hours/Day" value={data.avgHoursPerCompletedDay.toFixed(1)} icon={BarChart3} iconClassName="bg-warning/10 text-warning" />
          </div>

          {data.days.length > 0 ? (
            <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Punch In</TableHead>
                    <TableHead>Punch Out</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.days.map(day => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">{new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</TableCell>
                      <TableCell>{day.punchInTime ? new Date(day.punchInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</TableCell>
                      <TableCell>{day.punchOutTime ? new Date(day.punchOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</TableCell>
                      <TableCell className="text-right">{(day.totalWorkedMinutes / 60).toFixed(1)}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">No records found</p>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">Could not load data</p>
        </div>
      )}
    </div>
  );
}
