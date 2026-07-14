import { useQuery } from '@tanstack/react-query';
import { reviewApi, ReviewResponse } from '@/lib/api';
import { StarRating } from '@/components/StarRating';
import { StatCard } from '@/components/StatCard';
import { Star, Loader2, MessageSquare, TrendingUp, Award, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function MyReviews() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => reviewApi.my(),
  });

  const reviews: ReviewResponse[] = data?.data ?? [];

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;
  const latest = reviews[0]; // backend returns newest first

  // Chronological order for the trend chart
  const chartData = [...reviews]
    .sort((a, b) => (a.year - b.year) || (a.month - b.month))
    .map(r => ({ label: `${monthNames[r.month - 1]} '${String(r.year).slice(2)}`, rating: r.rating }));

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in-up">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-28 w-28 rounded-full bg-accent/5 blur-xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <Star className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">My Performance Reviews</h1>
            <p className="text-sm text-primary-foreground/60">Monthly ratings from your manager</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <Star className="h-9 w-9 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">You haven't been reviewed yet.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Reviews appear here at the end of each month.</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Average Rating"
              value={avg.toFixed(1)}
              subtitle={`across ${reviews.length} review${reviews.length > 1 ? 's' : ''}`}
              icon={TrendingUp}
              iconClassName="bg-warning/10 text-warning"
            />
            <StatCard
              title="Latest"
              value={latest ? `${latest.rating}/5` : '—'}
              subtitle={latest ? `${monthFull[latest.month - 1]} ${latest.year}` : undefined}
              icon={Award}
              iconClassName="bg-primary/10 text-primary"
            />
            <StatCard
              title="Total Reviews"
              value={reviews.length}
              subtitle="all time"
              icon={CalendarDays}
              iconClassName="bg-info/10 text-info"
            />
          </div>

          {/* Trend chart */}
          {chartData.length >= 2 && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold text-card-foreground">Rating Trend</h2>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 13 }}
                      formatter={(v: number) => [`${v} ★`, 'Rating']}
                    />
                    <Line type="monotone" dataKey="rating" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Review list */}
          <div className="space-y-4">
            {reviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {monthFull[r.month - 1]} {r.year}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <StarRating value={r.rating} readOnly size="md" />
                      <span className="text-sm font-bold text-card-foreground">{r.rating}.0</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Reviewed by</p>
                    <p className="text-sm font-semibold text-card-foreground">{r.managerName}</p>
                  </div>
                </div>

                {r.comment && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl bg-muted/25 border border-border/50 p-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm text-card-foreground">{r.comment}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
