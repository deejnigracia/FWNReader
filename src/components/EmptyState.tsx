import React from 'react';
import { BookX, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = BookX,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#161618] border border-[#2A2A2E] flex items-center justify-center text-[#94949D] mb-4 shadow-inner">
        <Icon className="w-8 h-8 text-[#E09F3E]" />
      </div>

      <h3 className="text-base font-semibold text-[#E1E1E6] mb-1">
        {title}
      </h3>

      <p className="text-xs text-[#94949D] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2.5 bg-[#E09F3E] hover:bg-[#c98e37] text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#E09F3E]/10 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
