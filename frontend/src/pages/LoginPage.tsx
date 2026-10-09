import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogIn, Sparkles, Shield, User, Award, AlertTriangle, 
  Phone, Mail, ArrowRight, CheckCircle2, Lock, KeyRound 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, demoLogin, sendPhoneOTP, verifyPhoneOTP, isLoading } = useAuth();
  const navigate = useNavigate();

  const [authMethod, setAuthMethod] = useState<'phone' | 'email' | 'demo'>('phone');

  // Phone auth state
  const [phone, setPhone] = useState('+91');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtpSim, setDevOtpSim] = useState<string | null>(null);

  // Email auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    if (!phone || phone.length < 8) {
      setError('Please enter a valid mobile number');
      return;
    }
    setSubmitting(true);
    try {
      const res = await sendPhoneOTP(phone);
      setOtpSent(true);
      setCountdown(45);
      if (res.dev_sms_simulation) {
        setDevOtpSim(res.dev_sms_simulation);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    setSubmitting(true);
    try {
      await verifyPhoneOTP(phone, otpCode);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async (role: string) => {
    setError('');
    try {
      await demoLogin(role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    }
  };

  return (
    <div className="relative z-10 max-w-lg mx-auto px-4 py-12 space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link to="/" className="inline-flex items-center gap-1 mb-1">
          <span className="text-3xl font-black tracking-tight text-white">Back</span>
          <span className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">
            2U
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
        <p className="text-xs text-slate-400">
          Secure, authenticated access for item recovery, verified claims, and rewards.
        </p>
      </div>

      {/* Auth Method Navigation Tabs */}
      <div className="flex bg-[#070D1B] p-1 rounded-xl border border-blue-900/40 text-xs font-semibold">
        <button
          type="button"
          onClick={() => { setAuthMethod('phone'); setError(''); }}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
            authMethod === 'phone'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Mobile SMS OTP</span>
        </button>

        <button
          type="button"
          onClick={() => { setAuthMethod('email'); setError(''); }}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
            authMethod === 'email'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email & Password</span>
        </button>

        <button
          type="button"
          onClick={() => { setAuthMethod('demo'); setError(''); }}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
            authMethod === 'demo'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span>Quick Demo</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: PHONE SMS OTP */}
      {authMethod === 'phone' && (
        <div className="p-6 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-5">
          {!otpSent ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Enter your 10-digit number. An SMS containing a secure 6-digit code will be dispatched.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Sending OTP via SMS...' : 'Send SMS Verification Code'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              {devOtpSim && (
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-[11px] text-blue-200">
                  <span className="font-bold block text-blue-300 mb-0.5">Simulated SMS Dispatch (Development Mode)</span>
                  {devOtpSim}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Enter 6-Digit OTP Code sent to {phone}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); }}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Change Number
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/40 text-lg tracking-widest text-center text-white placeholder-slate-600 font-mono focus:outline-none focus:border-blue-400"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || otpCode.length !== 6}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Verifying Code...' : 'Verify OTP & Sign In'}
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-blue-950/70">
                <span>Didn't receive SMS?</span>
                <button
                  type="button"
                  disabled={countdown > 0}
                  onClick={() => handleSendOTP()}
                  className="font-semibold text-blue-400 hover:text-blue-300 disabled:text-slate-600"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: EMAIL & PASSWORD */}
      {authMethod === 'email' && (
        <form
          onSubmit={handleEmailSubmit}
          className="p-6 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-4 text-xs"
        >
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-blue-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Signing In...' : 'Sign In with Email'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* TAB 3: ONE-CLICK DEMO PERSONAS */}
      {authMethod === 'demo' && (
        <div className="p-5 rounded-2xl bg-[#091224]/90 border border-blue-500/30 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Select a Preconfigured Testing Persona</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemo('finder')}
              className="p-3 rounded-xl bg-[#0C172E] border border-blue-900/50 hover:border-blue-400 text-left transition-all"
            >
              <strong className="text-white block">Rohan (Finder)</strong>
              <span className="text-[10px] text-blue-400">Finder • 550 pts</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('owner')}
              className="p-3 rounded-xl bg-[#0C172E] border border-blue-900/50 hover:border-purple-400 text-left transition-all"
            >
              <strong className="text-white block">Priya (Owner)</strong>
              <span className="text-[10px] text-purple-400">Owner • 180 pts</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('claimant')}
              className="p-3 rounded-xl bg-[#0C172E] border border-blue-900/50 hover:border-amber-400 text-left transition-all"
            >
              <strong className="text-white block">Vikram (Claimant)</strong>
              <span className="text-[10px] text-amber-400">Claimant • Disputed</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('admin')}
              className="p-3 rounded-xl bg-[#0C172E] border border-blue-900/50 hover:border-indigo-400 text-left transition-all"
            >
              <strong className="text-white block">Alex (Admin)</strong>
              <span className="text-[10px] text-indigo-400">Full Access Control</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Switcher */}
      <div className="text-center text-xs text-slate-400 space-y-2">
        <p>
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-blue-400 hover:underline">
            Create an account
          </Link>
        </p>

        {/* Security badge footer */}
        <div className="pt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Protected by Rate-Limiting Throttling & 256-Bit Cryptographic Tokens</span>
        </div>
      </div>

    </div>
  );
};
