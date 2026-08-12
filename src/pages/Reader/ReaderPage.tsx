import React, { useState, useEffect, useRef } from 'react';
import { getChapterContent } from '../../services/freewebnovel';
import { getChaptersForNovel, getChapterById, updateChapterContent, markChapterRead } from '../../services/chaptersRepo';
import { saveReadingProgress } from '../../services/progressRepo';
import { useReaderPrefsStore } from '../../store/readerPrefsStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Chapter } from '../../types';
import { ArrowLeft, ChevronLeft, ChevronRight, Settings, List, RefreshCw, Loader2, BookOpen } from 'lucide-react';

interface ReaderPageProps {
  novelId: number;
  initialChapterId: number;
  onBack: () => void;
}

export const ReaderPage: React.FC<ReaderPageProps> = ({ novelId, initialChapterId, onBack }) => {
  const { baseDomain } = useSettingsStore();
  const { fontSize, fontFamily, theme, lineHeight, setFontSize, setFontFamily, setTheme, setLineHeight } = useReaderPrefsStore();

  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showToc, setShowToc] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // Load chapter list & current chapter
  const loadChapter = async (chapId: number) => {
    setIsLoading(true);
    try {
      const allChaps = await getChaptersForNovel(novelId, true);
      setChapters(allChaps);

      const chap = await getChapterById(chapId);
      if (!chap) return;

      setCurrentChapter(chap);

      // Check if content exists offline
      if (chap.content) {
        setContent(chap.content);
      } else {
        // Scrape chapter content live
        const scraped = await getChapterContent(chap.source_url);
        setContent(scraped.content);
        await updateChapterContent(chap.id, scraped.content);
      }

      // Record reading progress
      await markChapterRead(chap.id, true);
      await saveReadingProgress(novelId, chap.id, 0);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      console.error('Failed to load chapter content:', e);
      setContent(
        `<div class="bg-[#161618] border border-[#2A2A2E] rounded-2xl p-6 text-center my-8 text-gray-300">
          <p class="font-semibold text-sm mb-2 text-amber-400">Unable to reach chapter source</p>
          <p class="text-xs text-gray-400 mb-4">${e?.message || 'Connection or Cloudflare challenge prevented loading this chapter.'}</p>
        </div>`
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChapter(initialChapterId);
  }, [initialChapterId, novelId, baseDomain]);

  if (!currentChapter) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-[#E09F3E] p-4">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const currentIndex = chapters.findIndex((c) => c.id === currentChapter.id);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  // Reader Themes mapping
  const themeClasses = {
    dark: 'bg-[#0A0A0B] text-[#E1E1E6]',
    sepia: 'bg-[#1C1814] text-[#D8C4B6]',
    light: 'bg-[#F4F4F0] text-[#111113]',
    black: 'bg-[#000000] text-[#D1D1D6]',
  }[theme] || 'bg-[#0A0A0B] text-[#E1E1E6]';

  const fontFamilies = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
  }[fontFamily] || 'font-sans';

  return (
    <div className={`min-h-screen ${themeClasses} transition-colors duration-200`}>
      {/* Top Floating Control Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0A0A0B]/90 backdrop-blur-md border-b border-[#2A2A2E] px-4 py-3 flex items-center justify-between max-w-2xl mx-auto text-[#E1E1E6]">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-[#2A2A2E] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#E1E1E6]" />
        </button>

        <h1 className="text-xs font-semibold text-[#E1E1E6] truncate max-w-[200px]">
          {currentChapter.title}
        </h1>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowToc(true)}
            className="p-1.5 rounded-lg hover:bg-[#2A2A2E] text-[#94949D] hover:text-[#E09F3E]"
            title="Table of Contents"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-colors ${
              showSettings ? 'text-[#E09F3E] bg-[#2A2A2E]' : 'text-[#94949D] hover:text-[#E09F3E]'
            }`}
            title="Reader Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Reader Settings Drawer */}
      {showSettings && (
        <div className="fixed top-14 left-0 right-0 z-50 bg-[#161618] border-b border-[#2A2A2E] p-4 max-w-2xl mx-auto shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-4">
            {/* Font Size */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#94949D] block mb-1.5">
                Font Size: {fontSize}px
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                  className="px-3 py-1 bg-[#0A0A0B] border border-[#2A2A2E] text-xs font-bold rounded-lg text-[#E1E1E6]"
                >
                  A-
                </button>
                <input
                  type="range"
                  min="12"
                  max="28"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="flex-1 accent-[#E09F3E]"
                />
                <button
                  onClick={() => setFontSize(Math.min(28, fontSize + 1))}
                  className="px-3 py-1 bg-[#0A0A0B] border border-[#2A2A2E] text-xs font-bold rounded-lg text-[#E1E1E6]"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Font Family & Theme */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94949D] block mb-1.5">
                  Font
                </label>
                <div className="flex bg-[#0A0A0B] border border-[#2A2A2E] p-1 rounded-xl">
                  {(['sans', 'serif', 'mono'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFontFamily(f)}
                      className={`flex-1 py-1 text-xs rounded-lg uppercase font-semibold ${
                        fontFamily === f ? 'bg-[#E09F3E] text-black' : 'text-[#94949D]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94949D] block mb-1.5">
                  Theme
                </label>
                <div className="flex bg-[#0A0A0B] border border-[#2A2A2E] p-1 rounded-xl">
                  {(['dark', 'sepia', 'light', 'black'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`flex-1 py-1 text-xs rounded-lg uppercase font-semibold ${
                        theme === t ? 'bg-[#E09F3E] text-black' : 'text-[#94949D]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chapter Content Body */}
      <main className="pt-20 pb-32 px-5 max-w-2xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#E09F3E]">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs font-mono">Fetching chapter content...</p>
          </div>
        ) : (
          <article className={fontFamilies}>
            <h1 className="text-xl font-bold mb-6 text-center text-[#E09F3E] border-b border-[#2A2A2E] pb-4">
              {currentChapter.title}
            </h1>

            <div
              ref={contentRef}
              style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
              className="space-y-4 tracking-normal"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </article>
        )}

        {/* Bottom Navigation Buttons */}
        {!isLoading && (
          <div className="flex items-center justify-between gap-3 mt-12 pt-6 border-t border-[#2A2A2E]">
            <button
              disabled={!prevChapter}
              onClick={() => prevChapter && loadChapter(prevChapter.id)}
              className="flex-1 flex items-center justify-center gap-1 bg-[#161618] border border-[#2A2A2E] text-[#E1E1E6] hover:border-[#E09F3E]/40 font-semibold text-xs py-3 rounded-xl disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 text-[#E09F3E]" />
              Previous
            </button>

            <button
              disabled={!nextChapter}
              onClick={() => nextChapter && loadChapter(nextChapter.id)}
              className="flex-1 flex items-center justify-center gap-1 bg-[#E09F3E] text-black font-bold text-xs py-3 rounded-xl hover:bg-[#c98e37] disabled:opacity-30"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Table of Contents Overlay Drawer */}
      {showToc && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0B]/90 backdrop-blur-md flex flex-col max-w-2xl mx-auto">
          <header className="flex items-center justify-between p-4 border-b border-[#2A2A2E]">
            <h3 className="text-sm font-bold text-[#E1E1E6] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#E09F3E]" />
              Table of Contents
            </h3>
            <button
              onClick={() => setShowToc(false)}
              className="text-xs font-bold text-[#E09F3E] uppercase px-3 py-1 rounded-lg border border-[#E09F3E]/30"
            >
              Close
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {chapters.map((chap) => {
              const isCurrent = chap.id === currentChapter.id;
              return (
                <button
                  key={chap.id}
                  onClick={() => {
                    setShowToc(false);
                    loadChapter(chap.id);
                  }}
                  className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-colors ${
                    isCurrent
                      ? 'bg-[#E09F3E] text-black font-bold'
                      : chap.is_read
                      ? 'text-[#94949D] hover:bg-[#161618]'
                      : 'text-[#E1E1E6] hover:bg-[#161618]'
                  }`}
                >
                  {chap.title}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
