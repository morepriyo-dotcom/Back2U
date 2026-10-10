import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserPlus, ShieldCheck, Phone, Mail, Lock, 
  ArrowRight, Sparkles, CheckCircle2, AlertTriangle, KeyRound 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register: registerUser, sendPhoneOTP, verifyPhoneOTP, isLoading } = useAuth();
  const navigate = useNavigate();

  const [registerMode, setRegisterMode] = useState<'standard' | 'phone_fast'>('phone_fast');

  // Phone fast registration state
  const [phone, setPhone] = useState('+91');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpSim, setDevOtpSim] = useState<string | null>(null);

  // Standard email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneOptional, setPhoneOptional] = useState('');

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) {
      setError('Please provide your full name');
      return;
    }
    if (!phone || phone.length < 8) {
      setError('Please enter a valid mobile number');
      return;
    }
    setSubmitting(true);
    try {
      const res = await sendPhoneOTP(phone);
      setOtpSent(true);
      if (res.dev_sms_simulation) {
        setDevOtpSim(res.dev_sms_simulation);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!acceptedTerms) {
      setError('You must accept the terms of service and statutory community guidelines');
      return;
    }
    setSubmitting(true);
    try {
      await verifyPhoneOTP(phone, otpCode, fullName);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStandardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!acceptedTerms) {
      setError('You must accept the terms of service and statutory community guidelines');
      return;
    }

    setSubmitting(true);
    try {
      await registerUser({
        full_name: fullName,
        email,
        phone_number: phoneOptional || undefined,
        password,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
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
        <h1 className="text-2xl font-bold text-white tracking-tight">Create Citizen Account</h1>
        <p className="text-xs text-slate-400">
          Join the trusted lost-and-found recovery network. Welcome bonus: <strong className="text-yellow-400">+100 Back2U Points!</strong>
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex bg-[#070D1B] p-1 rounded-xl border border-blue-900/40 text-xs font-semibold">
        <button
          type="button"
          onClick={() => { setRegisterMode('phone_fast'); setError(''); }}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
            registerMode === 'phone_fast'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Instant Mobile OTP Sign-Up</span>
        </button>

        <button
          type="button"
          onClick={() => { setRegisterMode('standard'); setError(''); }}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
            registerMode === 'standard'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email & Password</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* MODE 1: PHONE FAST SIGN-UP */}
      {registerMode === 'phone_fast' && (
        <div className="p-6 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-4 text-xs">
          {!otpSent ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Priya Patel"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Mobile Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Sending OTP Code...' : 'Send SMS Verification Code'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              {devOtpSim && (
                <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/50 text-[11px] text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold block text-blue-300 mb-0.5">Development / Fallback OTP Code:</span>
                    <span>{devOtpSim}</span>
                  </div>
                  {devOtpSim.match(/\d{6}/) && (
                    <button
                      type="button"
                      onClick={() => {
                        const code = devOtpSim.match(/\d{6}/)?.[0] || '';
                        setOtpCode(code);
                      }}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] shrink-0 self-start sm:self-auto"
                    >
                      Auto-fill OTP
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">
                    Enter 6-Digit SMS Code sent to {phone}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); }}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Edit Phone
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-lg tracking-widest text-center text-white placeholder-slate-600 font-mono focus:outline-none focus:border-blue-400"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Statutory Legal Checkbox */}
              <label className="flex items-start gap-2.5 text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 rounded bg-[#070D1A] border-blue-900 text-blue-600"
                />
                <span className="text-[11px] leading-relaxed">
                  I agree to the Back2U Community Rules and statutory responsibilities under Section 168/169 of the Indian Contract Act (Bailment of goods & truthful claims).
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting || otpCode.length !== 6 || !acceptedTerms}
                className="w-full py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Creating Citizen Profile...' : 'Verify OTP & Complete Registration'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* MODE 2: STANDARD EMAIL & PASSWORD */}
      {registerMode === 'standard' && (
        <form
          onSubmit={handleStandardSubmit}
          className="p-6 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-4 text-xs"
        >
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Full Name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Priya Patel"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@college.edu"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Mobile Phone (Optional for SMS Alerts)</label>
            <input
              type="tel"
              value={phoneOptional}
              onChange={(e) => setPhoneOptional(e.target.value)}
              placeholder="+919876543210"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Confirm Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              required
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 rounded bg-[#070D1A] border-blue-900 text-blue-600"
            />
            <span className="text-[11px] leading-relaxed">
              I agree to the Back2U Community Rules and statutory responsibilities under Section 168/169 of the Indian Contract Act.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || !acceptedTerms}
            className="w-full py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Creating Account...' : 'Create Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Footer Navigation */}
      <div className="text-center text-xs text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-blue-400 hover:underline">
          Sign In
        </Link>
      </div>

    </div>
  );
};
