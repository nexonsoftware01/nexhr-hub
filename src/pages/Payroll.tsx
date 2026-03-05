import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { payrollApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error';
import { Download, FileSpreadsheet, Loader2, Info } from 'lucide-react';

export default function Payroll() {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setLoading(true);
    try {
      await payrollApi.download(Number(year), Number(month));
      toast({ title: 'Payroll Downloaded', description: `Payroll for ${monthNames[Number(month) - 1]} ${year} has been downloaded.` });
    } catch (err: any) {
      handleApiError(err, { title: 'Payroll Download Failed' });
    } finally {
      setLoading(false);
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payroll</h1>
        <p className="mt-1 text-sm text-muted-foreground">Generate and download monthly payroll Excel</p>
      </div>

      {/* Policy info */}
      <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info/5 p-4">
        <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
        <div className="text-sm text-card-foreground">
          <p className="font-medium">Payroll Calculation</p>
          <p className="mt-1 text-muted-foreground">
            Based on 22 working days. Extra WFH deducts 25% of daily salary. Extra leave deducts 100% of daily salary.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <h2 className="font-semibold text-card-foreground">Generate Payroll</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Year</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Month</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthNames.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleDownload} className="w-full gap-2" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download Payroll
        </Button>
      </div>
    </div>
  );
}
