import React from 'react';
import { FileCheck, Download } from 'lucide-react';

interface DownloadBadgeProps {
  isDownloaded: boolean;
  count?: number;
  className?: string;
}

export const DownloadBadge: React.FC<DownloadBadgeProps> = ({ isDownloaded, count, className = '' }) => {
  if (isDownloaded) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}>
        <FileCheck className="w-3.5 h-3.5" />
        {count !== undefined ? `${count} Downloaded` : 'Downloaded'}
      </span>
    );
  }

  return null;
};
