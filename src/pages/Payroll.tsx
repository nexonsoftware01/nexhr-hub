import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { payrollApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error';
import { Download, FileSpreadsheet, Loader2, Calculator, Calendar, Clock, AlertTriangle, CheckCircle, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Payroll() {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [loading, setLoading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const { toast } = useToast();

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  const handleDownload = async () => {
    setLoading(true);
    setDownloaded(false);
    try {
      await payrollApi.download(Number(year), Number(month));
      setDownloaded(true);
      toast({ title: 'Payroll Downloaded', description: `Payroll for ${monthNames[Number(month) - 1]} ${year} has been downloaded.` });
    } catch (err: any) {
      handleApiError(err, { title: 'Payroll Download Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in-up">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-28 w-28 rounded-full bg-accent/5 blur-xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">Generate Payroll</h1>
            <p className="text-sm text-primary-foreground/60">Download monthly payroll as Excel</p>
          </div>
        </div>
      </div>

      {/* Deduction rules */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <RuleCard icon={Calendar} color="info" title="22 Working Days" sub="Per month baseline" />
        <RuleCard icon={Home} color="success" title="1 Free WFH" sub="Per month, no deduction" />
        <RuleCard icon={AlertTriangle} color="warning" title="25% for Extra WFH" sub="Of daily salary per day" />
        <RuleCard icon={Clock} color="destructive" title="12 Leaves / Year" sub="Beyond 12: full day deducted" />
      </div>

      {/* Generate card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">Select Period</h2>
            <p className="text-xs text-muted-foreground">Choose the month and year to generate payroll</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Month</label>
            <Select value={month} onValueChange={v => { setMonth(v); setDownloaded(false); }}>
              <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthNames.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Year</label>
            <Select value={year} onValueChange={v => { setYear(v); setDownloaded(false); }}>
              <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selected period preview */}
        <div className="rounded-xl bg-muted/30 border border-border/50 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Generating for</p>
            <p className="text-lg font-bold text-card-foreground mt-0.5">{monthNames[Number(month) - 1]} {year}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
        </div>

        <Button onClick={handleDownload} className="w-full gap-2 h-12 rounded-xl text-base" disabled={loading}>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : downloaded ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <Download className="h-5 w-5" />
          )}
          {loading ? 'Generating...' : downloaded ? 'Downloaded — Click to Regenerate' : 'Generate & Download'}
        </Button>
      </motion.div>

      {/* Success confirmation */}
      {downloaded && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-success/20 bg-success/5 p-5 flex items-start gap-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 shrink-0">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">Payroll Generated</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The Excel file for <span className="font-medium text-card-foreground">{monthNames[Number(month) - 1]} {year}</span> has been downloaded to your device.
              It includes salary calculations, WFH deductions, leave deductions, and attendance-based adjustments for all active employees.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function RuleCard({ icon: Icon, color, title, sub }: { icon: React.ElementType; color: string; title: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-start gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${color}/10 text-${color} shrink-0`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-card-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
