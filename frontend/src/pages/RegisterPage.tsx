import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!acceptedTerms) {
      setError('You must accept the terms of service and community guidelines');
      return;
    }

    try {
      await registerUser({
        full_name: fullName,
        email,
        password,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="relative z-10 max-w-md mx-auto px-4 py-16 space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <Link to="/" className="inline-flex items-center gap-1 mb-2">
          <span className="text-3xl font-black tracking-tight text-white">Back</span>
          <span className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">
            2U
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">Create your Back2U account</h1>
        <p className="text-xs text-slate-400">
          Join the trusted lost-and-found recovery network. Welcome bonus: 100 Back2U Points!
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-4 text-xs"
      >
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Priya Patel"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 text-xs"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Email address *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="priya@college.edu"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 text-xs"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Password *</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 text-xs"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">Confirm Password *</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 text-xs"
          />
        </div>

        <div className="flex items-start gap-2 pt-1">
          <input
            type="checkbox"
            id="terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 rounded bg-[#070D1A] border-blue-900 text-blue-600 focus:ring-0"
          />
          <label htmlFor="terms" className="text-slate-400 leading-tight">
            I agree to the <Link to="/#terms" className="text-blue-400 hover:underline">Terms of Service</Link>, community honesty guidelines, and anti-fraud policies.
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <UserPlus className="w-4 h-4" />
          {isLoading ? 'Creating account...' : 'Create Account (+100 PTS)'}
        </button>

        <p className="text-center text-slate-400 text-xs pt-2">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 font-semibold hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </form>

    </div>
  );
};
