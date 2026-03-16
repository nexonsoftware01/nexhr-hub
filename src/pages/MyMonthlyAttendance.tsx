import { useState, useEffect } from 'react';
import { attendanceApi, MonthlyAttendance } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, BarChart3, CheckCircle, Loader2, AlertTriangle, ClockAlert } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader title="My Monthly Report" description="Your attendance summary" icon={BarChart3} iconClassName="bg-info/10 text-info">
        <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

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
            <StatCard title="Total Hours" value={(data.totalWorkedMinutes / 60).toFixed(1)} subtitle="hours worked" icon={Clock} iconClassName="bg-info/10 text-info" />
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
                {data.days.map((day) => (
  <TableRow key={day.date} className="hover:bg-muted/20 transition-colors">
    
    <TableCell className="font-medium">
      {new Date(day.date).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      })}
    </TableCell>

    <TableCell>
      {day.punchInTime
        ? new Date(day.punchInTime).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata'
          })
        : '—'}
    </TableCell>

    <TableCell>
      {day.punchOutTime
        ? new Date(day.punchOutTime).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata'
          })
        : '—'}
    </TableCell>

    <TableCell className="text-center">
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        day.status === 'PRESENT'
          ? 'bg-success/10 text-success'
          : day.status === 'HALF_DAY'
            ? 'bg-warning/10 text-warning'
            : 'bg-destructive/10 text-destructive'
      }`}>
        {day.status === 'PRESENT' ? 'Present' : day.status === 'HALF_DAY' ? 'Half Day' : 'Absent'}
      </span>
    </TableCell>

    <TableCell className="text-right font-medium">
      {(day.totalWorkedMinutes / 60).toFixed(1)}h
    </TableCell>

  </TableRow>
))}
                </TableBody>
              </Table>
            </div>
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
