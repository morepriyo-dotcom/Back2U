import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, Clock, Tag, ShieldCheck, AlertCircle, Sparkles, 
  DollarSign, ChevronLeft, Lock, CheckCircle2, User, Eye, EyeOff
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Item, AIMatchCandidate } from '../types';
import { formatImageUrl } from '../utils/image';

export const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiMatches, setAiMatches] = useState<AIMatchCandidate[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Claim Modal State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [challengeAnswer, setChallengeAnswer] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [supportingNotes, setSupportingNotes] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Request to Buy Modal State
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState(50);
  const [currencyType, setCurrencyType] = useState('POINTS');
  const [buyMessage, setBuyMessage] = useState('');
  const [submittingBuy, setSubmittingBuy] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await api.getItemDetail(Number(id));
        setItem(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const loadAiMatches = async () => {
    if (!item) return;
    setLoadingMatches(true);
    try {
      const res = await api.getAIMatches(item.id);
      setAiMatches(res.matches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setSubmittingClaim(true);
    try {
      await api.submitClaim({
        item_id: item.id,
        challenge_answers: challengeAnswer,
        serial_number_provided: serialNumber,
        purchase_receipt_url: receiptUrl,
        supporting_notes: supportingNotes,
      });
      setClaimSuccess(true);
      setTimeout(() => {
        setShowClaimModal(false);
        navigate('/claims');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit claim');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setSubmittingBuy(true);
    try {
      await api.createRequestToBuy({
        item_id: item.id,
        offer_amount: Number(offerAmount),
        currency_type: currencyType,
        message: buyMessage,
      });
      setBuySuccess(true);
      setTimeout(() => {
        setShowBuyModal(false);
        navigate('/marketplace');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit purchase request');
    } finally {
      setSubmittingBuy(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex justify-center items-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p>Item not found or has been removed.</p>
        <Link to="/search" className="text-blue-400 text-sm mt-3 inline-block">
          Return to search
        </Link>
      </div>
    );
  }

  const isReporter = user?.id === item.reporter_id;
  const isFound = item.report_type === 'FOUND';

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to results
      </button>

      {/* Main Grid: Left Image, Right Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Image Card (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0B1426] border border-blue-900/35 overflow-hidden p-6 flex flex-col items-center justify-center min-h-[380px]">
          {item.image_url ? (
            <img
              src={formatImageUrl(item.image_url)}
              alt={item.title}
              className="max-h-80 w-auto object-contain filter drop-shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-950/40 border border-blue-800/30 flex items-center justify-center text-blue-400">
              <Tag className="w-10 h-10" />
            </div>
          )}

          <div className="mt-6 w-full flex items-center justify-between text-xs text-slate-400 border-t border-blue-950/60 pt-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Reported on {new Date(item.incident_date).toLocaleDateString()}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 font-semibold text-[10px] uppercase">
              {item.custody_status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Right: Details & Recovery Actions (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  item.report_type === 'LOST'
                    ? 'bg-red-500/15 text-red-300 border-red-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {item.report_type} Item
              </span>
              <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/50">
                {item.category}
              </span>
              <span className="text-[10px] font-semibold text-blue-300 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30">
                Status: {item.status.replace('_', ' ')}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {item.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Location: {item.location_name}</span>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-xl bg-[#091224]/70 border border-blue-900/30 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Description</h4>
            <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
            {item.brand && (
              <p className="text-xs text-slate-400 pt-1">
                Brand: <strong className="text-white">{item.brand}</strong> {item.model ? `• Model: ${item.model}` : ''}
              </p>
            )}
          </div>

          {/* Privacy Notice on Distinguishing Clues */}
          <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/20 flex items-start gap-3 text-xs text-slate-300">
            <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-blue-300 block mb-0.5">Ownership Challenge Protected</span>
              Private identifying marks (such as stickers, hidden initials, or contents) are kept hidden to prevent false ownership claims. Claimants must provide verified answers.
            </div>
          </div>

          {/* Reporter private clues view (ONLY visible to reporter or admin) */}
          {item.private_clues && (
            <div className="p-4 rounded-xl bg-[#0e1832] border border-blue-500/40 space-y-1 text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Your Private Distinguishing Clues (Confidential to You)
              </span>
              <p className="text-slate-300">{item.private_clues}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap gap-3">
            
            {/* If item is FOUND and user is NOT reporter -> Claim Ownership */}
            {isFound && !isReporter && (
              <button
                onClick={() => {
                  if (!isAuthenticated) navigate('/login');
                  else setShowClaimModal(true);
                }}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Claim This Item (Verify Ownership)
              </button>
            )}

            {/* Request to Buy Button (legitimate alternative when not yours) */}
            {isFound && !isReporter && (
              <button
                onClick={() => {
                  if (!isAuthenticated) navigate('/login');
                  else setShowBuyModal(true);
                }}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-300 bg-[#0E1A33] border border-blue-500/30 hover:border-blue-400 hover:text-white transition-all flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Request to Buy
              </button>
            )}

            {/* AI Matches Scan Trigger */}
            <button
              onClick={loadAiMatches}
              disabled={loadingMatches}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-blue-300 bg-blue-950/40 border border-blue-500/30 hover:bg-blue-900/30 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              {loadingMatches ? 'Running AI Matching...' : 'Run AI Match Scan'}
            </button>

          </div>

          {/* Reporter Info */}
          <div className="pt-4 border-t border-blue-950/70 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <span>Reported by: <strong className="text-white">{item.reporter_name || 'Community Member'}</strong></span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
              Trust Score: {item.reporter_trust_score || 100}
            </span>
          </div>

        </div>

      </div>

      {/* =========================================================================
          AI MATCHES RESULTS DRAWER / SECTION
         ========================================================================= */}
      {aiMatches.length > 0 && (
        <section className="pt-8 border-t border-blue-900/30 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">AI Potential Matches</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
              {aiMatches.length} candidates found
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Results ranked multi-modally by image similarity (40%), text similarity (35%), location proximity (15%), and date proximity (10%).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {aiMatches.map((match) => (
              <div
                key={match.candidate_item_id}
                className="p-4 rounded-xl bg-[#091326] border border-blue-500/30 hover:border-blue-400 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                      {match.match_score}% Potential Match
                    </span>
                    <span className="text-[10px] text-slate-400">{match.category}</span>
                  </div>

                  <h4 className="text-sm font-semibold text-white line-clamp-1">{match.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-400" />
                    {match.location_name}
                  </p>
                </div>

                {/* Score breakdown metrics */}
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-[#070D1A] p-2 rounded-lg border border-blue-900/40">
                  <span>Text: {match.match_signals.text_similarity_percent}%</span>
                  <span>Location: {match.match_signals.location_proximity_percent}%</span>
                  <span>Date: {match.match_signals.date_proximity_percent}%</span>
                  <span>Category: {match.match_signals.same_category ? 'Match' : 'Diff'}</span>
                </div>

                <Link
                  to={`/items/${match.candidate_item_id}`}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold text-center text-blue-300 bg-blue-600/20 hover:bg-blue-600 hover:text-white transition-all border border-blue-500/30"
                >
                  View Candidate Item & Claim
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          OWNERSHIP CLAIM MODAL (Verification & Evidence)
         ========================================================================= */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0A1224] border border-blue-500/40 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/30">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Submit Ownership Verification Claim</h3>
              </div>
              <button
                onClick={() => setShowClaimModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            {claimSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Claim Submitted Successfully!</h4>
                <p className="text-xs text-slate-400">
                  Your evidence has been sent for verification. Redirecting to your claims tracking...
                </p>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Identifying Distinguishing Details *
                  </label>
                  <p className="text-[11px] text-slate-400 mb-1.5">
                    Describe unique marks, engravings, contents, stickers, or hidden features that prove this item is yours.
                  </p>
                  <textarea
                    required
                    rows={3}
                    value={challengeAnswer}
                    onChange={(e) => setChallengeAnswer(e.target.value)}
                    placeholder="e.g. There is a sticker of a red rocket on the rear lid, and serial number ending in W79..."
                    className="w-full p-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Serial Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="e.g. AP-9482-X"
                      className="w-full p-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Purchase Receipt / Proof URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={receiptUrl}
                      onChange={(e) => setReceiptUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Supporting Possession Notes
                  </label>
                  <textarea
                    rows={2}
                    value={supportingNotes}
                    onChange={(e) => setSupportingNotes(e.target.value)}
                    placeholder="When and where you purchased or last held the item..."
                    className="w-full p-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Submitting false claims incurs platform Penalty Points (-10 to -25) and potential account restrictions.</span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClaimModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingClaim}
                    className="px-5 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50"
                  >
                    {submittingClaim ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* =========================================================================
          REQUEST TO BUY MODAL (Separating purchase requests from false claims)
         ========================================================================= */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0A1224] border border-blue-500/40 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/30">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Submit Request to Buy</h3>
              </div>
              <button
                onClick={() => setShowBuyModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            {buySuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Purchase Request Sent!</h4>
                <p className="text-xs text-slate-400">
                  The finder has received your offer. You can view progress in the Marketplace.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBuySubmit} className="space-y-4 text-xs">
                <p className="text-[11px] text-slate-400">
                  If nobody claims this item, you can legitimately offer Back2U Points or funds instead of falsely claiming ownership.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Offer Amount
                    </label>
                    <input
                      type="number"
                      min={10}
                      required
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Currency
                    </label>
                    <select
                      value={currencyType}
                      onChange={(e) => setCurrencyType(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white focus:outline-none focus:border-blue-400"
                    >
                      <option value="POINTS">Back2U Points</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Message to Finder / Custodian
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={buyMessage}
                    onChange={(e) => setBuyMessage(e.target.value)}
                    placeholder="Explain your interest in purchasing this item if it remains unclaimed..."
                    className="w-full p-2.5 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBuyModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBuy}
                    className="px-5 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50"
                  >
                    {submittingBuy ? 'Submitting...' : 'Send Request'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
