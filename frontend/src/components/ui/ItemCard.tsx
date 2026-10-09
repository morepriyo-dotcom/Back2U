import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Tag } from 'lucide-react';
import { Item } from '../../types';
import { formatImageUrl } from '../../utils/image';

interface ItemCardProps {
  item: Item;
  showStatusBadge?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, showStatusBadge = true }) => {
  // Format relative time
  const getTimeAgo = (dateStr: string) => {
    try {
      const diffSec = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
      if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))} mins ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
      return `${Math.floor(diffSec / 86400)} days ago`;
    } catch {
      return 'Recently';
    }
  };

  const isLost = item.report_type === 'LOST';

  return (
    <Link
      to={`/items/${item.id}`}
      className="group relative flex flex-col rounded-2xl bg-[#0B1426]/90 border border-blue-900/30 hover:border-blue-400/50 hover:shadow-[0_10px_30px_-10px_rgba(37,99,235,0.25)] transition-all duration-300 overflow-hidden"
    >
      {/* Top Image Container */}
      <div className="relative aspect-square w-full bg-[#070D1B] flex items-center justify-center overflow-hidden p-4">
        {item.image_url ? (
          <img
            src={formatImageUrl(item.image_url)}
            alt={item.title}
            className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-950/40 border border-blue-800/30 flex items-center justify-center text-blue-400">
            <Tag className="w-7 h-7" />
          </div>
        )}

        {/* Report Type Pill */}
        {showStatusBadge && (
          <span
            className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full backdrop-blur-md border ${
              isLost
                ? 'bg-red-500/15 text-red-300 border-red-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {item.report_type}
          </span>
        )}

        {/* Demo Tag */}
        {item.is_demo_seed && (
          <span className="absolute top-3 right-3 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50 backdrop-blur-sm">
            Demo
          </span>
        )}
      </div>

      {/* Details Box */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
            {item.title}
          </h4>
          <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
            {item.category}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-blue-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 truncate mr-2">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{item.location_name}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{getTimeAgo(item.incident_date)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
