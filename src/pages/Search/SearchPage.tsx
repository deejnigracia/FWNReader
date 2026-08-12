import React, { useState, useEffect } from 'react';
import { searchNovels } from '../../services/freewebnovel';
import { NovelCard } from '../../components/NovelCard';
import { ScrapedSearchResult } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { ArrowLeft, Search, X, Loader2 } from 'lucide-react';

interface SearchPageProps {
  onBack: () => void;
  onSelectNovel: (slug: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ onBack, onSelectNovel }) => {
  const { baseDomain } = useSettingsStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScrapedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchNovels(query.trim(), baseDomain);
        setResults(res);
        setHasSearched(true);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, baseDomain]);

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-[#0A0A0B]">
      {/* Header with Search Bar */}
      <header className="flex items-center gap-2 mb-5">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-[#161618] border border-[#2A2A2E] text-[#E1E1E6] hover:text-[#E09F3E]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search web novels by title or author..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#161618] border border-[#2A2A2E] focus:border-[#E09F3E] text-[#E1E1E6] text-xs pl-9 pr-8 py-2.5 rounded-xl focus:outline-hidden transition-colors"
            autoFocus
          />
          <Search className="w-4 h-4 text-[#94949D] absolute left-3 top-3" />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-2.5 text-[#94949D] hover:text-[#E1E1E6]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Suggested Search Terms */}
      {!query && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#94949D] mb-3">
            Popular Queries
          </h3>
          <div className="flex flex-wrap gap-2">
            {['Shadow Slave', 'Lord of the Mysteries', 'Reverend Insanity', 'Mechanic', 'Omniscient'].map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="px-3 py-1.5 rounded-xl bg-[#161618] border border-[#2A2A2E] text-xs text-[#E1E1E6] hover:border-[#E09F3E]/40 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status Bar */}
      {isSearching && (
        <div className="flex items-center justify-center py-10 text-[#E09F3E] gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-xs font-mono">Searching FreeWebNovel database...</span>
        </div>
      )}

      {/* Results List */}
      {!isSearching && hasSearched && results.length === 0 && (
        <div className="text-center py-16 text-[#94949D]">
          <p className="text-sm font-medium">No results found for "{query}"</p>
          <p className="text-xs mt-1">Check spelling or try another keyword.</p>
        </div>
      )}

      {!isSearching && results.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#94949D] mb-3">
            Search Results ({results.length})
          </h3>

          <div className="flex flex-col gap-3">
            {results.map((novel, index) => (
              <NovelCard
                key={`${novel.slug}-${index}`}
                novel={novel}
                layout="list"
                onClick={() => onSelectNovel(novel.slug)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
