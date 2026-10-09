import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, Search, ShieldCheck, Trophy, Sparkles, 
  Clock, MapPin, Tag, ChevronRight, FileText, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Item, Claim, RewardsSummary } from '../types';

export const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [myReports, setMyReports] = useState<Item[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [rewardsSummary, setRewardsSummary] = useState<RewardsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [reports, claimsRes, rewards] = await Promise.all([
          api.getMyReports(),
          api.getMyClaims(),
          api.getRewardsSummary(),
        ]);
        setMyReports(reports || []);
        setMyClaims([
          ...(claimsRes.submitted_claims || []),
          ...(claimsRes.received_claims || []),
        ]);
        setRewardsSummary(rewards);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated]);

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Header */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-[#0E1A36]/90 via-[#0B152B]/90 to-[#121A30]/90 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
            alt={user?.full_name}
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-400/40 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Welcome back, {user?.full_name}!
              </h1>
              {isAdmin && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Administrator
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {user?.email} • Member of Back2U Recovery Network
            </p>
          </div>
        </div>

        {/* User metrics pill */}
        <div className="flex items-center gap-4 text-xs">
          <div className="p-3 rounded-xl bg-[#070D1B] border border-blue-900/50 text-center min-w-[90px]">
            <span className="text-[10px] text-slate-400 block">Trust Score</span>
            <strong className="text-emerald-400 font-bold text-base">
              {rewardsSummary?.trust_score ?? user?.trust_score}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-[#070D1B] border border-blue-900/50 text-center min-w-[90px]">
            <span className="text-[10px] text-slate-400 block">Points</span>
            <strong className="text-yellow-400 font-bold text-base">
              {rewardsSummary?.points_balance ?? user?.points_balance}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-[#070D1B] border border-blue-900/50 text-center min-w-[90px]">
            <span className="text-[10px] text-slate-400 block">Reports</span>
            <strong className="text-blue-400 font-bold text-base">
              {myReports.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          to="/report/lost"
          className="p-4 rounded-xl bg-[#091224]/90 border border-blue-900/35 hover:border-red-500/40 hover:bg-[#101428] transition-all group flex items-center gap-3 text-xs"
        >
          <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-white block group-hover:text-red-300">Report Lost</strong>
            <span className="text-[10px] text-slate-400">Scan for items</span>
          </div>
        </Link>

        <Link
          to="/report/found"
          className="p-4 rounded-xl bg-[#091224]/90 border border-blue-900/35 hover:border-emerald-500/40 hover:bg-[#0c182a] transition-all group flex items-center gap-3 text-xs"
        >
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-white block group-hover:text-emerald-300">Report Found</strong>
            <span className="text-[10px] text-slate-400">+50 Points</span>
          </div>
        </Link>

        <Link
          to="/search"
          className="p-4 rounded-xl bg-[#091224]/90 border border-blue-900/35 hover:border-blue-500/40 hover:bg-[#0c162d] transition-all group flex items-center gap-3 text-xs"
        >
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-white block group-hover:text-blue-300">Search Items</strong>
            <span className="text-[10px] text-slate-400">Catalog filter</span>
          </div>
        </Link>

        <Link
          to="/claims"
          className="p-4 rounded-xl bg-[#091224]/90 border border-blue-900/35 hover:border-purple-500/40 hover:bg-[#14122d] transition-all group flex items-center gap-3 text-xs"
        >
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <strong className="text-white block group-hover:text-purple-300">Claims ({myClaims.length})</strong>
            <span className="text-[10px] text-slate-400">Review proof</span>
          </div>
        </Link>
      </div>

      {/* Main Content: Reports & Claims summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Active Reports Box */}
        <div className="p-6 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              My Submitted Reports ({myReports.length})
            </h3>
            <Link to="/my-reports" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
              View All →
            </Link>
          </div>

          {myReports.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No reports active. Report something you lost or found.
            </p>
          ) : (
            <div className="space-y-2.5">
              {myReports.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  to={`/items/${item.id}`}
                  className="p-3 rounded-xl bg-[#070D1A] border border-blue-950/70 hover:border-blue-500/30 transition-all flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        item.report_type === 'LOST'
                          ? 'bg-red-500/15 text-red-300'
                          : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {item.report_type}
                    </span>
                    <span className="font-semibold text-white group-hover:text-blue-300 truncate">
                      {item.title}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Ownership Claims Box */}
        <div className="p-6 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Ownership Claims & Cases ({myClaims.length})
            </h3>
            <Link to="/claims" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
              View All →
            </Link>
          </div>

          {myClaims.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No claims submitted or received yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {myClaims.slice(0, 3).map((claim) => (
                <Link
                  key={claim.id}
                  to={`/recovery/${claim.id}`}
                  className="p-3 rounded-xl bg-[#070D1A] border border-blue-950/70 hover:border-emerald-500/30 transition-all flex items-center justify-between text-xs group"
                >
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white group-hover:text-emerald-300 truncate">
                        {claim.item_title || `Claim #${claim.id}`}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300">
                        {claim.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {claim.is_disputed ? '⚠️ Disputed Case' : 'Active Verification'}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
