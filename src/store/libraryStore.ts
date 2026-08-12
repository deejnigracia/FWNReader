import { create } from 'zustand';
import { Novel, Category } from '../types';
import { getLibraryNovels, getCategories, getNovelById } from '../services/novelsRepo';
import { getUnreadCount, getDownloadedCount, getChaptersForNovel } from '../services/chaptersRepo';

export type LibrarySortOption = 'alphabetical' | 'unread_count' | 'downloaded_count' | 'latest_added';

interface LibraryState {
  libraryNovels: Novel[];
  categories: Category[];
  selectedCategoryId: number | null; // null = All
  searchQuery: string;
  sortBy: LibrarySortOption;
  isLoading: boolean;
  
  loadLibrary: () => Promise<void>;
  setSelectedCategoryId: (catId: number | null) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: LibrarySortOption) => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  libraryNovels: [],
  categories: [],
  selectedCategoryId: null,
  searchQuery: '',
  sortBy: 'latest_added',
  isLoading: false,

  loadLibrary: async () => {
    set({ isLoading: true });
    try {
      const rawLib = await getLibraryNovels();
      const categories = await getCategories();

      const enriched: Novel[] = [];
      for (const item of rawLib) {
        const novel = await getNovelById((item as any).novel_id || item.id);
        if (novel) {
          const unread = await getUnreadCount(novel.id);
          const downloaded = await getDownloadedCount(novel.id);
          const chapters = await getChaptersForNovel(novel.id);

          enriched.push({
            ...novel,
            category_id: (item as any).category_id,
            unread_count: unread,
            downloaded_count: downloaded,
            total_chapters_count: chapters.length,
          });
        }
      }

      set({ libraryNovels: enriched, categories, isLoading: false });
    } catch (e) {
      console.error('Failed to load library:', e);
      set({ isLoading: false });
    }
  },

  setSelectedCategoryId: (catId) => set({ selectedCategoryId: catId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sort) => set({ sortBy: sort }),
}));
