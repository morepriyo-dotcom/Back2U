import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ChevronLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="relative z-10 max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Recover Your Password</h1>
        <p className="text-xs text-slate-400">
          Enter your registered email address and we'll send verification recovery instructions.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-4 text-xs">
        {sent ? (
          <div className="text-center space-y-3 py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Reset Link Dispatched</h3>
            <p className="text-slate-400 leading-relaxed">
              If an account matches <strong>{email}</strong>, a recovery link has been forwarded. Check your inbox.
            </p>
            <Link
              to="/login"
              className="inline-block mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-1.5"
            >
              <Mail className="w-4 h-4" />
              Send Recovery Link
            </button>
          </form>
        )}

        <div className="pt-2 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
