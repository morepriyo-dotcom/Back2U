import React from 'react';
import { User, ShieldCheck, ShieldAlert, Award, LogOut, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return <div className="py-20 text-center text-slate-400">Please sign in to view your profile.</div>;
  }

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Account & Trust Profile</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your personal standing, verified trust metrics, and community permissions.
        </p>
      </div>

      {/* Account Info Box */}
      <div className="p-6 rounded-2xl bg-[#091224]/90 border border-blue-900/35 flex items-center gap-5">
        <img
          src={user.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
          alt={user.full_name}
          className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/40"
        />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">{user.full_name}</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 uppercase">
              {user.role}
            </span>
          </div>
          <p className="text-xs text-slate-400">{user.email}</p>
          <span className="text-[11px] text-slate-500">
            Account created on {new Date(user.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Trust & Moderation Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Trust Score Box */}
        <div className="p-5 rounded-2xl bg-[#0B152B] border border-emerald-500/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Community Trust Score</span>
          </div>
          <div className="text-3xl font-black text-white">
            {user.trust_score} <span className="text-xs font-semibold text-emerald-400">/ 150</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            High trust scores give higher credibility during evidence reviews and expedite approval times for recovery cases.
          </p>
        </div>

        {/* Penalty Points Meter */}
        <div className="p-5 rounded-2xl bg-[#0B152B] border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <ShieldAlert className="w-4 h-4" />
            <span>Recorded Penalty Points</span>
          </div>
          <div className="text-3xl font-black text-white">
            {user.penalty_points} <span className="text-xs font-semibold text-slate-400">pts</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Penalty points are assigned when fraudulent or false ownership claims are filed. Reaching 50 points triggers automatic account restrictions.
          </p>
        </div>

      </div>

      {/* Restriction Notice if active */}
      {user.is_restricted && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-xs text-red-200 space-y-1">
          <strong className="text-red-400 block font-bold">Account Restriction Active</strong>
          <p>{user.restriction_reason || 'Excessive unverified claims detected. You may appeal to platform administrators.'}</p>
        </div>
      )}

      {/* Logout */}
      <div className="pt-4 border-t border-blue-900/30 flex justify-end">
        <button
          onClick={logout}
          className="px-5 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-all flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out of Account
        </button>
      </div>

    </div>
  );
};
