import React from 'react';
import { Chapter } from '../types';
import { Download, FileCheck, Eye, EyeOff } from 'lucide-react';

interface ChapterRowProps {
  chapter: Chapter;
  onRead: () => void;
  onToggleRead: (e: React.MouseEvent) => void;
  onDownloadToggle?: (e: React.MouseEvent) => void;
}

export const ChapterRow: React.FC<ChapterRowProps> = ({
  chapter,
  onRead,
  onToggleRead,
  onDownloadToggle,
}) => {
  const isDownloaded = Boolean(chapter.content);

  return (
    <div
      onClick={onRead}
      className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150 cursor-pointer ${
        chapter.is_read
          ? 'bg-[#0A0A0B] border-[#1A1A1E] text-[#94949D]/60'
          : 'bg-[#161618] border-[#2A2A2E] hover:border-[#E09F3E]/40 text-[#E1E1E6]'
      }`}
    >
      <div className="flex flex-col min-w-0 pr-3">
        <span className={`text-sm font-medium line-clamp-1 ${chapter.is_read ? 'text-[#94949D] font-normal' : 'text-[#E1E1E6]'}`}>
          {chapter.title || `Chapter ${chapter.chapter_number}`}
        </span>
        {chapter.downloaded_at && (
          <span className="text-[10px] text-[#E09F3E] mt-0.5 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E09F3E]" /> Offline Ready
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Download Button */}
        {onDownloadToggle && (
          <button
            onClick={onDownloadToggle}
            className={`p-2 rounded-lg transition-colors ${
              isDownloaded
                ? 'text-[#E09F3E] hover:bg-[#E09F3E]/10'
                : 'text-[#94949D] hover:text-[#E1E1E6] hover:bg-[#2A2A2E]'
            }`}
            title={isDownloaded ? 'Downloaded (click to remove)' : 'Download offline'}
          >
            {isDownloaded ? <FileCheck className="w-4 h-4 text-[#E09F3E]" /> : <Download className="w-4 h-4" />}
          </button>
        )}

        {/* Read / Unread Toggle */}
        <button
          onClick={onToggleRead}
          className="p-2 rounded-lg text-[#94949D] hover:text-[#E09F3E] hover:bg-[#2A2A2E] transition-colors"
          title={chapter.is_read ? 'Mark as unread' : 'Mark as read'}
        >
          {chapter.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#E09F3E]" />}
        </button>
      </div>
    </div>
  );
};
