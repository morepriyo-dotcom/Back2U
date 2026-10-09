import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, FileText, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { Claim } from '../types';

export const AdminClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [disputedOnly, setDisputedOnly] = useState(false);
  const [highRiskOnly, setHighRiskOnly] = useState(false);

  // Resolution modal
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [action, setAction] = useState('APPROVE');
  const [reason, setReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminClaims(disputedOnly, highRiskOnly);
      setClaims(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [disputedOnly, highRiskOnly]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setSubmitting(true);
    try {
      await api.resolveAdminClaim(selectedClaim.id, {
        action,
        reason: reason || 'Administrative verification determination',
        admin_notes: adminNotes,
      });
      setSelectedClaim(null);
      fetchClaims();
      alert('Claim resolution recorded successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to record decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Review Disputed & High-Risk Claims</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review evidence, challenge responses, and conflicting claimant submissions.
        </p>
      </div>

      {/* Filter Checkboxes */}
      <div className="flex items-center gap-6 text-xs text-slate-300">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={disputedOnly}
            onChange={(e) => setDisputedOnly(e.target.checked)}
            className="rounded bg-[#070D1A] border-blue-900 text-blue-600"
          />
          <span>Show Disputed Cases Only</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={highRiskOnly}
            onChange={(e) => setHighRiskOnly(e.target.checked)}
            className="rounded bg-[#070D1A] border-blue-900 text-blue-600"
          />
          <span>Show High Risk (&ge; 50%) Only</span>
        </label>
      </div>

      {/* Table / Cards */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      ) : claims.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          No matching claims under review.
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="p-4 rounded-xl bg-[#091224]/90 border border-blue-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    {claim.item_title || `Item #${claim.item_id}`}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-semibold">
                    {claim.status}
                  </span>
                  {claim.is_disputed && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Disputed
                    </span>
                  )}
                  <span className="text-slate-400">
                    Risk: <strong className={claim.risk_score >= 0.5 ? 'text-red-400' : 'text-emerald-400'}>
                      {Math.round(claim.risk_score * 100)}%
                    </strong>
                  </span>
                </div>

                <p className="text-slate-400">
                  Claimant: <strong className="text-slate-200">{claim.claimant_name}</strong> • Answers: "{claim.challenge_answers || 'N/A'}"
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedClaim(claim);
                  setAction('APPROVE');
                  setReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shrink-0"
              >
                Evaluate & Decide
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Decision Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0A1224] border border-blue-500/40 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/30">
              <h3 className="text-sm font-bold text-white">
                Admin Evaluation: Claim #{selectedClaim.id}
              </h3>
              <button onClick={() => setSelectedClaim(null)} className="text-slate-400 hover:text-white">
                Cancel
              </button>
            </div>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Determination</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="APPROVE">Approve Claim & Authorize Handover</option>
                  <option value="REJECT">Reject False / Inaccurate Claim</option>
                  <option value="REQUEST_MORE_EVIDENCE">Request Additional Ownership Proof</option>
                  <option value="ESCALATE">Escalate for Higher Mediation</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Recorded Decision Reason *
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Serial number and purchase proof confirmed genuine"
                  className="w-full px-3 py-2 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Private Admin Notes (Internal Audit Log)
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Recorded notes stored in security audit trail..."
                  className="w-full px-3 py-2 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Submit Official Determination'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
