import React, { useState, useEffect } from 'react';
import { getBrowseNovels } from '../../services/freewebnovel';
import { NovelCard } from '../../components/NovelCard';
import { CloudflareCounter } from '../../components/CloudflareCounter';
import { ScrapedSearchResult } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { Search, Compass, RefreshCw, Flame, Sparkles, CheckCircle, Tag } from 'lucide-react';

interface BrowsePageProps {
  onSelectNovel: (slug: string) => void;
  onOpenSearch: () => void;
}

const CATEGORIES = [
  { id: 'most-popular', label: 'Most Popular', icon: Flame },
  { id: 'latest-release', label: 'Latest Release', icon: Sparkles },
  { id: 'completed', label: 'Completed', icon: CheckCircle },
  { id: 'genre-fantasy', label: 'Fantasy', icon: Tag },
  { id: 'genre-action', label: 'Action', icon: Tag },
  { id: 'genre-scifi', label: 'Sci-Fi', icon: Tag },
];

export const BrowsePage: React.FC<BrowsePageProps> = ({ onSelectNovel, onOpenSearch }) => {
  const { baseDomain } = useSettingsStore();
  const [selectedCategory, setSelectedCategory] = useState('most-popular');
  const [novels, setNovels] = useState<ScrapedSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchNovels = async (cat: string, p: number) => {
    setIsLoading(true);
    try {
      const results = await getBrowseNovels(cat, p, baseDomain);
      setNovels(results);
    } catch (e) {
      console.error('Error fetching browse novels:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNovels(selectedCategory, page);
  }, [selectedCategory, page, baseDomain]);

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <header className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E09F3E] text-black font-black flex items-center justify-center text-lg shadow-[0_0_12px_rgba(224,159,62,0.3)]">
              F
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#E1E1E6]">
              FreeWebNovel
            </h1>
          </div>
          <p className="text-[11px] text-[#94949D] mt-0.5">
            Browse web novels with Anti-Bot Shield protection
          </p>
        </div>

        <button
          onClick={onOpenSearch}
          className="p-2.5 rounded-xl bg-[#161618] border border-[#2A2A2E] text-[#E1E1E6] hover:text-[#E09F3E] hover:border-[#E09F3E]/40 transition-all shadow-sm"
          title="Search novels"
        >
          <Search className="w-5 h-5" />
        </button>
      </header>

      {/* Cloudflare Shield Live Counter Badge */}
      <div className="mb-4 flex items-center justify-between bg-[#161618] border border-[#2A2A2E] p-2.5 rounded-xl">
        <span className="text-xs text-gray-400 font-medium">Cloudflare Protection:</span>
        <CloudflareCounter compact />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setPage(1);
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition-all ${
                isActive
                  ? 'bg-[#E09F3E] text-black shadow-[0_0_10px_rgba(224,159,62,0.3)]'
                  : 'bg-[#161618] border border-[#2A2A2E] text-[#94949D] hover:text-[#E1E1E6] hover:border-[#2A2A2E]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Section Title & Refresh */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#94949D] flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#E09F3E]" />
          {CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'Browse Results'}
        </h2>

        <button
          onClick={() => fetchNovels(selectedCategory, page)}
          className="text-[#94949D] hover:text-[#E09F3E] p-1 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#E09F3E]' : ''}`} />
        </button>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#161618] border border-[#2A2A2E] rounded-xl h-60 animate-pulse p-3">
              <div className="w-full h-36 bg-[#2A2A2E] rounded-lg mb-2" />
              <div className="h-3 bg-[#2A2A2E] rounded w-3/4 mb-1" />
              <div className="h-2.5 bg-[#2A2A2E] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : novels.length === 0 ? (
        <div className="text-center py-16 text-[#94949D]">
          <p className="text-sm">No novels found for this section.</p>
          <button
            onClick={() => fetchNovels(selectedCategory, page)}
            className="mt-3 text-xs text-[#E09F3E] font-semibold underline"
          >
            Try reloading
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5">
          {novels.map((novel, index) => (
            <NovelCard
              key={`${novel.slug}-${index}`}
              novel={novel}
              onClick={() => onSelectNovel(novel.slug)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && novels.length > 0 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#2A2A2E]">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-[#161618] border border-[#2A2A2E] text-xs font-semibold rounded-xl text-[#E1E1E6] disabled:opacity-40 disabled:pointer-events-none hover:border-[#E09F3E]/40"
          >
            Previous
          </button>
          <span className="text-xs font-mono text-[#94949D]">
            Page {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-[#161618] border border-[#2A2A2E] text-xs font-semibold rounded-xl text-[#E1E1E6] hover:border-[#E09F3E]/40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
