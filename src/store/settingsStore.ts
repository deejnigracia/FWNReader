import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings } from '../types';

interface SettingsState extends AppSettings {
  setBaseDomain: (domain: string) => void;
  setWifiOnlyDownloads: (wifiOnly: boolean) => void;
  setAutoCheckUpdates: (autoCheck: boolean) => void;
  setDownloadConcurrency: (concurrency: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      baseDomain: 'https://libread.com',
      wifiOnlyDownloads: false,
      autoCheckUpdates: true,
      downloadConcurrency: 3,

      setBaseDomain: (baseDomain) => set({ baseDomain: baseDomain.replace(/\/$/, '') }),
      setWifiOnlyDownloads: (wifiOnlyDownloads) => set({ wifiOnlyDownloads }),
      setAutoCheckUpdates: (autoCheckUpdates) => set({ autoCheckUpdates }),
      setDownloadConcurrency: (downloadConcurrency) => set({ downloadConcurrency }),
    }),
    {
      name: 'freewebnovel_app_settings',
    }
  )
);
