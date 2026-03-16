import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/StatusChip';
import { PageHeader } from '@/components/PageHeader';
import { attendanceApi, passkeyApi, PunchResponse } from '@/lib/api';
import { getDeviceId, isPasskeySupported, createPasskeyCredential, getPasskeyAssertion } from '@/lib/device';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/api-error';
import { MapPin, Clock, Loader2, CheckCircle2, XCircle, Navigation, Fingerprint, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Attendance() {
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [result, setResult] = useState<PunchResponse | null>(null);
  const [punchedIn, setPunchedIn] = useState(false);
  const [registeringPasskey, setRegisteringPasskey] = useState(false);
  const [passkeyReady, setPasskeyReady] = useState<boolean | null>(null); // null = checking
  const { toast } = useToast();

  // Check if user has a registered passkey
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
      // 1. Get registration options from server
      const optionsRes = await passkeyApi.registerOptions();
      const options = optionsRes.data;

      // 2. Create credential on device (OS-level key generation)
      const credential = await createPasskeyCredential(options);

      // 3. Send credential to server
      await passkeyApi.register({
        credentialId: credential.credentialId,
        publicKey: credential.publicKey,
        clientDataJSON: credential.clientDataJSON,
        deviceId: getDeviceId(),
      });

      setPasskeyReady(true);
      toast({ title: 'Device Registered', description: 'This device is now registered for attendance punching.' });
    } catch (err: any) {
      // User cancelled the passkey dialog
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
      // 1. Get passkey challenge from server
      const challengeRes = await passkeyApi.challenge();
      const challengeData = challengeRes.data;

      // 2. Sign challenge with device passkey (OS-level crypto)
      const assertion = await getPasskeyAssertion(challengeData);

      // 3. Get device location
      const pos = await getLocation();
      setLocationLoading(false);

      // 4. Send punch request with passkey proof + location
      const payload = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        capturedAt: new Date().toISOString(),
        passkey: assertion,
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

      if (err?.name === 'NotAllowedError') {
        toast({ title: 'Passkey Required', description: 'Passkey verification was cancelled. Please try again.', variant: 'destructive' });
      } else if (err?.code === 1 || err?.code === 2 || err?.code === 3) {
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

      {/* Passkey Registration Card — shown if no passkey registered */}
      {passkeyReady === false && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-warning/20 bg-warning/5 p-5 space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning shrink-0">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">Register This Device</h3>
              <p className="text-xs text-muted-foreground mt-1">
                You need to register this device before you can punch in or out.
                This binds your attendance to this physical device — it cannot be transferred.
              </p>
            </div>
          </div>
          <Button
            onClick={handleRegisterPasskey}
            disabled={registeringPasskey}
            className="w-full h-12 gap-2 rounded-xl"
          >
            {registeringPasskey ? <Loader2 className="h-5 w-5 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
            {registeringPasskey ? 'Registering...' : 'Register Device for Attendance'}
          </Button>
        </motion.div>
      )}

      {/* Passkey registered indicator */}
      {passkeyReady === true && (
        <div className="flex items-center gap-2 rounded-xl bg-success/5 border border-success/20 px-4 py-2.5 text-xs text-success">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Device registered for attendance</span>
        </div>
      )}

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
            disabled={loading || passkeyReady !== true}
            className="h-14 gap-2 text-base rounded-xl"
            variant="default"
          >
            {loading && !punchedIn ? <Loader2 className="h-5 w-5 animate-spin" /> : <Clock className="h-5 w-5" />}
            Punch In
          </Button>
          <Button
            onClick={() => handlePunch('out')}
            disabled={loading || passkeyReady !== true}
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
        <p>• Punching is only allowed from your registered device</p>
      </div>
    </div>
  );
}
