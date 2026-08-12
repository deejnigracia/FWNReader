import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ReaderPreferences, ReaderTheme, ReaderFont } from '../types';

interface ReaderPrefsState extends ReaderPreferences {
  setTheme: (theme: ReaderTheme) => void;
  setFontFamily: (font: ReaderFont) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setTextAlign: (align: 'left' | 'justify') => void;
  setKeepScreenOn: (keepOn: boolean) => void;
  setVolumeKeysNavigate: (nav: boolean) => void;
}

export const useReaderPrefsStore = create<ReaderPrefsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      fontFamily: 'sans',
      fontSize: 18,
      lineHeight: 1.6,
      textAlign: 'left',
      keepScreenOn: true,
      pagePadding: 20,
      volumeKeysNavigate: false,

      setTheme: (theme) => set({ theme }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setFontSize: (fontSize) => set({ fontSize: Math.max(12, Math.min(36, fontSize)) }),
      setLineHeight: (lineHeight) => set({ lineHeight: Math.max(1.2, Math.min(2.5, lineHeight)) }),
      setTextAlign: (textAlign) => set({ textAlign }),
      setKeepScreenOn: (keepScreenOn) => set({ keepScreenOn }),
      setVolumeKeysNavigate: (volumeKeysNavigate) => set({ volumeKeysNavigate }),
    }),
    {
      name: 'freewebnovel_reader_preferences',
    }
  )
);
