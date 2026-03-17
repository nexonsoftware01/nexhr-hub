import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StatusChip } from '@/components/StatusChip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { announcementApi, AnnouncementResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error';
import { Megaphone, Plus, Loader2, Trash2, User, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const canCreate = user?.role === 'DIRECTOR' || user?.role === 'HR';

  const fetchAnnouncements = () => {
    setLoading(true);
    announcementApi.list()
      .then(res => setAnnouncements(res.data || []))
      .catch(err => handleApiError(err, { title: 'Failed to load announcements' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await announcementApi.delete(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Deleted', description: 'Announcement has been removed.' });
    } catch (err: any) {
      handleApiError(err, { title: 'Delete Failed' });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in-up">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-28 w-28 rounded-full bg-accent/5 blur-xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Megaphone className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">Announcements</h1>
              <p className="text-sm text-primary-foreground/60">Company-wide notices and updates</p>
            </div>
          </div>
          {canCreate && <CreateAnnouncementDialog onCreated={fetchAnnouncements} />}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : announcements.length > 0 ? (
        <AnimatePresence>
          <div className="space-y-4">
            {announcements.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-card-foreground">{a.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />{a.createdByName}
                      </span>
                      <StatusChip status={a.createdByRole} />
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {canCreate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(a.id)}
                      className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {a.content}
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <Megaphone className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No announcements yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Company announcements will appear here</p>
        </div>
      )}
    </div>
  );
}

function CreateAnnouncementDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      await announcementApi.create({ title: title.trim(), content: content.trim() });
      toast({ title: 'Published', description: 'Announcement has been published.' });
      setTitle(''); setContent('');
      setOpen(false);
      onCreated();
    } catch (err: any) {
      handleApiError(err, { title: 'Failed to create announcement' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl bg-white/10 text-primary-foreground border border-white/10 hover:bg-white/20 backdrop-blur-sm">
          <Plus className="h-4 w-4" />
          New Announcement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Megaphone className="h-4 w-4" />
            </div>
            New Announcement
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title..." required className="rounded-xl h-11" maxLength={200} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Content</label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your announcement here..." rows={6} required className="rounded-xl resize-none" maxLength={5000} />
          </div>
          <Button type="submit" className="w-full rounded-xl h-11 text-base" disabled={loading || !title.trim() || !content.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Megaphone className="h-4 w-4 mr-2" />}
            Publish Announcement
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
