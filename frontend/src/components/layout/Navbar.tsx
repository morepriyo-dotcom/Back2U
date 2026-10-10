import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, ChevronDown, User as UserIcon, LogOut, ShieldCheck, Sparkles, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface NavbarProps {
  onOpenDemoModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDemoModal }) => {
  const { user, isAuthenticated, isAdmin, logout, demoLogin } = useAuth();
  const { unreadCount } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Search Items', path: '/search' },
    { name: 'Report Lost', path: '/report/lost' },
    { name: 'Report Found', path: '/report/found' },
    { name: 'Rewards', path: '/rewards' },
    { name: 'Marketplace', path: '/marketplace' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#070B14]/85 backdrop-blur-md border-b border-blue-900/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Wordmark Logo */}
        <Link to="/" className="flex flex-col group focus:outline-none">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black tracking-tight text-white group-hover:text-blue-200 transition-colors">
              Back
            </span>
            <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">
              2U
            </span>
          </div>
          <span className="text-[9px] font-bold tracking-widest uppercase text-blue-400/90 -mt-1 group-hover:text-blue-300 transition-colors">
            Lost Today. Found Tomorrow.
          </span>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  active
                    ? 'text-white bg-blue-600/30 border border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Search, Bell, Auth / User Profile */}
        <div className="flex items-center gap-3 md:gap-4">
          
          {/* Search Trigger */}
          <button
            onClick={() => navigate('/search')}
            aria-label="Search items"
            className="p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications Bell */}
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Demo Personas Switcher Button */}
          <button
            onClick={onOpenDemoModal}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 text-blue-300 hover:border-blue-400 hover:text-white transition-all shadow-[0_0_10px_rgba(59,130,246,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Demo Accounts
          </button>

          {/* User Profile Pill or Sign In Button */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-[#0F1A33]/90 border border-blue-500/25 hover:border-blue-400/50 transition-all focus:outline-none"
              >
                <div className="relative">
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`}
                    alt={user.full_name}
                    className="w-8 h-8 rounded-full object-cover border border-blue-400/30"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0F1A33]" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-tight">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] text-blue-300 font-medium leading-tight">
                    {user.points_balance} pts
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0C152B] border border-blue-500/25 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-xs text-slate-400">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
                        Trust Score: {user.trust_score}
                      </span>
                      {isAdmin && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-blue-400" />
                    Dashboard
                  </Link>

                  <Link
                    to="/my-reports"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 text-cyan-400" />
                    My Reports
                  </Link>

                  <Link
                    to="/claims"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Ownership Claims
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-indigo-300 hover:text-indigo-100 hover:bg-indigo-600/10 transition-colors font-medium"
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      Admin Control Panel
                    </Link>
                  )}

                  <div className="border-t border-slate-800 my-1" />

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_14px_rgba(37,99,235,0.4)] transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
