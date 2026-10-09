import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Sparkles, Shield, User, Award, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, demoLogin, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleDemo = async (role: string) => {
    try {
      await demoLogin(role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
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
        <h1 className="text-2xl font-bold text-white tracking-tight">Sign in to Back2U</h1>
        <p className="text-xs text-slate-400">
          Enter your credentials or choose a quick test persona below.
        </p>
      </div>

      {/* Demo Persona Quick Logins */}
      <div className="p-4 rounded-2xl bg-[#091224]/90 border border-blue-500/30 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>One-Click Development Demo Login</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleDemo('finder')}
            className="p-2.5 rounded-xl bg-[#0C172E] border border-blue-900/50 hover:border-blue-400 text-left transition-all"
          >
            <strong className="text-white block">Rohan</strong>
            <span className="text-[10px] text-blue-400">Finder • 350 pts</span>
          </button>
          <button
            type="button"
            onClick={() => handleDemo('owner')}
            className="p-2.5 rounded-xl bg-[#0C172E] border border-blue-900/50 hover:border-purple-400 text-left transition-all"
          >
            <strong className="text-white block">Priya</strong>
            <span className="text-[10px] text-purple-400">Owner • 180 pts</span>
          </button>
          <button
            type="button"
            onClick={() => handleDemo('claimant')}
            className="p-2.5 rounded-xl bg-[#0C172E] border border-blue-900/50 hover:border-amber-400 text-left transition-all"
          >
            <strong className="text-white block">Vikram</strong>
            <span className="text-[10px] text-amber-400">Claimant • 90 pts</span>
          </button>
          <button
            type="button"
            onClick={() => handleDemo('admin')}
            className="p-2.5 rounded-xl bg-[#0C172E] border border-blue-900/50 hover:border-indigo-400 text-left transition-all"
          >
            <strong className="text-white block">Admin</strong>
            <span className="text-[10px] text-indigo-400">Administrator</span>
          </button>
        </div>
      </div>

      {/* Login Form */}
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
          <label className="block text-slate-300 font-semibold mb-1">Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@domain.com"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 text-xs"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-300 font-semibold">Password</label>
            <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300 text-[11px]">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 text-xs"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <LogIn className="w-4 h-4" />
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="text-center text-slate-400 text-xs pt-2">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 font-semibold hover:text-blue-300">
            Create account
          </Link>
        </p>
      </form>

    </div>
  );
};
