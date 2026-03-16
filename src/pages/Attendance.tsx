import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/StatusChip';
import { attendanceApi, passkeyApi, PunchResponse } from '@/lib/api';
import { getDeviceId, isPasskeySupported, createPasskeyCredential, getPasskeyAssertion } from '@/lib/device';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error';
import { MapPin, Clock, Loader2, CheckCircle2, XCircle, Navigation, Fingerprint, ShieldCheck, LogIn, LogOut, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Attendance() {
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [result, setResult] = useState<PunchResponse | null>(null);
  const [punchedIn, setPunchedIn] = useState(false);
  const [registeringPasskey, setRegisteringPasskey] = useState(false);
  const [passkeyReady, setPasskeyReady] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await passkeyApi.status();
        if (!cancelled) setPasskeyReady(res.data === true);
      } catch {
        if (!cancelled) setPasskeyReady(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  const handleRegisterPasskey = async () => {
    if (!isPasskeySupported()) {
      toast({ title: 'Not Supported', description: 'Passkeys are not supported on this browser. Please use a modern mobile browser.', variant: 'destructive' });
      return;
    }
    setRegisteringPasskey(true);
    try {
      const optionsRes = await passkeyApi.registerOptions();
      const credential = await createPasskeyCredential(optionsRes.data);
      await passkeyApi.register({ credentialId: credential.credentialId, publicKey: credential.publicKey, clientDataJSON: credential.clientDataJSON, deviceId: getDeviceId() });
      setPasskeyReady(true);
      toast({ title: 'Device Registered', description: 'This device is now registered for attendance punching.' });
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        toast({ title: 'Cancelled', description: 'Passkey registration was cancelled.', variant: 'destructive' });
      } else {
        handleApiError(err, { title: 'Registration Failed' });
      }
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const getLocation = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    });
  }, []);

  const handlePunch = async (type: 'in' | 'out') => {
    setLoading(true);
    setResult(null);
    try {
      const challengeRes = await passkeyApi.challenge();
      const assertion = await getPasskeyAssertion(challengeRes.data);
      const pos = await getLocation();
      setLocationLoading(false);
      const payload = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, capturedAt: new Date().toISOString(), passkey: assertion };
      const res = type === 'in' ? await attendanceApi.punchIn(payload) : await attendanceApi.punchOut(payload);
      setResult(res.data);
      if (res.data.status === 'ACCEPTED') {
        setPunchedIn(type === 'in');
        toast({ title: type === 'in' ? 'Punched In!' : 'Punched Out!', description: res.data.message });
      } else {
        toast({ title: 'Punch Rejected', description: res.data.message, variant: 'destructive' });
      }
    } catch (err: any) {
      setLocationLoading(false);
      if (err?.name === 'NotAllowedError') {
        toast({ title: 'Passkey Required', description: 'Passkey verification was cancelled. Please try again.', variant: 'destructive' });
      } else if (err?.code === 1 || err?.code === 2 || err?.code === 3) {
        const msg = err.code === 1 ? 'Location permission denied. Please enable it.' : err.code === 2 ? 'Location unavailable. Try again.' : 'Location request timed out.';
        toast({ title: 'Location Error', description: msg, variant: 'destructive' });
      } else {
        handleApiError(err, { title: 'Punch Failed' });
      }
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in-up">

      {/* Hero section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-28 w-28 rounded-full bg-accent/5 blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Navigation className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">Attendance</h1>
              <p className="text-sm text-primary-foreground/60">Geofenced punch system</p>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary-foreground">{timeStr}</span>
            <span className="text-sm text-primary-foreground/50">{dateStr}</span>
          </div>
        </div>
      </div>

      {/* Passkey registration card */}
      <AnimatePresence>
        {passkeyReady === false && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="rounded-2xl border border-warning/20 bg-warning/5 p-6 space-y-5"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 text-warning shrink-0">
                <Fingerprint className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground text-base">Register This Device</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Bind this phone to your attendance account. Once registered, only this device can be used to punch in and out.
                </p>
              </div>
            </div>
            <Button onClick={handleRegisterPasskey} disabled={registeringPasskey} className="w-full h-12 gap-2 rounded-xl text-base">
              {registeringPasskey ? <Loader2 className="h-5 w-5 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
              {registeringPasskey ? 'Registering...' : 'Register Device'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Passkey success badge */}
      {passkeyReady === true && (
        <div className="flex items-center gap-2.5 rounded-xl bg-success/5 border border-success/20 px-4 py-3 text-sm text-success">
          <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
          <span className="font-medium">Device verified</span>
        </div>
      )}

      {/* Punch buttons */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handlePunch('in')}
          disabled={loading || passkeyReady !== true}
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card text-left transition-all hover:shadow-card-hover hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-success/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success mb-4 transition-transform group-hover:scale-110">
            {loading && !punchedIn ? <Loader2 className="h-6 w-6 animate-spin" /> : <LogIn className="h-6 w-6" />}
          </div>
          <p className="font-semibold text-card-foreground text-lg">Punch In</p>
          <p className="text-xs text-muted-foreground mt-1">Start your workday</p>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handlePunch('out')}
          disabled={loading || passkeyReady !== true}
          className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card text-left transition-all hover:shadow-card-hover hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent mb-4 transition-transform group-hover:scale-110">
            {loading && punchedIn ? <Loader2 className="h-6 w-6 animate-spin" /> : <LogOut className="h-6 w-6" />}
          </div>
          <p className="font-semibold text-card-foreground text-lg">Punch Out</p>
          <p className="text-xs text-muted-foreground mt-1">End your workday</p>
        </motion.button>
      </div>

      {/* Location loading */}
      <AnimatePresence>
        {locationLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 text-sm text-muted-foreground rounded-xl bg-muted/50 border border-border/50 p-4"
          >
            <Loader2 className="h-4 w-4 animate-spin text-accent shrink-0" />
            <span>Acquiring your location...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`rounded-2xl border p-6 shadow-card ${
              result.status === 'ACCEPTED'
                ? 'border-success/20 bg-success/5'
                : 'border-destructive/20 bg-destructive/5'
            }`}
          >
            <div className="flex items-start gap-4">
              {result.status === 'ACCEPTED' ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/10 shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 shrink-0">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
              )}
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <StatusChip status={result.status} />
                </div>
                <p className="text-sm text-card-foreground font-medium">{result.message}</p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {result.distanceMeters != null && (
                    <span className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2.5 py-1">
                      <MapPin className="h-3 w-3" />
                      {result.distanceMeters.toFixed(0)}m away
                    </span>
                  )}
                  {result.radiusMeters != null && (
                    <span className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2.5 py-1">
                      <Navigation className="h-3 w-3" />
                      {result.radiusMeters}m radius
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info footer */}
      <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info/5 p-4">
        <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
        <div className="text-sm text-card-foreground">
          <p className="font-semibold">How it works</p>
          <ul className="mt-1.5 text-muted-foreground leading-relaxed space-y-1">
            <li>Your location is captured automatically on each punch</li>
            <li>You must be within the office geofence to punch successfully</li>
            <li>Punching is restricted to your registered device only</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
