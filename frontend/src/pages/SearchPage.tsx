import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Calendar, MapPin, Tag, RefreshCw, ChevronLeft, ChevronRight, Layers, Database } from 'lucide-react';
import { api } from '../services/api';
import { Item } from '../types';
import { ItemCard } from '../components/ui/ItemCard';

const CATEGORIES = [
  'All',
  'Electronics',
  'Wallets and bags',
  'Keys',
  'Documents',
  'Clothing',
  'Accessories',
  'Bottles and containers',
  'Other',
];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [reportType, setReportType] = useState(searchParams.get('report_type') || 'ALL');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'recent');
  
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  // High-Volume Pagination State (>50,000 records)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFilteredItems = async (targetPage: number = page, targetLimit: number = limit) => {
    setLoading(true);
    try {
      const res = await api.getPaginatedItems({
        page: targetPage,
        limit: targetLimit,
        query: query.trim() || undefined,
        category: category !== 'All' ? category : undefined,
        report_type: reportType !== 'ALL' ? reportType : undefined,
        location: location.trim() || undefined,
        sort_by: sortBy,
      });

      setItems(res.items);
      setTotalCount(res.total_count);
      setTotalPages(res.total_pages);
      setPage(res.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchFilteredItems(1, limit);
  }, [category, reportType, sortBy, limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFilteredItems(1, limit);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchFilteredItems(newPage, limit);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Search Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Search Lost & Found Belongings
        </h1>
        <p className="text-sm text-slate-400">
          Search items across campus or public spaces using keywords, categories, dates, or let AI find semantic matches.
        </p>
      </div>

      {/* Filter Bar Controls */}
      <div className="p-5 rounded-2xl bg-[#091224]/90 border border-blue-900/35 space-y-4">
        
        {/* Main Search Row */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, description, brand (e.g., wallet, hydro flask, keys)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D1B] border border-blue-900/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          <div className="relative w-full md:w-64">
            <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Area (e.g., Library, Gym)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070D1B] border border-blue-900/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all shrink-0 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </form>

        {/* Filter Badges & Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-blue-950/70 text-xs">
          
          {/* Lost / Found Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Type:</span>
            <div className="flex bg-[#070D1B] rounded-lg p-0.5 border border-blue-900/40">
              {['ALL', 'LOST', 'FOUND'].map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    reportType === type
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-[#070D1B] border border-blue-900/40 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[#070D1B] text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#070D1B] border border-blue-900/40 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400"
            >
              <option value="recent">Most Recent</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>

        </div>

      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300">
              Found <strong className="text-white">{totalCount.toLocaleString()}</strong> {totalCount === 1 ? 'item' : 'items'}
            </span>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300">
              <Database className="w-3 h-3 text-blue-400" />
              <span>High-Scale Indexed (&gt;50,000 Capacity)</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Items per page selector */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="bg-[#070D1B] border border-blue-900/40 text-white rounded-md px-2 py-1 text-xs focus:outline-none"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>

            <button
              onClick={() => fetchFilteredItems(page, limit)}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-xs text-slate-400">Searching high-capacity indexed records...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-[#091224]/40 border border-blue-900/20">
            <Tag className="w-12 h-12 text-blue-500/40 mb-3" />
            <h3 className="text-base font-bold text-white">No items found</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
              Try adjusting your search criteria or submit a new report to let our AI scan for upcoming matches.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-6 border-t border-blue-950/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <span className="text-slate-400">
                  Showing page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong> ({totalCount.toLocaleString()} total items)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="p-2 rounded-lg bg-[#070D1B] border border-blue-900/40 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = page <= 3 ? i + 1 : page + i - 2;
                      if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                      if (pageNum < 1) pageNum = 1;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-lg font-semibold transition-all ${
                            page === pageNum
                              ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                              : 'bg-[#070D1B] border border-blue-900/40 text-slate-400 hover:text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg bg-[#070D1B] border border-blue-900/40 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};
