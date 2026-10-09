import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, AlertTriangle, FileText, Users, 
  Activity, ArrowRight, Gavel, BarChart3 
} from 'lucide-react';
import { api } from '../services/api';
import { AdminOverviewMetrics } from '../types';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminOverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      setLoading(true);
      try {
        const res = await api.getAdminOverview();
        setMetrics(res.metrics);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmin();
  }, []);

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Platform Administration & Trust Operations</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mt-1">
          Back2U Administrator Control Panel
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Moderation console for evaluating disputed claims, mitigating fraud, routing unclaimed belongings, and reviewing audit trails.
        </p>
      </div>

      {/* Admin Subnav */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <Link
          to="/admin"
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white shadow-sm"
        >
          Overview
        </Link>
        <Link
          to="/admin/claims"
          className="px-3.5 py-1.5 rounded-xl bg-[#091224] border border-blue-900/40 text-slate-300 hover:text-white hover:border-blue-400 transition-all"
        >
          Disputed Claims ({metrics?.disputed_claims ?? 0})
        </Link>
        <Link
          to="/admin/items"
          className="px-3.5 py-1.5 rounded-xl bg-[#091224] border border-blue-900/40 text-slate-300 hover:text-white hover:border-blue-400 transition-all"
        >
          Flagged & Unclaimed Items
        </Link>
        <Link
          to="/admin/users"
          className="px-3.5 py-1.5 rounded-xl bg-[#091224] border border-blue-900/40 text-slate-300 hover:text-white hover:border-blue-400 transition-all"
        >
          Users & Penalties
        </Link>
        <Link
          to="/admin/audit-logs"
          className="px-3.5 py-1.5 rounded-xl bg-[#091224] border border-blue-900/40 text-slate-300 hover:text-white hover:border-blue-400 transition-all"
        >
          Security Audit Logs
        </Link>
      </div>

      {/* Real Platform Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Total Registered Items</span>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {metrics?.total_items ?? '...'}
          </div>
          <span className="text-[10px] text-blue-400">
            {metrics?.active_lost ?? 0} Lost • {metrics?.active_found ?? 0} Found
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#091224]/90 border border-emerald-500/30 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Recovery Success Rate</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {metrics ? `${metrics.recovery_rate_percent}%` : '...'}
          </div>
          <span className="text-[10px] text-slate-400">
            {metrics?.total_returned ?? 0} items safely returned
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#091224]/90 border border-amber-500/30 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Disputed Ownership Cases</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            {metrics?.disputed_claims ?? '...'}
          </div>
          <span className="text-[10px] text-slate-400">Multiple claimant alerts</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#091224]/90 border border-indigo-500/30 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Network Trust Index</span>
          <div className="text-2xl sm:text-3xl font-black text-indigo-300">
            {metrics?.avg_trust_score ?? '...'}
          </div>
          <span className="text-[10px] text-slate-400">
            {metrics?.restricted_users ?? 0} accounts restricted
          </span>
        </div>

      </div>

      {/* Admin Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        <Link
          to="/admin/claims"
          className="p-6 rounded-2xl bg-[#091224]/90 border border-blue-900/35 hover:border-blue-400/50 transition-all flex items-start gap-4 group"
        >
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
              Review Disputed & High-Risk Claims
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Examine cases where multiple claimants contest the same found item, or where the claimant provides insufficient proof.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 shrink-0" />
        </Link>

        <Link
          to="/admin/items"
          className="p-6 rounded-2xl bg-[#091224]/90 border border-blue-900/35 hover:border-blue-400/50 transition-all flex items-start gap-4 group"
        >
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
            <Gavel className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              Unclaimed Item Resolution Workflow
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Approve eligible items for auction or direct them for donation, authority transfer, or return to the finder.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 shrink-0" />
        </Link>

      </div>

    </div>
  );
};
