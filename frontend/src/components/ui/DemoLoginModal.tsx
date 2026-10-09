import React from 'react';
import { X, Sparkles, Shield, User, Award, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DemoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoLoginModal: React.FC<DemoLoginModalProps> = ({ isOpen, onClose }) => {
  const { demoLogin, isLoading } = useAuth();

  if (!isOpen) return null;

  const handleSelectRole = async (role: string) => {
    try {
      await demoLogin(role);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const personas = [
    {
      role: 'finder',
      name: 'Rohan (Finder)',
      email: 'rohan@back2u.org',
      badge: 'Active Finder • 350 pts',
      description: 'Found items in library & main building. Can review incoming ownership claims.',
      icon: User,
      color: 'border-blue-500/40 bg-blue-950/20 text-blue-400',
    },
    {
      role: 'owner',
      name: 'Priya (Owner)',
      email: 'priya@back2u.org',
      badge: 'Item Owner • 180 pts',
      description: 'Reported lost AirPods and water bottle. Receives 94% AI potential matches.',
      icon: Award,
      color: 'border-purple-500/40 bg-purple-950/20 text-purple-400',
    },
    {
      role: 'claimant',
      name: 'Vikram (Claimant)',
      email: 'vikram@back2u.org',
      badge: 'Under Review • 90 pts',
      description: 'Submitted claim on black leather wallet and disputed laptop claim with penalty history.',
      icon: AlertTriangle,
      color: 'border-amber-500/40 bg-amber-950/20 text-amber-400',
    },
    {
      role: 'admin',
      name: 'Alex (Administrator)',
      email: 'admin@back2u.org',
      badge: 'Platform Admin • High Trust',
      description: 'Full access to dispute resolution, anti-fraud moderation, unclaimed auctions & audit logs.',
      icon: Shield,
      color: 'border-indigo-500/40 bg-indigo-950/20 text-indigo-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#091224] border border-blue-500/30 shadow-2xl p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-blue-900/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Select Demo Persona</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-3 mb-5 leading-relaxed">
          Switch roles instantly to test any role-based flow without manual signups or passwords.
        </p>

        {/* Persona Cards */}
        <div className="space-y-3">
          {personas.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.role}
                disabled={isLoading}
                onClick={() => handleSelectRole(p.role)}
                className="w-full flex items-start gap-3.5 p-3.5 rounded-xl bg-[#0C172E] border border-blue-900/40 hover:border-blue-400/50 hover:bg-[#101F3D] transition-all text-left group"
              >
                <div className={`p-2.5 rounded-lg border ${p.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {p.name}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-snug">
                    {p.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
