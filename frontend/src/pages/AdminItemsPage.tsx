import React, { useState, useEffect } from 'react';
import { Flag, Gavel, Heart, Building, Tag, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { Item } from '../types';

export const AdminItemsPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [action, setAction] = useState('UNCLAIMED_AUCTION');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminItems(flaggedOnly);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [flaggedOnly]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await api.takeAdminItemAction(selectedItem.id, { action, reason });
      setSelectedItem(null);
      fetchItems();
      alert('Item action recorded successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to record action');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Review Flagged Reports & Unclaimed Belongings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Route unclaimed items into auctions, donations, or authority custody according to platform rules.
        </p>
      </div>

      {/* Filter checkbox */}
      <div className="text-xs text-slate-300">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(e) => setFlaggedOnly(e.target.checked)}
            className="rounded bg-[#070D1A] border-blue-900 text-blue-600"
          />
          <span>Show Flagged Reports Only</span>
        </label>
      </div>

      {/* Items list */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-[#091224]/90 border border-blue-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{item.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-semibold">
                    {item.report_type} • {item.status}
                  </span>
                  {item.is_flagged && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Flagged
                    </span>
                  )}
                </div>
                <p className="text-slate-400">
                  Category: {item.category} • Location: {item.location_name} • Custody: {item.custody_status}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedItem(item);
                  setAction('UNCLAIMED_AUCTION');
                  setReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shrink-0"
              >
                Manage Resolution
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0A1224] border border-blue-500/40 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/30">
              <h3 className="text-sm font-bold text-white">
                Item Action: {selectedItem.title}
              </h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white">
                Cancel
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Administrative Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="UNCLAIMED_AUCTION">Approve for Back2U Points Auction</option>
                  <option value="UNCLAIMED_DONATION">Mark for Community Charity Donation</option>
                  <option value="UNCLAIMED_POLICE">Transfer to Campus Police / Municipal Authority</option>
                  <option value="RETURN_TO_FINDER">Award Permanent Custody to Finder</option>
                  <option value="FLAG">Flag Item for Policy Review</option>
                  <option value="UNFLAG">Clear Flagged Status</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason / Case Notes</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Unclaimed claim period expired; verified non-sensitive category"
                  className="w-full px-3 py-2 rounded-xl bg-[#070D1A] border border-blue-900/50 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all disabled:opacity-50"
              >
                {submitting ? 'Applying Action...' : 'Confirm Action'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
