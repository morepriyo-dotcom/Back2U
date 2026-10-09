import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, ArrowRight, Package, Trophy, Users, Brain, 
  ShieldCheck, Gift, Home, FileText, Award, Settings, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Item } from '../types';
import { ItemCard } from '../components/ui/ItemCard';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyLost, setRecentlyLost] = useState<Item[]>([]);
  const [recentlyFound, setRecentlyFound] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await api.getRecentItems();
        setRecentlyLost(res.recently_lost || []);
        setRecentlyFound(res.recently_found || []);
      } catch (err) {
        console.warn('Failed to fetch recent items', err);
      }
    };
    fetchRecent();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-10">
      
      {/* =========================================================================
          HERO SECTION (Replicating back2u.jpeg Top Region)
         ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Hero Content (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <span className="text-[11px] md:text-xs font-bold tracking-widest uppercase text-blue-400">
              A SMARTER WAY TO REUNITE LOST ITEMS
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08]">
              <span className="text-white block">Lost Today.</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-blue-500 block">
                Found Tomorrow.
              </span>
            </h1>
            <p className="text-sm md:text-base text-slate-300/90 max-w-xl leading-relaxed">
              Use AI to find lost items, verify ownership, and reward people who help.
            </p>
          </div>

          {/* Hero Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center w-full max-w-xl rounded-full bg-[#0B1528]/90 border border-blue-500/30 p-1.5 focus-within:border-blue-400 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
          >
            <div className="pl-4 text-slate-400">
              <Search className="w-5 h-5 text-blue-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for lost items (e.g., phone, wallet, keys...)"
              className="w-full bg-transparent border-none text-sm text-white placeholder-slate-400 focus:outline-none px-3"
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.45)] transition-all shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* Right Action Cards (5 Cols) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          
          {/* I Lost Something Card */}
          <Link
            to="/report/lost"
            className="group relative flex flex-col justify-between p-6 rounded-2xl bg-[#0C172E]/90 border border-blue-500/30 hover:border-blue-400/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] transition-all duration-300"
          >
            <div>
              <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                I Lost Something
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Report your lost item and let AI help you find it.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* I Found Something Card */}
          <Link
            to="/report/found"
            className="group relative flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-b from-[#101A38]/90 to-[#0C152B]/90 border border-indigo-500/30 hover:border-indigo-400/60 hover:shadow-[0_0_25px_rgba(99,102,241,0.25)] transition-all duration-300"
          >
            <div>
              <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                I Found Something
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Report a found item and help it reach its owner.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* =========================================================================
          MIDDLE ROW: USER PROFILE NAV + RECENT ITEMS + REWARDS PREVIEW
         ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: User Profile Sidebar Menu Card (3 Cols) */}
        <div className="lg:col-span-3 rounded-2xl bg-[#0A1224]/90 border border-blue-900/35 p-5 space-y-5">
          {/* User Header */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                alt={user?.full_name || 'Rohan'}
                className="w-11 h-11 rounded-full object-cover border border-blue-500/30"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0A1224]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">
                {user?.full_name || 'Rohan'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isAuthenticated ? `Member • ${user?.points_balance} pts` : 'Member since Jan 2024'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs">
            <Link
              to="/"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-white bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <Link
              to="/my-reports"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>My Reports</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>

            <Link
              to="/rewards"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-yellow-400" />
                <span>My Rewards</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>

            <Link
              to="/profile"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>
          </nav>
        </div>

        {/* Center: Recently Lost Items Grid (6 Cols) */}
        <div className="lg:col-span-6 rounded-2xl bg-[#091222]/90 border border-blue-900/35 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-white">
                {activeTab === 'lost' ? 'Recently Lost Items' : 'Recently Found Items'}
              </h3>
              <div className="flex bg-[#070D1B] rounded-lg p-0.5 border border-blue-900/40 text-[10px]">
                <button
                  onClick={() => setActiveTab('lost')}
                  className={`px-2.5 py-0.5 rounded-md font-semibold transition-all ${
                    activeTab === 'lost' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lost
                </button>
                <button
                  onClick={() => setActiveTab('found')}
                  className={`px-2.5 py-0.5 rounded-md font-semibold transition-all ${
                    activeTab === 'found' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Found
                </button>
              </div>
            </div>

            <Link
              to={`/search?report_type=${activeTab.toUpperCase()}`}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              View All
            </Link>
          </div>

          {/* 4 Items Grid matching reference */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(activeTab === 'lost' ? recentlyLost : recentlyFound).slice(0, 4).map((item) => (
              <ItemCard key={item.id} item={item} showStatusBadge={false} />
            ))}
          </div>
        </div>

        {/* Right: Rewards Card & Community Card (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Back2U Rewards Card with Gold Coin */}
          <Link
            to="/rewards"
            className="group block relative p-5 rounded-2xl bg-gradient-to-br from-[#121B33]/90 to-[#0A1124]/90 border border-blue-500/25 hover:border-yellow-500/40 transition-all overflow-hidden"
          >
            {/* 3D Gold Coin Illusion Visual */}
            <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-2 border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.4)] flex items-center justify-center transform group-hover:rotate-12 transition-transform">
              <span className="text-amber-950 font-black text-xs">2U</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h4 className="text-sm font-bold text-white group-hover:text-yellow-300 transition-colors">
                Back2U Rewards
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pr-10">
              Earn points for genuine reports, successful returns and helping the community.
            </p>
          </Link>

          {/* A Safer, Kinder Community Card */}
          <Link
            to="/#community"
            className="group flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-[#111A35]/90 to-[#19153B]/90 border border-purple-500/25 hover:border-purple-400/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  A Safer, Kinder Community
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Turn lost moments into positive stories.
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition-all shrink-0">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

        </div>
      </section>

      {/* =========================================================================
          BOTTOM ROW: 3 CORE SYSTEM FEATURE CARDS (AI, VERIFICATION, REWARDS)
         ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: AI-Powered Matching */}
        <Link
          to="/#ai-matching"
          className="group flex items-center justify-between p-5 rounded-2xl bg-[#091224]/90 border border-blue-900/35 hover:border-blue-400/50 hover:bg-[#0D1832] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                AI-Powered Matching
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                Finds potential matches using images, descriptions and location.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" />
        </Link>

        {/* Card 2: Ownership Verification */}
        <Link
          to="/#verification"
          className="group flex items-center justify-between p-5 rounded-2xl bg-[#091224]/90 border border-blue-900/35 hover:border-blue-400/50 hover:bg-[#0D1832] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                Ownership Verification
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                Secure and fair verification to ensure items go to the right person.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" />
        </Link>

        {/* Card 3: Back2U Rewards */}
        <Link
          to="/rewards"
          className="group flex items-center justify-between p-5 rounded-2xl bg-[#091224]/90 border border-blue-900/35 hover:border-blue-400/50 hover:bg-[#0D1832] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                Back2U Rewards
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                Earn points for genuine reports and successful returns.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0" />
        </Link>

      </section>

    </div>
  );
};
