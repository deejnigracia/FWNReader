import React, { useState, useEffect } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { BrowsePage } from './pages/Browse/BrowsePage';
import { SearchPage } from './pages/Search/SearchPage';
import { NovelDetailPage } from './pages/NovelDetail/NovelDetailPage';
import { ReaderPage } from './pages/Reader/ReaderPage';
import { LibraryPage } from './pages/Library/LibraryPage';
import { UpdatesPage } from './pages/Updates/UpdatesPage';
import { HistoryPage } from './pages/History/HistoryPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { checkForLibraryUpdates } from './services/updateChecker';

type ViewMode = 'tab' | 'search' | 'novel_detail' | 'reader';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [viewMode, setViewMode] = useState<ViewMode>('tab');

  // Selected state for sub-views
  const [selectedNovelSlug, setSelectedNovelSlug] = useState<string | null>(null);
  const [readerNovelId, setReaderNovelId] = useState<number | null>(null);
  const [readerChapterId, setReaderChapterId] = useState<number | null>(null);

  // Badge count for unread updates
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Check for updates periodically
    const checkUpdates = async () => {
      try {
        const items = await checkForLibraryUpdates();
        const totalNew = items.reduce((sum, item) => sum + item.newChapters.length, 0);
        setUnreadCount(totalNew);
      } catch (e) {
        console.error('Update badge check error:', e);
      }
    };

    checkUpdates();
    const interval = setInterval(checkUpdates, 15 * 60 * 1000); // 15 mins
    return () => clearInterval(interval);
  }, []);

  const handleSelectNovel = (slug: string) => {
    setSelectedNovelSlug(slug);
    setViewMode('novel_detail');
  };

  const handleReadChapter = (novelId: number, chapterId: number) => {
    setReaderNovelId(novelId);
    setReaderChapterId(chapterId);
    setViewMode('reader');
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setViewMode('tab');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E1E1E6] font-sans selection:bg-[#E09F3E] selection:text-black">
      {/* Main View Renderer */}
      {viewMode === 'search' && (
        <SearchPage
          onBack={() => setViewMode('tab')}
          onSelectNovel={handleSelectNovel}
        />
      )}

      {viewMode === 'novel_detail' && selectedNovelSlug && (
        <NovelDetailPage
          slug={selectedNovelSlug}
          onBack={() => setViewMode('tab')}
          onReadChapter={handleReadChapter}
        />
      )}

      {viewMode === 'reader' && readerNovelId && readerChapterId && (
        <ReaderPage
          novelId={readerNovelId}
          initialChapterId={readerChapterId}
          onBack={() => setViewMode('novel_detail')}
        />
      )}

      {viewMode === 'tab' && (
        <>
          {activeTab === 'browse' && (
            <BrowsePage
              onSelectNovel={handleSelectNovel}
              onOpenSearch={() => setViewMode('search')}
            />
          )}

          {activeTab === 'library' && (
            <LibraryPage
              onSelectNovel={handleSelectNovel}
              onGoToBrowse={() => setActiveTab('browse')}
            />
          )}

          {activeTab === 'updates' && (
            <UpdatesPage onReadChapter={handleReadChapter} />
          )}

          {activeTab === 'history' && (
            <HistoryPage
              onReadChapter={handleReadChapter}
              onGoToBrowse={() => setActiveTab('browse')}
            />
          )}

          {activeTab === 'settings' && <SettingsPage />}

          {/* Bottom Fixed Navigation Bar */}
          <Navbar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            unreadUpdatesCount={unreadCount}
          />
        </>
      )}
    </div>
  );
}
