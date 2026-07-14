import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi, TeamReviewRow } from '@/lib/api';
import { StarRating } from '@/components/StarRating';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error';
import { Award, Loader2, Users, Star, CheckCircle2, Mail, Briefcase, PenLine } from 'lucide-react';
import { motion } from 'framer-motion';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function TeamReviews() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [editing, setEditing] = useState<TeamReviewRow | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const { data, isLoading } = useQuery({
    queryKey: ['team-reviews', year, month],
    queryFn: () => reviewApi.team(year, month),
  });

  const team: TeamReviewRow[] = data?.data ?? [];
  const reviewedCount = team.filter(t => t.reviewed).length;
  const ratedRows = team.filter(t => t.rating != null);
  const avg = ratedRows.length
    ? ratedRows.reduce((s, t) => s + (t.rating ?? 0), 0) / ratedRows.length
    : 0;

  const mutation = useMutation({
    mutationFn: () => reviewApi.submit({
      employeeId: editing!.employeeId,
      year, month, rating,
      comment: comment.trim() || undefined,
    }),
    onSuccess: () => {
      toast({
        title: 'Review saved',
        description: `${editing?.employeeName} rated ${rating}★ for ${monthNames[month - 1]} ${year}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['team-reviews', year, month] });
      closeDialog();
    },
    onError: (err) => handleApiError(err, { title: 'Could not save review' }),
  });

  const openDialog = (row: TeamReviewRow) => {
    setEditing(row);
    setRating(row.rating ?? 0);
    setComment(row.comment ?? '');
  };
  const closeDialog = () => {
    setEditing(null);
    setRating(0);
    setComment('');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in-up">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-28 w-28 rounded-full bg-accent/5 blur-xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Award className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">Team Reviews</h1>
              <p className="text-sm text-primary-foreground/60">Rate your team's monthly performance</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
              <SelectTrigger className="h-11 w-[140px] rounded-xl bg-white/10 border-white/20 text-primary-foreground backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="h-11 w-[100px] rounded-xl bg-white/10 border-white/20 text-primary-foreground backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Team Size" value={team.length} subtitle="active members" icon={Users} iconClassName="bg-info/10 text-info" />
        <StatCard title="Reviewed" value={`${reviewedCount}/${team.length}`} subtitle={`for ${monthNames[month - 1]}`} icon={CheckCircle2} iconClassName="bg-success/10 text-success" />
        <StatCard title="Avg Rating" value={avg ? avg.toFixed(1) : '—'} subtitle="this month" icon={Star} iconClassName="bg-warning/10 text-warning" />
      </div>

      {/* Team list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : team.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <Users className="h-9 w-9 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No team members to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {team.map((row, i) => (
            <motion.div
              key={row.employeeId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-border bg-card p-5 shadow-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                  {row.employeeName?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-card-foreground truncate">{row.employeeName}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{row.email}</span>
                    {row.projectName && (
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{row.projectName}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                {row.reviewed ? (
                  <div className="flex items-center gap-2">
                    <StarRating value={row.rating ?? 0} readOnly size="sm" />
                    <span className="text-sm font-bold text-card-foreground">{row.rating}.0</span>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground/70 italic">Not rated yet</span>
                )}
                <Button
                  size="sm"
                  variant={row.reviewed ? 'outline' : 'default'}
                  className="rounded-xl gap-1.5"
                  onClick={() => openDialog(row)}
                >
                  <PenLine className="h-3.5 w-3.5" />
                  {row.reviewed ? 'Update' : 'Rate'}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Rating dialog */}
      <Dialog open={!!editing} onOpenChange={o => !o && closeDialog()}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate {editing?.employeeName}</DialogTitle>
            <DialogDescription>
              Performance for {monthNames[month - 1]} {year}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/25 border border-border/50 py-6">
              <StarRating value={rating} onChange={setRating} size="lg" />
              <p className="text-sm font-medium text-muted-foreground">
                {rating > 0 ? `${rating} / 5 stars` : 'Tap a star to rate'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Comment (optional)</label>
              <Textarea
                placeholder="Add feedback for this employee..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                className="rounded-xl resize-none text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={closeDialog} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              className="rounded-xl gap-2"
              onClick={() => mutation.mutate()}
              disabled={rating < 1 || mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
