import React from 'react';
import { Novel, ScrapedSearchResult } from '../types';
import { Bookmark, BookOpen, Download } from 'lucide-react';

interface NovelCardProps {
  novel: Novel | ScrapedSearchResult;
  onClick: () => void;
  inLibrary?: boolean;
  unreadCount?: number;
  downloadedCount?: number;
  layout?: 'grid' | 'list';
}

export const NovelCard: React.FC<NovelCardProps> = ({
  novel,
  onClick,
  inLibrary = false,
  unreadCount,
  downloadedCount,
  layout = 'grid',
}) => {
  const isGrid = layout === 'grid';

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-xl overflow-hidden bg-[#161618] border border-[#2A2A2E] hover:border-[#E09F3E]/60 transition-all duration-200 shadow-md hover:shadow-lg ${
        isGrid ? 'flex flex-col h-full' : 'flex items-center gap-3.5 p-2.5'
      }`}
    >
      {/* Cover Image Container */}
      <div className={`relative overflow-hidden bg-[#0A0A0B] ${isGrid ? 'aspect-[3/4] w-full' : 'w-20 h-28 shrink-0 rounded-lg'}`}>
        <img
          src={novel.cover_url}
          alt={novel.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${novel.slug}/300/400`;
          }}
        />

        {/* Library Badge */}
        {(inLibrary || (novel as Novel).in_library) && (
          <div className="absolute top-2 right-2 bg-[#E09F3E] text-black p-1 rounded-md shadow-lg border border-[#E09F3E]/40 font-bold">
            <Bookmark className="w-3.5 h-3.5 fill-current" />
          </div>
        )}

        {/* Unread Count Badge */}
        {unreadCount !== undefined && unreadCount > 0 && (
          <div className="absolute bottom-2 left-2 bg-[#111113]/90 text-[#E09F3E] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#E09F3E]/30 backdrop-blur-xs">
            {unreadCount} unread
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className={`flex flex-col justify-between ${isGrid ? 'p-3 flex-1' : 'flex-1 min-w-0'}`}>
        <div>
          <h3 className="text-sm font-semibold text-[#E1E1E6] line-clamp-2 leading-snug group-hover:text-[#E09F3E] transition-colors">
            {novel.title}
          </h3>

          <p className="text-xs text-[#94949D] mt-1 line-clamp-1 italic">
            {novel.author || 'Unknown Author'}
          </p>

          {/* Genres or Latest chapter */}
          {'genres' in novel && novel.genres && (
            <p className="text-[11px] text-[#94949D]/80 mt-1 line-clamp-1">
              {novel.genres}
            </p>
          )}

          {'latest_chapter' in novel && novel.latest_chapter && (
            <p className="text-[11px] text-[#94949D] mt-1.5 line-clamp-1 font-mono">
              {novel.latest_chapter}
            </p>
          )}
        </div>

        {/* Bottom Metadata */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#2A2A2E] text-[11px] text-[#94949D]">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase ${
              novel.status?.toLowerCase().includes('completed')
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-[#E09F3E]/10 text-[#E09F3E] border border-[#E09F3E]/20'
            }`}
          >
            {novel.status || 'Ongoing'}
          </span>

          {downloadedCount !== undefined && downloadedCount > 0 && (
            <span className="flex items-center gap-1 text-[#94949D]">
              <Download className="w-3 h-3 text-[#E09F3E]" />
              {downloadedCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
