import React, { useState, useEffect } from 'react';
import { getLibraryNovels, getCategories, addCategory } from '../../services/novelsRepo';
import { NovelCard } from '../../components/NovelCard';
import { EmptyState } from '../../components/EmptyState';
import { Novel, Category } from '../../types';
import { Bookmark, FolderPlus, Search, RefreshCw, BookOpen } from 'lucide-react';

interface LibraryPageProps {
  onSelectNovel: (slug: string) => void;
  onGoToBrowse: () => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ onSelectNovel, onGoToBrowse }) => {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [filterText, setFilterText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const saved = await getLibraryNovels(selectedCatId);
      setNovels(saved);
      const cats = await getCategories();
      setCategories(cats);
    } catch (e) {
      console.error('Failed to load library:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCatId]);

  const filteredNovels = novels.filter((n) =>
    n.title.toLowerCase().includes(filterText.toLowerCase()) ||
    n.author.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E1E1E6] flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[#E09F3E]" />
            My Library
          </h1>
          <p className="text-[11px] text-[#94949D] mt-0.5">
            {novels.length} novels saved offline in SQLite
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-xl bg-[#161618] border border-[#2A2A2E] text-[#94949D] hover:text-[#E09F3E]"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
        <button
          onClick={() => setSelectedCatId(null)}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition-all ${
            selectedCatId === null
              ? 'bg-[#E09F3E] text-black shadow-[0_0_10px_rgba(224,159,62,0.3)]'
              : 'bg-[#161618] border border-[#2A2A2E] text-[#94949D] hover:text-[#E1E1E6]'
          }`}
        >
          All Novels
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCatId(cat.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-tight transition-all ${
              selectedCatId === cat.id
                ? 'bg-[#E09F3E] text-black shadow-[0_0_10px_rgba(224,159,62,0.3)]'
                : 'bg-[#161618] border border-[#2A2A2E] text-[#94949D] hover:text-[#E1E1E6]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      {novels.length > 0 && (
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search within library..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-[#161618] border border-[#2A2A2E] text-xs text-[#E1E1E6] pl-8 pr-3 py-2 rounded-xl focus:outline-hidden focus:border-[#E09F3E]"
          />
          <Search className="w-3.5 h-3.5 text-[#94949D] absolute left-2.5 top-3" />
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#161618] border border-[#2A2A2E] rounded-xl h-60 animate-pulse p-3" />
          ))}
        </div>
      ) : filteredNovels.length === 0 ? (
        <EmptyState
          title="Library is Empty"
          description="You haven't added any novels to your library yet. Browse FreeWebNovel to bookmark your favorites."
          icon={BookOpen}
          actionLabel="Explore Novels"
          onAction={onGoToBrowse}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3.5">
          {filteredNovels.map((novel, index) => (
            <NovelCard
              key={`${novel.slug}-${index}`}
              novel={novel}
              inLibrary={true}
              onClick={() => onSelectNovel(novel.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
