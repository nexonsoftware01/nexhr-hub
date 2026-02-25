import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Building2, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authApi.sendOtp(email.trim());
      toast({ title: 'OTP Sent', description: `Verification code sent to ${email}` });
      setStep('otp');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to send OTP', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email.trim(), otp);
      login(res.data.accessToken, res.data.refreshToken);
      toast({ title: 'Welcome!', description: 'Logged in successfully' });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast({ title: 'Verification Failed', description: err.message || 'Invalid OTP', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await authApi.sendOtp(email.trim());
      toast({ title: 'OTP Resent', description: 'New code sent to your email' });
      setOtp('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between bg-gradient-hero p-10 text-primary-foreground relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent/10" />
        <div className="absolute bottom-20 -left-12 h-40 w-40 rounded-full bg-accent/5" />
        <div className="absolute bottom-40 right-10 h-20 w-20 rounded-full bg-accent/8" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">NexHR</h1>
          </div>
          <p className="text-sm font-medium tracking-widest uppercase text-primary-foreground/50">
            Nexon Software Solutions
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl xl:text-4xl font-bold leading-tight">
            Your complete
            <br />
            HR workspace
          </h2>
          <p className="text-base text-primary-foreground/70 leading-relaxed max-w-sm">
            Manage attendance, leaves, and your team — all in one modern, intuitive platform.
          </p>
          <div className="flex items-center gap-3 pt-4">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <span className="text-sm text-primary-foreground/60">Secure OTP-based authentication</span>
          </div>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/30">
          © {new Date().getFullYear()} Nexon Software Solutions. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">NexHR</h1>
              <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">Nexon Solutions</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Enter your email to receive a verification code</p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="name@nexon.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="pl-10 h-11"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-11 gap-2" disabled={loading || !email.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Send Verification Code
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground">Enter verification code</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button type="submit" className="w-full h-11 gap-2" disabled={loading || otp.length < 6}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Verify & Sign In
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => { setStep('email'); setOtp(''); }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-accent font-medium hover:text-accent/80 transition-colors disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
