import React, { useState, useEffect } from 'react';
import { 
  Trophy, Award, ShieldAlert, Sparkles, Clock, 
  ArrowUpRight, ArrowDownLeft, ShieldCheck, HeartHandshake
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RewardsSummary, PointTransaction } from '../types';

export const RewardsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [summary, setSummary] = useState<RewardsSummary | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sumRes, txRes] = await Promise.all([
          api.getRewardsSummary(),
          api.getTransactions(),
        ]);
        setSummary(sumRes);
        setTransactions(txRes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-yellow-400">
          <Trophy className="w-4 h-4" />
          <span>Incentive & Reputation System</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mt-1">
          Back2U Points & Trust Score
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Helping others is rewarded, not just appreciated. Earn points for reporting and returning belongings, and maintain high trust to unlock verified privileges.
        </p>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Points Balance Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#121B33] to-[#0A1124] border border-blue-500/30 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Back2U Points Wallet</span>
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white">
            {summary?.points_balance ?? (user?.points_balance || 100)}{' '}
            <span className="text-sm font-semibold text-blue-400">PTS</span>
          </div>
          <div className="text-xs text-blue-300 font-medium">
            Tier: {summary?.tier_name || 'Silver Finder'}
          </div>
        </div>

        {/* Trust Score Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0F1E36] to-[#091222] border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Trust Score</span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white">
            {summary?.trust_score ?? (user?.trust_score || 100)}{' '}
            <span className="text-xs font-semibold text-emerald-400">/ 150</span>
          </div>
          <div className="text-xs text-emerald-400 font-medium">
            Excellent Standing • High Verification Weight
          </div>
        </div>

        {/* Penalty Points Meter */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1A1428] to-[#0F0C1B] border border-purple-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Penalty Points</span>
            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white">
            {summary?.penalty_points ?? (user?.penalty_points || 0)}{' '}
            <span className="text-xs font-semibold text-slate-400">pts</span>
          </div>
          <div className="text-xs text-slate-400">
            Threshold: 50 pts triggers automatic restrictions
          </div>
        </div>

      </div>

      {/* Rules & Earning Mechanics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Earning Table */}
        <div className="p-6 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-400" />
            How to Earn Back2U Points
          </h3>
          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-center justify-between p-2.5 rounded-lg bg-[#070D1B] border border-blue-900/30">
              <span>Report a genuine found item</span>
              <strong className="text-emerald-400">+50 PTS</strong>
            </li>
            <li className="flex items-center justify-between p-2.5 rounded-lg bg-[#070D1B] border border-blue-900/30">
              <span>Successfully reunite item with verified owner</span>
              <strong className="text-emerald-400">+150 PTS</strong>
            </li>
            <li className="flex items-center justify-between p-2.5 rounded-lg bg-[#070D1B] border border-blue-900/30">
              <span>Provide verified distinguishing clues</span>
              <strong className="text-emerald-400">+25 PTS</strong>
            </li>
            <li className="flex items-center justify-between p-2.5 rounded-lg bg-[#070D1B] border border-blue-900/30">
              <span>Welcome community bonus</span>
              <strong className="text-emerald-400">+100 PTS</strong>
            </li>
          </ul>
        </div>

        {/* Penalty Table (from Slide 11) */}
        <div className="p-6 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Platform Moderation & Penalties
          </h3>
          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-center justify-between p-2.5 rounded-lg bg-[#070D1B] border border-blue-900/30">
              <span>Legitimate claim</span>
              <strong className="text-emerald-400">No Penalty</strong>
            </li>
            <li className="flex items-center justify-between p-2.5 rounded-lg bg-[#070D1B] border border-blue-900/30">
              <span>Suspicious unverified claim</span>
              <strong className="text-amber-400">−5 PTS</strong>
            </li>
            <li className="flex items-center justify-between p-2.5 rounded-lg bg-[#070D1B] border border-blue-900/30">
              <span>Rejected false ownership claim</span>
              <strong className="text-red-400">−10 PTS</strong>
            </li>
            <li className="flex items-center justify-between p-2.5 rounded-lg bg-[#070D1B] border border-blue-900/30">
              <span>Repeated fraudulent attempts</span>
              <strong className="text-red-500">−25 PTS & Restriction</strong>
            </li>
          </ul>
        </div>

      </div>

      {/* Point Transaction History Ledger */}
      <div className="p-6 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          Point Transaction History
        </h3>

        {transactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No transactions recorded yet. Report a found item to receive your first reward!
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const isPositive = tx.amount >= 0;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#070D1A] border border-blue-950/70 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{tx.description}</p>
                      <span className="text-[10px] text-slate-500">
                        {new Date(tx.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`font-bold ${
                      isPositive ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {isPositive ? `+${tx.amount}` : tx.amount} PTS
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
