import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  subLabel?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  label = 'Downloading...',
  subLabel,
}) => {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className="bg-[#161618] border border-[#2A2A2E] rounded-xl p-3.5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between text-xs font-semibold text-[#E1E1E6] mb-2">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E09F3E] animate-ping" />
          {label}
        </span>
        <span className="font-mono text-[#E09F3E] font-bold">
          {current} / {total} ({percentage}%)
        </span>
      </div>

      <div className="w-full bg-[#0A0A0B] rounded-full h-2 overflow-hidden border border-[#2A2A2E]">
        <div
          className="bg-[#E09F3E] shadow-[0_0_8px_rgba(224,159,62,0.4)] h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {subLabel && (
        <p className="text-[11px] text-[#94949D] mt-2 truncate font-mono">
          {subLabel}
        </p>
      )}
    </div>
  );
};
