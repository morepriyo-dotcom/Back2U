import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, FileText, User } from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await api.getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Security Audit Logs</h1>
        <p className="text-xs text-slate-400 mt-1">
          Chronological immutable trail of all privileged decisions, penalties, and status escalations.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          No audit logs recorded yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-xl bg-[#091224]/80 border border-blue-900/35 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40">
                    {log.action}
                  </span>
                  <span className="text-slate-400">
                    Target: <strong className="text-white">{log.resource_type} #{log.resource_id}</strong>
                  </span>
                </div>
                <p className="text-slate-300">{log.details}</p>
              </div>

              <div className="text-right text-[11px] text-slate-500 shrink-0">
                <span className="block text-slate-400">Actor: {log.actor_email || 'System'}</span>
                <span>{new Date(log.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
