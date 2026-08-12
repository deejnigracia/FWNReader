import React, { useState, useEffect } from 'react';
import { getNovelDetail } from '../../services/freewebnovel';
import { upsertNovel, getNovelBySlug, addToLibrary, removeFromLibrary, updateNovelCategory, getCategories, addCategory } from '../../services/novelsRepo';
import { saveChapters, getChaptersForNovel, markChapterRead, deleteDownloadedChapter, updateChapterContent } from '../../services/chaptersRepo';
import { getReadingProgress } from '../../services/progressRepo';
import { downloadQueue, DownloadProgressEvent } from '../../services/downloadQueue';
import { ChapterRow } from '../../components/ChapterRow';
import { CategoryModal } from '../../components/CategoryModal';
import { ProgressBar } from '../../components/ProgressBar';
import { Novel, Chapter, Category } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { ArrowLeft, Bookmark, BookmarkCheck, BookOpen, Download, ArrowUpDown, Search, Filter, Share2 } from 'lucide-react';

interface NovelDetailPageProps {
  slug: string;
  onBack: () => void;
  onReadChapter: (novelId: number, chapterId: number) => void;
}

export const NovelDetailPage: React.FC<NovelDetailPageProps> = ({ slug, onBack, onReadChapter }) => {
  const { baseDomain } = useSettingsStore();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lastReadChapterId, setLastReadChapterId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortAsc, setSortAsc] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Download state
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgressEvent | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch live or cached novel info
      const liveData = await getNovelDetail(slug, baseDomain);
      const savedNovel = await upsertNovel(liveData.novel);

      // Check library status
      const fullNovel = await getNovelBySlug(slug);
      setNovel(fullNovel || savedNovel);

      // 2. Save and fetch chapters
      if (liveData.chapters.length > 0) {
        await saveChapters(savedNovel.id, liveData.chapters);
      }
      const chaps = await getChaptersForNovel(savedNovel.id, sortAsc);
      setChapters(chaps);

      // 3. Check progress
      const progress = await getReadingProgress(savedNovel.id);
      if (progress && progress.last_chapter_id) {
        setLastReadChapterId(progress.last_chapter_id);
      }

      // 4. Categories
      const cats = await getCategories();
      setCategories(cats);
    } catch (e) {
      console.error('Failed to load novel detail:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug, baseDomain, sortAsc]);

  useEffect(() => {
    const unsubscribe = downloadQueue.subscribe((event) => {
      if (novel && event.novelId === novel.id) {
        setDownloadProgress(event);
        if (!event.isProcessing) {
          // Refresh chapters list when done
          getChaptersForNovel(novel.id, sortAsc).then(setChapters);
        }
      }
    });
    return unsubscribe;
  }, [novel, sortAsc]);

  const handleLibraryToggle = async () => {
    if (!novel) return;

    if (novel.in_library) {
      await removeFromLibrary(novel.id);
      setNovel({ ...novel, in_library: false });
    } else {
      setShowCategoryModal(true);
    }
  };

  const handleSelectCategory = async (catId: number | null) => {
    if (!novel) return;

    await addToLibrary(novel.id, catId);
    setNovel({ ...novel, in_library: true, category_id: catId });
    setShowCategoryModal(false);
  };

  const handleDownloadAll = () => {
    if (!novel || chapters.length === 0) return;
    downloadQueue.enqueueChapters(novel.id, chapters);
  };

  const handleToggleRead = async (e: React.MouseEvent, chap: Chapter) => {
    e.stopPropagation();
    await markChapterRead(chap.id, !chap.is_read);
    setChapters((prev) =>
      prev.map((c) => (c.id === chap.id ? { ...c, is_read: !c.is_read } : c))
    );
  };

  const handleDownloadToggle = async (e: React.MouseEvent, chap: Chapter) => {
    e.stopPropagation();
    if (!novel) return;

    if (chap.content) {
      await deleteDownloadedChapter(chap.id);
      setChapters((prev) =>
        prev.map((c) => (c.id === chap.id ? { ...c, content: null, downloaded_at: null } : c))
      );
    } else {
      downloadQueue.enqueueChapters(novel.id, [chap]);
    }
  };

  const filteredChapters = chapters.filter((c) =>
    c.title.toLowerCase().includes(filterText.toLowerCase()) ||
    c.chapter_number.toString().includes(filterText)
  );

  const downloadedCount = chapters.filter((c) => Boolean(c.content)).length;

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-[#0A0A0B]">
      {/* Top Header Navigation */}
      <header className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-[#161618] border border-[#2A2A2E] text-[#E1E1E6] hover:text-[#E09F3E] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2 className="text-xs font-bold uppercase tracking-widest text-[#94949D] truncate max-w-[200px]">
          {novel?.title || 'Novel Detail'}
        </h2>

        <button
          onClick={handleLibraryToggle}
          className={`p-2 rounded-xl border transition-all ${
            novel?.in_library
              ? 'bg-[#E09F3E] border-[#E09F3E] text-black font-bold'
              : 'bg-[#161618] border-[#2A2A2E] text-[#E1E1E6] hover:text-[#E09F3E]'
          }`}
        >
          {novel?.in_library ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
        </button>
      </header>

      {isLoading ? (
        <div className="space-y-4 animate-pulse py-6">
          <div className="flex gap-4">
            <div className="w-28 h-40 bg-[#161618] rounded-xl border border-[#2A2A2E]" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-[#161618] rounded w-3/4" />
              <div className="h-3 bg-[#161618] rounded w-1/2" />
              <div className="h-3 bg-[#161618] rounded w-1/3" />
            </div>
          </div>
          <div className="h-20 bg-[#161618] rounded-xl" />
        </div>
      ) : novel ? (
        <>
          {/* Main Hero Card */}
          <div className="bg-[#161618] border border-[#2A2A2E] rounded-2xl p-4 mb-5 shadow-xl relative overflow-hidden">
            <div className="flex gap-4">
              <img
                src={novel.cover_url}
                alt={novel.title}
                className="w-28 h-40 object-cover rounded-xl shadow-lg shrink-0 border border-[#2A2A2E]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${novel.slug}/300/400`;
                }}
              />

              <div className="flex flex-col justify-between flex-1 min-w-0">
                <div>
                  <h1 className="text-base font-bold text-[#E1E1E6] leading-snug line-clamp-2">
                    {novel.title}
                  </h1>
                  <p className="text-xs text-[#E09F3E] font-medium mt-1 line-clamp-1 italic">
                    {novel.author}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {novel.genres.split(',').slice(0, 3).map((g, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[9px] font-semibold bg-[#0A0A0B] text-[#94949D] border border-[#2A2A2E]"
                      >
                        {g.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase ${
                      novel.status?.toLowerCase().includes('completed')
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-[#E09F3E]/10 text-[#E09F3E] border border-[#E09F3E]/20'
                    }`}
                  >
                    {novel.status}
                  </span>
                  <span className="text-[10px] font-mono text-[#94949D]">
                    {chapters.length} Chs
                  </span>
                </div>
              </div>
            </div>

            {/* Synopsis */}
            <div className="mt-4 pt-3 border-t border-[#2A2A2E]">
              <p className="text-xs text-[#94949D] leading-relaxed line-clamp-4">
                {novel.synopsis}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#2A2A2E]">
              <button
                onClick={() => {
                  const targetChap = chapters.find((c) => c.id === lastReadChapterId) || chapters[0];
                  if (targetChap) onReadChapter(novel.id, targetChap.id);
                }}
                disabled={chapters.length === 0}
                className="flex items-center justify-center gap-2 bg-[#E09F3E] hover:bg-[#c98e37] text-black font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <BookOpen className="w-4 h-4" />
                {lastReadChapterId ? 'Continue' : 'Start Reading'}
              </button>

              <button
                onClick={handleDownloadAll}
                disabled={downloadedCount === chapters.length || chapters.length === 0}
                className="flex items-center justify-center gap-1.5 bg-[#0A0A0B] border border-[#2A2A2E] hover:border-[#E09F3E]/50 text-[#E1E1E6] font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-[#E09F3E]" />
                Download ({chapters.length - downloadedCount})
              </button>
            </div>
          </div>

          {/* Active Download Progress */}
          {downloadProgress && downloadProgress.isProcessing && (
            <div className="mb-4">
              <ProgressBar
                current={downloadProgress.completed}
                total={downloadProgress.total}
                label="Downloading Offline Chapters"
                subLabel={downloadProgress.currentChapterTitle}
              />
            </div>
          )}

          {/* Chapter Filter & Header Controls */}
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Filter chapters..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full bg-[#161618] border border-[#2A2A2E] text-xs text-[#E1E1E6] pl-8 pr-3 py-1.5 rounded-xl focus:outline-hidden focus:border-[#E09F3E]"
              />
              <Search className="w-3.5 h-3.5 text-[#94949D] absolute left-2.5 top-2.5" />
            </div>

            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#161618] border border-[#2A2A2E] text-xs text-[#94949D] hover:text-[#E1E1E6] rounded-xl font-mono"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#E09F3E]" />
              {sortAsc ? 'Asc' : 'Desc'}
            </button>
          </div>

          {/* Chapters List */}
          <div className="space-y-2">
            {filteredChapters.map((chap, idx) => (
              <ChapterRow
                key={`${chap.id}-${idx}`}
                chapter={chap}
                onRead={() => onReadChapter(novel.id, chap.id)}
                onToggleRead={(e) => handleToggleRead(e, chap)}
                onDownloadToggle={(e) => handleDownloadToggle(e, chap)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="bg-[#161618] border border-[#2A2A2E] rounded-2xl p-6 text-center text-gray-300 my-8">
          <p className="text-sm font-medium mb-3 text-gray-300">Failed to load novel details or source is unreachable.</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-[#E09F3E] hover:bg-[#C88A32] text-black font-semibold text-xs rounded-xl transition-all"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Category Picker Modal */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={categories}
        selectedCategoryId={novel?.category_id || null}
        onSelectCategory={handleSelectCategory}
        onCreateCategory={async (name) => {
          const cat = await addCategory(name);
          setCategories((prev) => [...prev, cat]);
          handleSelectCategory(cat.id);
        }}
      />
    </div>
  );
};
