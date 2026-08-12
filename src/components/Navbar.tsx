import React from 'react';
import { Compass, BookOpen, Bell, Clock, Settings } from 'lucide-react';

export type TabType = 'browse' | 'library' | 'updates' | 'history' | 'settings';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  unreadUpdatesCount?: number;
}

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  unreadUpdatesCount = 0,
}) => {
  const tabs: TabItem[] = [
    { id: 'browse', label: 'Browse', icon: Compass },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'updates', label: 'Updates', icon: Bell, badge: unreadUpdatesCount },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#111113]/95 backdrop-blur-md border-t border-[#2A2A2E] px-2 py-2 max-w-md mx-auto">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as TabType)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-[#E09F3E] font-bold'
                  : 'text-[#94949D] hover:text-[#E1E1E6]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-[#E09F3E]' : ''}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#E09F3E] text-black text-[9px] font-black px-1.5 rounded-full animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight uppercase font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
