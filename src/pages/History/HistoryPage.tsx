import React, { useState, useEffect } from 'react';
import { getAllReadingHistory, ReadingHistoryItem } from '../../services/progressRepo';
import { EmptyState } from '../../components/EmptyState';
import { Clock, BookOpen, Trash2 } from 'lucide-react';

interface HistoryPageProps {
  onReadChapter: (novelId: number, chapterId: number) => void;
  onGoToBrowse: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onReadChapter, onGoToBrowse }) => {
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const items = await getAllReadingHistory();
      setHistory(items);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <header className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E1E1E6] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#E09F3E]" />
            Reading History
          </h1>
          <p className="text-[11px] text-[#94949D] mt-0.5">
            Recently opened chapters stored locally
          </p>
        </div>
      </header>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#161618] border border-[#2A2A2E] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          title="No Reading History"
          description="Start reading web novels from Browse or Library to track your recent reading activity here."
          icon={Clock}
          actionLabel="Start Reading"
          onAction={onGoToBrowse}
        />
      ) : (
        <div className="space-y-2.5">
          {history.map((item) => (
            <div
              key={`${item.novel_id}-${item.chapter_id}`}
              onClick={() => onReadChapter(item.novel_id, item.chapter_id)}
              className="flex items-center gap-3 p-3 bg-[#161618] border border-[#2A2A2E] hover:border-[#E09F3E]/40 rounded-xl cursor-pointer transition-all"
            >
              <img
                src={item.novel_cover}
                alt={item.novel_title}
                className="w-10 h-14 object-cover rounded-lg shrink-0 border border-[#2A2A2E]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.novel_slug}/300/400`;
                }}
              />

              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-[#E1E1E6] truncate">
                  {item.novel_title}
                </h3>
                <p className="text-[11px] text-[#E09F3E] font-medium mt-0.5 truncate">
                  {item.chapter_title}
                </p>
                <p className="text-[10px] text-[#94949D] font-mono mt-1">
                  {new Date(item.last_read_at).toLocaleDateString()} • {new Date(item.last_read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
