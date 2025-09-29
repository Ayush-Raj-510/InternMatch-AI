import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';

export function SignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signin, signup, sendOtp, verifyOtp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // OTP states
  const [otpStage, setOtpStage] = useState<'form' | 'code'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (!otpSentAt) { setResendCountdown(0); return; }
    let cancelled = false;
    const tick = () => {
      const seconds = Math.max(0, 60 - Math.floor((Date.now() - (otpSentAt || 0)) / 1000));
      if (cancelled) return;
      setResendCountdown(seconds);
      if (seconds > 0) setTimeout(tick, 500);
    };
    tick();
    return () => { cancelled = true; };
  }, [otpSentAt]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otpStage === 'code') {
      // verify flow
      const res = await verifyOtp(email.trim(), otpCode.trim());
      if (!res.ok) setError(res.error || 'Invalid code');
      else { onClose(); }
      return;
    }

    if (mode === 'signin') {
      const res = await signin(email.trim(), password);
      if (!res.ok) setError(res.error || 'Failed to sign in');
      else onClose();
    } else {
      const res = await signup(email.trim(), password, name.trim() || undefined);
      if (!res.ok) setError(res.error || 'Failed to register');
      else onClose();
    }
  }

  async function handleSendOtp() {
    setError(null);
    if (!email) { setError('Provide an email'); return; }
    const res = await sendOtp(email.trim(), mode, password || undefined, name || undefined);
    if (!res.ok) { setError(res.error || 'Failed to send OTP'); return; }
    setOtpStage('code');
    setOtpSentAt(Date.now());
    setOtpCode('');
    // Informative message
    // eslint-disable-next-line no-console
    console.info('OTP sent (check console for demo codes)');
  }

  async function handleResendOtp() {
    if (resendCountdown > 0) return; // throttle
    await handleSendOtp();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold">{mode === 'signin' ? 'Sign in' : 'Create account'}</h3>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && otpStage === 'form' && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name (optional)" className="w-full rounded-md border px-3 py-2" />
          )}

          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-md border px-3 py-2" />

          {otpStage === 'form' && (
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full rounded-md border px-3 py-2" />
          )}

          {otpStage === 'code' && (
            <div>
              <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Enter OTP code" />
              <div className="mt-2 text-sm text-muted-foreground">Enter the 6-digit code sent to your email (demo codes are logged to console).</div>
            </div>
          )}

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button type="submit">{otpStage === 'code' ? 'Verify code' : mode === 'signin' ? 'Sign in' : 'Create account'}</Button>

              {otpStage === 'form' ? (
                <Button variant="outline" type="button" onClick={handleSendOtp}>Send OTP</Button>
              ) : (
                <Button variant="outline" type="button" onClick={handleResendOtp} disabled={resendCountdown>0}>Resend{resendCountdown>0?` (${resendCountdown}s)`:''}</Button>
              )}

              <Button variant="outline" type="button" onClick={() => { setOtpStage('form'); onClose(); }}>Close</Button>
            </div>
            <div className="text-sm">
              <button type="button" className="underline" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setOtpStage('form'); setError(null); }}>
                {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
              </button>
            </div>
          </div>
        </form>
        {otpStage === 'code' && (
          <div className="mt-3 text-xs text-muted-foreground">Didn't get it? Check spam or use the "Resend" button. (This demo logs OTP codes to the browser console.)</div>
        )}
      </div>
    </div>
  );
}
