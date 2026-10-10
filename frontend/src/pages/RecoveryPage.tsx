import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, CheckCircle2, Clock, MapPin, User, 
  Award, ArrowRight, MessageSquare, AlertCircle, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const RecoveryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const fetchCase = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getRecoveryCase(Number(id));
      setCaseData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCase();
  }, [id, isAuthenticated]);

  const handleConfirmReturn = async () => {
    if (!id) return;
    setConfirming(true);
    try {
      const res = await api.confirmHandover(Number(id), {
        handover_notes: handoverNotes || 'Item handed back safely',
      });
      await fetchCase();
      await refreshUser();

      if (res.case_status === 'RETURN_CONFIRMED') {
        setShowCelebration(true);
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3B82F6', '#60A5FA', '#10B981', '#F59E0B'],
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to record return confirmation');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex justify-center items-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!caseData || !caseData.case) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p>Recovery case not found or unauthorized.</p>
      </div>
    );
  }

  const claim = caseData.case;
  const isFinder = caseData.is_finder;
  const isClaimant = caseData.is_claimant;
  const isAdmin = caseData.is_admin;
  const isReunited = claim.status === 'RETURN_CONFIRMED' || claim.status === 'CLOSED';

  return (
    <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Celebration Banner */}
      {showCelebration && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-blue-950/80 border border-emerald-500/50 shadow-2xl text-center space-y-2 animate-in zoom-in-95">
          <Sparkles className="w-10 h-10 text-yellow-400 mx-auto animate-bounce" />
          <h2 className="text-2xl font-black text-white">Item Successfully Reunited!</h2>
          <p className="text-xs text-emerald-300">
            {claim.points_awarded
              ? 'Both parties verified the handover with documented ownership proof. +150 Back2U Recovery Points have been awarded to the finder!'
              : 'Both parties verified in-person handover. In accordance with community rules, unverified handovers without submitted proof complete the return with 0 points awarded.'}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Recovery Case #{claim.id}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isReunited
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
              }`}
            >
              {claim.status.replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            {claim.item_title}
          </h1>
        </div>

        <div className="text-right text-xs text-slate-400">
          <span>Started {new Date(claim.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Timeline Steps Card */}
      <div className="p-6 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          Reunification Progress
        </h3>

        <div className="space-y-6">
          {caseData.steps.map((step: any, idx: number) => {
            const isCompleted = step.status === 'completed';
            const isInProgress = step.status === 'in-progress';
            return (
              <div key={idx} className="flex items-start gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : isInProgress
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 animate-pulse'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span>{idx + 1}</span>}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-sm font-bold ${
                        isCompleted ? 'text-white' : isInProgress ? 'text-blue-300' : 'text-slate-500'
                      }`}
                    >
                      {step.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">{step.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Handover Dual Confirmation Box */}
      <div className="p-6 rounded-2xl bg-[#0A1428] border border-blue-500/30 space-y-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-bold text-white">Dual-Party Return Confirmation</h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          To eliminate fraudulent claims and disputes, Back2U requires dual verification: the finder confirms handing the item over, and the owner confirms receipt.
        </p>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              claim.finder_confirmed
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-[#070D1A] border-blue-900/40 text-slate-400'
            }`}
          >
            <div>
              <span className="font-bold block text-white">Finder Confirmation</span>
              <span className="text-[11px]">
                {claim.finder_confirmed ? 'Confirmed Handover' : 'Pending Confirmation'}
              </span>
            </div>
            {claim.finder_confirmed && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          </div>

          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              claim.owner_confirmed
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-[#070D1A] border-blue-900/40 text-slate-400'
            }`}
          >
            <div>
              <span className="font-bold block text-white">Owner Confirmation</span>
              <span className="text-[11px]">
                {claim.owner_confirmed ? 'Confirmed Receipt' : 'Pending Confirmation'}
              </span>
            </div>
            {claim.owner_confirmed && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          </div>
        </div>

        {/* Confirmation Button for Logged-In User */}
        {!isReunited && (
          <div className="pt-2 space-y-3">
            <input
              type="text"
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              placeholder="Optional meeting note (e.g., Handed over at Campus Security Desk)..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
            />

            <button
              onClick={handleConfirmReturn}
              disabled={confirming}
              className="w-full py-3 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {confirming
                ? 'Recording verification...'
                : isFinder
                ? 'I Confirm I Returned This Item'
                : isClaimant
                ? 'I Confirm I Safely Received My Item'
                : 'Admin: Verify & Close Handover'}
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
