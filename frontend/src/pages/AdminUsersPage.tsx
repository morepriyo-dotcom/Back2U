import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [restrictedOnly, setRestrictedOnly] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [penaltyPoints, setPenaltyPoints] = useState<number>(10);
  const [reason, setReason] = useState('');
  const [restrictAccount, setRestrictAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers(restrictedOnly);
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [restrictedOnly]);

  const handlePenaltySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.applyAdminPenalty(selectedUser.id, {
        penalty_points: Number(penaltyPoints),
        reason: reason || 'Violation of platform honesty code',
        restrict_account: restrictAccount,
      });
      setSelectedUser(null);
      fetchUsers();
      alert('Penalty successfully applied');
    } catch (err: any) {
      alert(err.message || 'Failed to apply penalty');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          User Trust Scores & Moderation
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review community reputation scores, investigate abuse reports, and enforce penalties.
        </p>
      </div>

      <div className="text-xs text-slate-300">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={restrictedOnly}
            onChange={(e) => setRestrictedOnly(e.target.checked)}
            className="rounded bg-[#070D1A] border-blue-900 text-blue-600"
          />
          <span>Show Restricted Accounts Only</span>
        </label>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="p-4 rounded-xl bg-[#091224]/90 border border-blue-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-3">
                <img
                  src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.full_name}`}
                  alt={u.full_name}
                  className="w-10 h-10 rounded-full object-cover border border-blue-500/30"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-white text-sm">{u.full_name}</strong>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300">
                      {u.role}
                    </span>
                    {u.is_restricted && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold">
                        Restricted
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Trust Score:</span>
                  <strong className="text-emerald-400 font-bold">{u.trust_score} / 150</strong>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Penalty Points:</span>
                  <strong className={u.penalty_points > 0 ? 'text-red-400 font-bold' : 'text-slate-300 font-bold'}>
                    {u.penalty_points} pts
                  </strong>
                </div>

                <button
                  onClick={() => {
                    setSelectedUser(u);
                    setReason('');
                    setPenaltyPoints(10);
                    setRestrictAccount(u.is_restricted);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-[#0E1A33] border border-blue-500/30 hover:border-red-400 hover:text-red-300 transition-all"
                >
                  Apply Penalty
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Penalty Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0A1224] border border-blue-500/40 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/30">
              <h3 className="text-sm font-bold text-white">
                Apply Penalty: {selectedUser.full_name}
              </h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white">
                Cancel
              </button>
            </div>

            <form onSubmit={handlePenaltySubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Penalty Points Amount
                </label>
                <select
                  value={penaltyPoints}
                  onChange={(e) => setPenaltyPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value={5}>-5 PTS (Minor unverified claim)</option>
                  <option value={10}>-10 PTS (Rejected false ownership claim)</option>
                  <option value={25}>-25 PTS (Intentional fraudulent abuse)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Reason for Moderation Penalty *
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Repeatedly claimed high-value laptop with generic answers"
                  className="w-full px-3 py-2 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="restrict"
                  checked={restrictAccount}
                  onChange={(e) => setRestrictAccount(e.target.checked)}
                  className="rounded bg-[#070D1A] border-blue-900 text-red-600"
                />
                <label htmlFor="restrict" className="text-slate-300 font-semibold">
                  Restrict account from submitting future claims
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 shadow-md transition-all disabled:opacity-50"
              >
                {submitting ? 'Applying Penalty...' : 'Confirm Penalty'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
