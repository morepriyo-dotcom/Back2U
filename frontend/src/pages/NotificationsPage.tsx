import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Sparkles, ShieldCheck, Award, Info } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'AI_MATCH':
        return <Sparkles className="w-4 h-4 text-blue-400" />;
      case 'CLAIM_UPDATE':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'REWARD':
        return <Award className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Bell className="w-7 h-7 text-blue-400" />
            Notifications
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time updates regarding AI potential matches, evidence challenges, and reward credits.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-300 hover:text-white bg-blue-950/40 border border-blue-500/30 transition-all"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="py-20 text-center p-8 rounded-2xl bg-[#091224]/50 border border-blue-900/30 text-slate-400 text-xs">
          No notifications yet. You will be alerted when new AI matches or claims are detected.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 text-xs ${
                n.is_read
                  ? 'bg-[#091224]/60 border-blue-950/60 opacity-75'
                  : 'bg-[#0C172E] border-blue-500/35 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
              }`}
            >
              <div className="p-2 rounded-lg bg-[#070D1A] border border-blue-900/40 shrink-0">
                {getIcon(n.notification_type)}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white">{n.title}</h4>
                  <span className="text-[10px] text-slate-500">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                {n.link_url && (
                  <Link
                    to={n.link_url}
                    className="inline-block mt-2 text-[11px] font-semibold text-blue-400 hover:text-blue-300"
                  >
                    View Details →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
