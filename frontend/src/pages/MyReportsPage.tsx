import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, MapPin, Clock, Tag, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Item } from '../types';

export const MyReportsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const data = await api.getMyReports();
      setReports(data);
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
    fetchMyReports();
  }, [isAuthenticated]);

  const handleCloseReport = async (itemId: number) => {
    if (!window.confirm('Are you sure you want to close this report?')) return;
    try {
      await api.deleteItem(itemId);
      fetchMyReports();
    } catch (err: any) {
      alert(err.message || 'Failed to close report');
    }
  };

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">My Submitted Reports</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track active reports, inspect AI potential matches, and manage resolution states.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/report/lost"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.4)] transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Report Lost
          </Link>
          <Link
            to="/report/found"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/40 transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Report Found
          </Link>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="py-20 text-center p-8 rounded-2xl bg-[#091224]/50 border border-blue-900/30">
          <Tag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No reports submitted yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            If you have lost or found an everyday belonging, submit a report to initiate AI-powered matching.
          </p>
          <Link
            to="/report/lost"
            className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500"
          >
            Create Your First Report
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((item) => {
            const isLost = item.report_type === 'LOST';
            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#091224]/90 border border-blue-900/35 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-[#070D1B] border border-blue-900/40 overflow-hidden shrink-0 flex items-center justify-center p-1">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Tag className="w-6 h-6 text-slate-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isLost
                            ? 'bg-red-500/15 text-red-300 border-red-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {item.report_type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-blue-300 font-semibold px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-800/40">
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <MapPin className="w-3 h-3 text-blue-400" />
                      <span className="truncate">{item.location_name}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-blue-950/70 text-xs">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/items/${item.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-300 bg-blue-600/20 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1 border border-blue-500/30"
                    >
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      View AI Matches
                    </Link>

                    {item.status !== 'CLOSED' && (
                      <button
                        onClick={() => handleCloseReport(item.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        title="Close report"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
