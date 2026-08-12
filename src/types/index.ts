export interface Novel {
  id: number;
  slug: string;
  title: string;
  cover_url: string;
  author: string;
  status: 'Ongoing' | 'Completed' | string;
  genres: string; // comma-separated or JSON
  synopsis: string;
  source_url: string;
  last_checked_at?: string;
  cached_at?: string;
  in_library?: boolean;
  category_id?: number | null;
  downloaded_count?: number;
  unread_count?: number;
  total_chapters_count?: number;
}

export interface Chapter {
  id: number;
  novel_id: number;
  chapter_number: number;
  title: string;
  source_url: string;
  url?: string;
  content: string | null; // NULL = not downloaded
  downloaded_at?: string | null;
  is_read: boolean;
}

export interface Category {
  id: number;
  name: string;
  sort_order: number;
}

export interface LibraryEntry {
  novel_id: number;
  category_id: number | null;
  added_at: string;
  novel?: Novel;
}

export interface ReadingProgress {
  novel_id: number;
  last_chapter_id: number | null;
  scroll_position: number;
  updated_at: string;
  last_chapter_number?: number;
  last_chapter_title?: string;
}

export interface HistoryItem {
  id: number;
  novel_id: number;
  chapter_id: number;
  opened_at: string;
  novel_title?: string;
  novel_cover?: string;
  chapter_title?: string;
  chapter_number?: number;
}

export interface ScrapedSearchResult {
  slug: string;
  title: string;
  cover_url: string;
  author?: string;
  latest_chapter?: string;
  status?: string;
  source_url: string;
  in_library?: boolean;
}

export interface DownloadQueueItem {
  chapterId: number;
  novelId: number;
  chapterNumber: number;
  chapterTitle: string;
  sourceUrl: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  errorMessage?: string;
}

export type ReaderTheme = 'dark' | 'oled' | 'sepia' | 'cream' | 'light' | 'slate' | 'black';
export type ReaderFont = 'sans' | 'serif' | 'mono' | 'dyslexic' | 'literata';

export interface ReaderPreferences {
  theme: ReaderTheme;
  fontFamily: ReaderFont;
  fontSize: number; // in px e.g. 18
  lineHeight: number; // e.g. 1.6
  textAlign: 'left' | 'justify';
  keepScreenOn: boolean;
  pagePadding: number; // in px e.g. 16
  volumeKeysNavigate: boolean;
}

export interface AppSettings {
  baseDomain: string;
  wifiOnlyDownloads: boolean;
  autoCheckUpdates: boolean;
  downloadConcurrency: number;
}
