import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { holidayApi, companyWfhApi, HolidayDto, CompanyWfhDayDto } from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { CalendarIcon, CalendarDays, Plus, Loader2, Trash2, PartyPopper, Home, User, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Holidays() {
  const [holidays, setHolidays] = useState<HolidayDto[]>([]);
  const [companyWfhDays, setCompanyWfhDays] = useState<CompanyWfhDayDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const canManage = user?.role === 'DIRECTOR' || user?.role === 'HR';

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      holidayApi.list().catch(() => ({ data: [] as HolidayDto[] })),
      companyWfhApi.list().catch(() => ({ data: [] as CompanyWfhDayDto[] })),
    ]).then(([hRes, wRes]) => {
      setHolidays(hRes.data || []);
      setCompanyWfhDays(wRes.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await holidayApi.delete(id);
      setHolidays(prev => prev.filter(h => h.id !== id));
      toast({ title: 'Deleted', description: 'Holiday removed.' });
    } catch (err: any) {
      handleApiError(err, { title: 'Delete Failed' });
    }
  };

  // Group holidays by month
  const grouped = holidays.reduce<Record<string, HolidayDto[]>>((acc, h) => {
    const monthKey = h.date.substring(0, 7); // "2026-01"
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(h);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in-up">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-28 w-28 rounded-full bg-accent/5 blur-xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <CalendarDays className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">Holiday Calendar</h1>
              <p className="text-sm text-primary-foreground/60">Company holidays — no attendance required</p>
            </div>
          </div>
          {canManage && <AddHolidayDialog onAdded={fetchAll} />}
        </div>
      </div>

      {/* Holiday list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : Object.keys(grouped).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([monthKey, monthHolidays]) => {
            const [y, m] = monthKey.split('-');
            const monthName = new Date(Number(y), Number(m) - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

            return (
              <motion.div
                key={monthKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{monthName}</h3>
                <div className="space-y-2">
                  {monthHolidays.map(h => (
                    <div key={h.id} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card hover:shadow-card-hover transition-shadow">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent shrink-0">
                        <div className="text-center leading-none">
                          <p className="text-lg font-extrabold">{new Date(h.date).getDate()}</p>
                          <p className="text-[10px] uppercase font-semibold">{new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short' })}</p>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-card-foreground">{h.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(h.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(h.id)}
                          className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <PartyPopper className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No holidays added yet</p>
          {canManage && <p className="text-xs text-muted-foreground/60 mt-1">Add company holidays using the button above</p>}
        </div>
      )}

      {/* Company WFH Days */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Company WFH Days</h2>
        {canManage && <AddCompanyWfhDialog onAdded={fetchAll} />}
      </div>

      {companyWfhDays.length > 0 ? (
        <div className="space-y-2">
          {companyWfhDays.map(d => (
            <div key={d.id} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success shrink-0">
                <Home className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-card-foreground">{d.reason}</p>
                <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span>{new Date(d.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{d.createdByName}</span>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success shrink-0">
                No Deduction
              </span>
              {canManage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await companyWfhApi.delete(d.id);
                      setCompanyWfhDays(prev => prev.filter(x => x.id !== d.id));
                      toast({ title: 'Deleted', description: 'Company WFH day removed.' });
                    } catch (err: any) { handleApiError(err, { title: 'Delete Failed' }); }
                  }}
                  className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-12 text-center">
          <Home className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No company WFH days declared</p>
        </div>
      )}
    </div>
  );
}

function AddCompanyWfhDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !reason.trim()) return;
    setLoading(true);
    try {
      await companyWfhApi.create({ date: format(date, 'yyyy-MM-dd'), reason: reason.trim() });
      toast({ title: 'Company WFH Day Added', description: `All employees can work from home on this day.` });
      setDate(undefined); setReason('');
      setOpen(false);
      onAdded();
    } catch (err: any) {
      handleApiError(err, { title: 'Failed to add' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" />
          Declare WFH Day
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
              <Home className="h-4 w-4" />
            </div>
            Declare Company WFH Day
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal rounded-xl h-11', !date && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => { setDate(d); setCalendarOpen(false); }} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Reason</label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Bhai Dooj, Government lockdown notice..." rows={2} required className="rounded-xl resize-none" />
          </div>
          <Button type="submit" className="w-full rounded-xl h-11" disabled={loading || !date || !reason.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Home className="h-4 w-4 mr-2" />}
            Declare WFH Day
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddHolidayDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !name.trim()) return;
    setLoading(true);
    try {
      await holidayApi.create({ date: format(date, 'yyyy-MM-dd'), name: name.trim() });
      toast({ title: 'Holiday Added', description: `${name} has been added to the calendar.` });
      setDate(undefined); setName('');
      setOpen(false);
      onAdded();
    } catch (err: any) {
      handleApiError(err, { title: 'Failed to add holiday' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl bg-white/10 text-primary-foreground border border-white/10 hover:bg-white/20 backdrop-blur-sm">
          <Plus className="h-4 w-4" />
          Add Holiday
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <CalendarDays className="h-4 w-4" />
            </div>
            Add Holiday
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Holiday Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Republic Day" required className="rounded-xl h-11" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal rounded-xl h-11', !date && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { setDate(d); setCalendarOpen(false); }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button type="submit" className="w-full rounded-xl h-11 text-base" disabled={loading || !date || !name.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarDays className="h-4 w-4 mr-2" />}
            Add Holiday
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
