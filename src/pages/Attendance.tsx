import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/StatusChip';
import { PageHeader } from '@/components/PageHeader';
import { attendanceApi, PunchResponse } from '@/lib/api';
import { getDeviceId } from '@/lib/device';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error';
import { MapPin, Clock, Loader2, CheckCircle2, XCircle, Navigation, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Attendance() {
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [result, setResult] = useState<PunchResponse | null>(null);
  const [punchedIn, setPunchedIn] = useState(false);
  const { toast } = useToast();

  const getLocation = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });
  }, []);

  const handlePunch = async (type: 'in' | 'out') => {
    setLoading(true);
    setResult(null);
    try {
      const pos = await getLocation();
      setLocationLoading(false);

      const payload = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        capturedAt: new Date().toISOString(),
      };

      const res = type === 'in'
        ? await attendanceApi.punchIn(payload)
        : await attendanceApi.punchOut(payload);

      setResult(res.data);

      if (res.data.status === 'ACCEPTED') {
        setPunchedIn(type === 'in');
        toast({ title: type === 'in' ? 'Punched In!' : 'Punched Out!', description: res.data.message });
      } else {
        toast({ title: 'Punch Rejected', description: res.data.message, variant: 'destructive' });
      }
    } catch (err: any) {
      setLocationLoading(false);

      if (err?.code === 1 || err?.code === 2 || err?.code === 3) {
        const msg = err.code === 1 ? 'Location permission denied. Please enable it.'
          : err.code === 2 ? 'Location unavailable. Try again.'
          : 'Location request timed out.';
        toast({ title: 'Location Error', description: msg, variant: 'destructive' });
      } else {
        handleApiError(err, { title: 'Punch Failed' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-fade-in-up">
      <PageHeader title="Attendance" description="Punch in or out with your current location" icon={Navigation} iconClassName="bg-accent/10 text-accent" />

      {/* Punch Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">Geofenced Attendance</h2>
            <p className="text-xs text-muted-foreground">Location will be captured automatically</p>
          </div>
        </div>

        {locationLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            <span>Acquiring location...</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handlePunch('in')}
            disabled={loading}
            className="h-14 gap-2 text-base rounded-xl"
            variant="default"
          >
            {loading && !punchedIn ? <Loader2 className="h-5 w-5 animate-spin" /> : <Clock className="h-5 w-5" />}
            Punch In
          </Button>
          <Button
            onClick={() => handlePunch('out')}
            disabled={loading}
            className="h-14 gap-2 text-base rounded-xl"
            variant="outline"
          >
            {loading && punchedIn ? <Loader2 className="h-5 w-5 animate-spin" /> : <Clock className="h-5 w-5" />}
            Punch Out
          </Button>
        </div>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`rounded-2xl border p-5 ${
              result.status === 'ACCEPTED'
                ? 'border-success/30 bg-success/5'
                : 'border-destructive/30 bg-destructive/5'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.status === 'ACCEPTED' ? (
                <CheckCircle2 className="h-6 w-6 text-success shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <StatusChip status={result.status} />
                </div>
                <p className="text-sm text-card-foreground">{result.message}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {result.distanceMeters != null && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {result.distanceMeters.toFixed(0)}m away
                    </span>
                  )}
                  {result.radiusMeters != null && (
                    <span>Allowed radius: {result.radiusMeters}m</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <div className="rounded-xl bg-muted/40 border border-border/50 p-4 text-xs text-muted-foreground space-y-1.5">
        <p>• Ensure location services are enabled for accurate tracking</p>
        <p>• You must be within the office geofence radius to punch successfully</p>
        <p>• Punch in first, then punch out when you leave</p>
        <p>• Punching is only allowed from your primary registered device</p>
      </div>

      {import.meta.env.DEV && (
        <div className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground flex items-center gap-2">
          <Smartphone className="h-3.5 w-3.5 shrink-0" />
          <span className="font-mono break-all">Device ID: {getDeviceId()}</span>
        </div>
      )}
    </div>
  );
}
