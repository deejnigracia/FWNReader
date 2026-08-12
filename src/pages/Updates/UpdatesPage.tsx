import React, { useState, useEffect } from 'react';
import { checkForLibraryUpdates, UpdatedChapterItem } from '../../services/updateChecker';
import { ChapterRow } from '../../components/ChapterRow';
import { markChapterRead } from '../../services/chaptersRepo';
import { Bell, RefreshCw, Sparkles, CheckCheck } from 'lucide-react';

interface UpdatesPageProps {
  onReadChapter: (novelId: number, chapterId: number) => void;
}

export const UpdatesPage: React.FC<UpdatesPageProps> = ({ onReadChapter }) => {
  const [updates, setUpdates] = useState<UpdatedChapterItem[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const fetchUpdates = async () => {
    setIsChecking(true);
    try {
      const items = await checkForLibraryUpdates();
      setUpdates(items);
    } catch (e) {
      console.error('Failed to check updates:', e);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <header className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E1E1E6] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#E09F3E]" />
            Novel Updates
          </h1>
          <p className="text-[11px] text-[#94949D] mt-0.5">
            Latest chapter releases for your library items
          </p>
        </div>

        <button
          onClick={fetchUpdates}
          disabled={isChecking}
          className="p-2.5 rounded-xl bg-[#161618] border border-[#2A2A2E] text-[#E1E1E6] hover:text-[#E09F3E] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin text-[#E09F3E]' : ''}`} />
        </button>
      </header>

      {/* Content */}
      {isChecking ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#E09F3E]">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p className="text-xs font-mono">Checking FreeWebNovel for new chapters...</p>
        </div>
      ) : updates.length === 0 ? (
        <div className="text-center py-20 px-4">
          <div className="w-14 h-14 rounded-2xl bg-[#161618] border border-[#2A2A2E] flex items-center justify-center text-[#E09F3E] mx-auto mb-3">
            <CheckCheck className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-[#E1E1E6] mb-1">
            All Caught Up!
          </h3>
          <p className="text-xs text-[#94949D]">
            No unread chapter releases found for novels in your library.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((item, index) => (
            <div key={`${item.novel.id}-${index}`} className="bg-[#161618] border border-[#2A2A2E] rounded-xl p-3.5 shadow-md">
              <div className="flex items-center gap-3 mb-2.5 pb-2 border-b border-[#2A2A2E]">
                <img
                  src={item.novel.cover_url}
                  alt={item.novel.title}
                  className="w-8 h-11 object-cover rounded-md border border-[#2A2A2E]"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-[#E1E1E6] truncate">
                    {item.novel.title}
                  </h3>
                  <p className="text-[10px] text-[#E09F3E]">
                    {item.newChapters.length} new chapter{item.newChapters.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                {item.newChapters.map((chap, idx) => (
                  <ChapterRow
                    key={`${chap.id}-${idx}`}
                    chapter={chap}
                    onRead={() => onReadChapter(item.novel.id, chap.id)}
                    onToggleRead={async (e) => {
                      e.stopPropagation();
                      await markChapterRead(chap.id, true);
                      setUpdates((prev) =>
                        prev.map((u) =>
                          u.novel.id === item.novel.id
                            ? { ...u, newChapters: u.newChapters.filter((c) => c.id !== chap.id) }
                            : u
                        ).filter((u) => u.newChapters.length > 0)
                      );
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
