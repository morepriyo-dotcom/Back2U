import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, AlertTriangle, CheckCircle, XCircle, ArrowRight, Eye } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Claim } from '../types';

export const ClaimsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'received' | 'submitted'>('received');
  const [submittedClaims, setSubmittedClaims] = useState<Claim[]>([]);
  const [receivedClaims, setReceivedClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewClaim, setReviewClaim] = useState<Claim | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data = await api.getMyClaims();
      setSubmittedClaims(data.submitted_claims || []);
      setReceivedClaims(data.received_claims || []);
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
    fetchClaims();
  }, [isAuthenticated]);

  const handleUpdateStatus = async (claimId: number, status: string, reason?: string) => {
    setUpdating(true);
    try {
      await api.updateClaimStatus(claimId, {
        status,
        rejection_reason: reason,
      });
      setReviewClaim(null);
      fetchClaims();
    } catch (err: any) {
      alert(err.message || 'Failed to update claim');
    } finally {
      setUpdating(false);
    }
  };

  const currentList = activeTab === 'received' ? receivedClaims : submittedClaims;

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Ownership Claims & Verification</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review evidence submitted for items you found, or track your submitted ownership claims.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-blue-900/30 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('received')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'received' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Claims on Items I Found ({receivedClaims.length})
          {activeTab === 'received' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('submitted')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'submitted' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          My Submitted Claims ({submittedClaims.length})
          {activeTab === 'submitted' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Claims List */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      ) : currentList.length === 0 ? (
        <div className="py-20 text-center p-8 rounded-2xl bg-[#091224]/50 border border-blue-900/30">
          <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No active claims in this section</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {activeTab === 'received'
              ? 'When someone claims an item you reported finding, their private verification answers will appear here.'
              : 'You have not submitted any ownership claims yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((claim) => (
            <div
              key={claim.id}
              className="p-5 rounded-2xl bg-[#091224]/90 border border-blue-900/35 hover:border-blue-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    {claim.status.replace('_', ' ')}
                  </span>
                  {claim.is_disputed && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Disputed Case (Multiple Claimants)
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    Claim #{claim.id} • {new Date(claim.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">
                  {claim.item_title || `Item #${claim.item_id}`}
                </h3>

                <p className="text-xs text-slate-400">
                  {activeTab === 'received'
                    ? `Claimant: ${claim.claimant_name || 'Anonymous'} (Trust Score: ${claim.claimant_trust_score || 100})`
                    : `Finder: ${claim.finder_name || 'Community Member'}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {activeTab === 'received' && (
                  <button
                    onClick={() => setReviewClaim(claim)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.4)] transition-all flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Review Evidence
                  </button>
                )}

                <Link
                  to={`/recovery/${claim.id}`}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#0E1A33] border border-blue-500/30 hover:text-white transition-all flex items-center gap-1.5"
                >
                  Track Handover
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal for Finder */}
      {reviewClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0A1224] border border-blue-500/40 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/30">
              <h3 className="text-base font-bold text-white">
                Review Claim Evidence: {reviewClaim.item_title}
              </h3>
              <button
                onClick={() => setReviewClaim(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070D1A] border border-blue-900/40 space-y-2 text-xs">
              <span className="font-semibold text-blue-300 block">
                Claimant's Distinguishing Features Answer:
              </span>
              <p className="text-slate-200 whitespace-pre-wrap">
                {reviewClaim.challenge_answers || 'No specific answer provided.'}
              </p>
              {reviewClaim.serial_number_provided && (
                <p className="text-slate-400 pt-1">
                  Serial Number: <strong className="text-white">{reviewClaim.serial_number_provided}</strong>
                </p>
              )}
            </div>

            {/* Reject reason input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Notes / Rejection Reason (if rejecting)
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Details do not match the item in possession"
                className="w-full px-3 py-2 rounded-xl bg-[#070D1A] border border-blue-900/50 text-xs text-white focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Approval / Rejection buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus(reviewClaim.id, 'REJECTED', rejectReason || 'Evidence did not match')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/30 transition-all flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Reject Claim
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus(reviewClaim.id, 'MORE_EVIDENCE_REQUIRED')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/40 transition-all"
                >
                  Request More Evidence
                </button>
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus(reviewClaim.id, 'APPROVED')}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Claim
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
