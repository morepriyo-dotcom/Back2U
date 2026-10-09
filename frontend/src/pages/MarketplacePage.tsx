import React, { useState, useEffect } from 'react';
import { 
  Gavel, DollarSign, Clock, AlertTriangle, ShieldCheck, 
  ArrowRight, Tag, CheckCircle2 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AuctionListing, RequestToBuy } from '../types';

export const MarketplacePage: React.FC = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [auctions, setAuctions] = useState<AuctionListing[]>([]);
  const [myBuyRequests, setMyBuyRequests] = useState<RequestToBuy[]>([]);
  const [loading, setLoading] = useState(true);

  // Bidding modal
  const [activeAuction, setActiveAuction] = useState<AuctionListing | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [bidding, setBidding] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [auctionList, requests] = await Promise.all([
        api.getUnclaimedListings(),
        isAuthenticated ? api.getMyBuyRequests() : Promise.resolve([]),
      ]);
      setAuctions(auctionList || []);
      setMyBuyRequests(requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAuction) return;
    setBidding(true);
    try {
      await api.placeBid(activeAuction.id, bidAmount);
      await fetchData();
      await refreshUser();
      setActiveAuction(null);
      alert('Bid placed successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to place bid');
    } finally {
      setBidding(false);
    }
  };

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
          <Gavel className="w-4 h-4" />
          <span>Unclaimed Items & Buy Requests</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mt-1">
          Back2U Community Marketplace
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Legitimate recovery outcomes for unclaimed belongings. Participate in platform-approved auctions using your Back2U Points or view your submitted purchase requests.
        </p>
      </div>

      {/* Policy Banner (From Slide 08 & 09) */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3.5 text-xs text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 block mb-0.5">Responsible Unclaimed Item Resolution Policy</strong>
          Items entering this marketplace have exceeded the required claim window without an owner match. High-value, sensitive, personal, or disputed belongings are strictly transferred to campus or municipal authorities and are excluded from open auctions.
        </div>
      </div>

      {/* Active Auctions Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Gavel className="w-4 h-4 text-blue-400" />
          Approved Unclaimed Item Auctions
        </h2>

        {auctions.length === 0 ? (
          <div className="py-12 text-center p-8 rounded-2xl bg-[#091224]/50 border border-blue-900/30">
            <Tag className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No active auctions at this time</h3>
            <p className="text-xs text-slate-400 mt-1">
              Eligible unclaimed items will appear here once approved by platform moderation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {auctions.map((auction) => (
              <div
                key={auction.id}
                className="rounded-2xl bg-[#091224]/90 border border-blue-900/35 overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-video bg-[#070D1B] flex items-center justify-center p-4">
                  {auction.item_image_url ? (
                    <img
                      src={auction.item_image_url}
                      alt={auction.item_title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Tag className="w-8 h-8 text-slate-600" />
                  )}
                  <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-md">
                    {auction.item_category}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{auction.item_title}</h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span>Closes {new Date(auction.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070D1A] border border-blue-950/70 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Current Bid</span>
                      <strong className="text-yellow-400 font-bold">{auction.current_bid_points} PTS</strong>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Starts: {auction.starting_points} PTS
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveAuction(auction);
                      setBidAmount(auction.current_bid_points + 10);
                    }}
                    className="w-full py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.35)] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    Place Bid
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Submitted Requests to Buy */}
      {isAuthenticated && (
        <div className="pt-6 border-t border-blue-900/30 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            My Submitted Purchase Requests
          </h2>

          {myBuyRequests.length === 0 ? (
            <p className="text-xs text-slate-400">
              You have not submitted any purchase requests. If you find an unclaimed item you wish to legitimately acquire, use "Request to Buy" on the item page.
            </p>
          ) : (
            <div className="space-y-3">
              {myBuyRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-[#091224]/80 border border-blue-900/30 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{req.item_title || `Item #${req.item_id}`}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'ACCEPTED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : req.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="text-slate-400">{req.message}</p>
                  </div>

                  <strong className="text-emerald-400 font-bold shrink-0">
                    {req.offer_amount} {req.currency_type}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bidding Modal */}
      {activeAuction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#0A1224] border border-blue-500/40 shadow-2xl p-6 space-y-4 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/30">
              <h3 className="text-sm font-bold text-white">Bid with Points</h3>
              <button onClick={() => setActiveAuction(null)} className="text-slate-400 hover:text-white">
                Cancel
              </button>
            </div>

            <p className="text-slate-300">
              Item: <strong className="text-white">{activeAuction.item_title}</strong>
            </p>

            <div className="p-3 rounded-xl bg-[#070D1A] border border-blue-900/40 flex justify-between">
              <span className="text-slate-400">Your Points Balance:</span>
              <strong className="text-yellow-400">{user?.points_balance || 0} PTS</strong>
            </div>

            <form onSubmit={handlePlaceBid} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Your Bid (Must exceed {activeAuction.current_bid_points} PTS)
                </label>
                <input
                  type="number"
                  required
                  min={activeAuction.current_bid_points + 1}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <button
                type="submit"
                disabled={bidding}
                className="w-full py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50"
              >
                {bidding ? 'Submitting Bid...' : 'Confirm Bid'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
