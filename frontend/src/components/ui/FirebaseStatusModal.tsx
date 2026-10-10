import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, ShieldCheck, Zap, X, Copy, Check } from 'lucide-react';
import { firebaseDbService, isFirebaseConfigured } from '../../services/firebase';
import { api } from '../../services/api';

interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseStatusModal: React.FC<FirebaseStatusModalProps> = ({ isOpen, onClose }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    projectId?: string;
  } | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Backend status
  const [backendStatus, setBackendStatus] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      // Check backend status
      fetch('/api/firebase/status')
        .then(res => res.json())
        .then(data => setBackendStatus(data))
        .catch(() => setBackendStatus(null));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await firebaseDbService.testConnection();
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/firebase/sync-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('back2u_token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(`Successfully synced ${data.synced_count} items to Firestore!`);
      } else {
        setSyncResult(data.detail || 'Failed to sync items.');
      }
    } catch (err: any) {
      setSyncResult(err.message || 'Failed to connect to backend sync service.');
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div 
        className="relative w-full max-w-2xl bg-[#0B132B] border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-blue-900/40 bg-gradient-to-r from-blue-950/60 to-[#0B132B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/30 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Firebase Database Connection
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  isFirebaseConfigured
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isFirebaseConfigured ? 'CONNECTED' : 'STANDBY / LOCAL'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Google Cloud Firestore & Realtime Database sync status
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Overview Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-900/30">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Frontend Firestore Client
              </div>
              <div className="flex items-center gap-2 mt-2">
                {isFirebaseConfigured ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-sm font-medium text-emerald-300">
                      Active: {firebaseDbService.projectId || 'Configured'}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-sm text-slate-300">
                      Using Local Mode (No .env keys)
                    </span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Provides real-time subscriptions, live chat, and instant push updates.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-900/30">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Backend Admin SDK
              </div>
              <div className="flex items-center gap-2 mt-2">
                {backendStatus?.firestore_database_ready ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-sm font-medium text-emerald-300">
                      Cloud Firestore Online
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-sm text-slate-300">
                      {backendStatus?.credentials_file_found ? 'Ready' : 'Local Fallback Active'}
                    </span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Handles cloud mirroring for items, claims, and verified audit records.
              </p>
            </div>
          </div>

          {/* Realtime Capabilities */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20">
            <h3 className="text-sm font-semibold text-blue-200 flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              Connected Firebase Database Capabilities
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Collection: <code>items</code> (Live Item Feeds)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Collection: <code>claims</code> (Realtime Verification)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Subcollection: <code>messages</code> (Finder-Claimant Chat)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Subcollection: <code>notifications</code> (Live Alerts)</span>
              </div>
            </div>
          </div>

          {/* Test & Sync Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all disabled:opacity-50"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Testing Firestore Ping...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Test Firestore Connection
                </>
              )}
            </button>

            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-all border border-blue-900/40 disabled:opacity-50"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Syncing Catalog...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sync Database to Firestore
                </>
              )}
            </button>
          </div>

          {/* Connection Test Output */}
          {testResult && (
            <div className={`p-4 rounded-xl border text-sm ${
              testResult.success
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            }`}>
              <div className="flex items-center gap-2 font-semibold mb-1">
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
                {testResult.success ? 'Connection Succeeded' : 'Configuration Notice'}
              </div>
              <p className="text-xs text-slate-300">{testResult.message}</p>
              {testResult.latencyMs !== undefined && (
                <div className="text-[11px] text-slate-400 mt-1">
                  Round-trip latency: <span className="font-mono text-emerald-300">{testResult.latencyMs} ms</span>
                </div>
              )}
            </div>
          )}

          {/* Sync Result */}
          {syncResult && (
            <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200">
              {syncResult}
            </div>
          )}

          {/* Setup Instructions Helper */}
          <div className="pt-2 border-t border-blue-900/30">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              How to Connect Your Firebase Project
            </h4>
            <div className="text-xs text-slate-400 space-y-2">
              <p>
                1. Visit the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">Firebase Console <ExternalLink className="w-3 h-3" /></a> and select or create your project.
              </p>
              <p>
                2. In <strong>Firestore Database</strong>, click <em>Create Database</em> (Start in test mode or with security rules).
              </p>
              <p>
                3. Copy your Web App configuration keys into <code className="text-blue-300 bg-slate-900 px-1 py-0.5 rounded">frontend/.env</code>:
              </p>
              <div className="p-3 bg-slate-950 rounded-lg font-mono text-[11px] text-slate-300 border border-slate-800 relative group">
                <button
                  onClick={() => copyToClipboard(`VITE_FIREBASE_API_KEY=your_api_key\nVITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com\nVITE_FIREBASE_PROJECT_ID=your_project_id\nVITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com\nVITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id\nVITE_FIREBASE_APP_ID=your_app_id`, 'frontend_env')}
                  className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Copy template"
                >
                  {copiedKey === 'frontend_env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <div className="text-slate-500"># frontend/.env</div>
                <div>VITE_FIREBASE_API_KEY=AIzaSy...</div>
                <div>VITE_FIREBASE_PROJECT_ID=back2u-project</div>
                <div>VITE_FIREBASE_AUTH_DOMAIN=back2u-project.firebaseapp.com</div>
              </div>
              <p className="mt-2">
                4. (Optional Backend Admin Sync) Under <strong>Project Settings &gt; Service Accounts</strong>, click <em>Generate new private key</em> and save it as <code className="text-blue-300 bg-slate-900 px-1 py-0.5 rounded">backend/serviceAccountKey.json</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-blue-900/40 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>End-to-end encrypted claim and item storage</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
