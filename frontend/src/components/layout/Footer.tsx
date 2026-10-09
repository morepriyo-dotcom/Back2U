import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#050811] border-t border-blue-900/20 pt-16 pb-12 mt-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 pb-12 border-b border-blue-900/20">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-black tracking-tight text-white">Back</span>
                <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">
                  2U
                </span>
              </div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-blue-400/90 -mt-1">
                Lost Today. Found Tomorrow.
              </span>
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              A smarter, kinder way to reunite lost items and bring people together through AI-driven matching and trusted community incentives.
            </p>
            {/* Social Icons matching back2u.jpeg */}
            <div className="flex items-center gap-4 text-slate-400 pt-2">
              {/* Twitter / X */}
              <a href="#twitter" aria-label="Twitter" className="hover:text-blue-400 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* Instagram */}
              <a href="#instagram" aria-label="Instagram" className="hover:text-pink-400 transition-colors">
                <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#linkedin" aria-label="LinkedIn" className="hover:text-blue-500 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.53 1.53 0 1 0 0-3.06 1.53 1.53 0 0 0 0 3.06m1.39 9.74v-8.37H5.07v8.37h2.78z" />
                </svg>
              </a>
              {/* YouTube */}
              <a href="#youtube" aria-label="YouTube" className="hover:text-red-500 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 1: About Back2U */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">About Back2U</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link to="/#mission" className="hover:text-white transition-colors">Our Mission</Link></li>
              <li><Link to="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/rewards" className="hover:text-white transition-colors">Community</Link></li>
              <li><Link to="/#careers" className="hover:text-white transition-colors">Careers</Link></li>
            </ul>
          </div>

          {/* Column 2: Report Lost */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Report Lost</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link to="/report/lost" className="hover:text-white transition-colors">Report an Item</Link></li>
              <li><Link to="/search" className="hover:text-white transition-colors">Search Lost Items</Link></li>
              <li><Link to="/#guidelines" className="hover:text-white transition-colors">Tips & Guidelines</Link></li>
            </ul>
          </div>

          {/* Column 3: Report Found */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Report Found</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link to="/report/found" className="hover:text-white transition-colors">Report a Found Item</Link></li>
              <li><Link to="/marketplace" className="hover:text-white transition-colors">What to Do Next</Link></li>
              <li><Link to="/#safety" className="hover:text-white transition-colors">Safety Tips</Link></li>
            </ul>
          </div>

          {/* Column 4: Ownership Verification & Help */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Ownership Verification</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link to="/#verification" className="hover:text-white transition-colors">How Verification Works</Link></li>
              <li><Link to="/#evidence" className="hover:text-white transition-colors">Required Information</Link></li>
              <li><Link to="/#privacy" className="hover:text-white transition-colors">Privacy & Security</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar with Shield Badge */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>© 2026 Back2U. Lost Today. Found Tomorrow.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/#privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link to="/#terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link to="/#support" className="hover:text-slate-300 transition-colors">Support Center</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
