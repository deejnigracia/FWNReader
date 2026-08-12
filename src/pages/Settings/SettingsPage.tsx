import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useReaderPrefsStore } from '../../store/readerPrefsStore';
import { CloudflareCounter } from '../../components/CloudflareCounter';
import { Settings, Globe, Download, Database, Moon, ShieldCheck, AlertTriangle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { baseDomain, downloadConcurrency, setBaseDomain, setDownloadConcurrency } = useSettingsStore();
  const { fontSize, fontFamily, theme, setFontSize, setFontFamily, setTheme } = useReaderPrefsStore();

  const [domainInput, setDomainInput] = useState(baseDomain);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveDomain = () => {
    setBaseDomain(domainInput.trim() || 'freewebnovel.com');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleClearCache = async () => {
    if (confirm('Clear local app cache and storage? Saved library metadata will be preserved.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <header className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-[#E1E1E6] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#E09F3E]" />
          App Settings
        </h1>
        <p className="text-[11px] text-[#94949D] mt-0.5">
          Source configuration, reader preferences, and storage management
        </p>
      </header>

      <div className="space-y-4">
        {/* Cloudflare Shield Counter & Countermeasures */}
        <CloudflareCounter />

        {/* Source Configuration */}
        <div className="bg-[#161618] border border-[#2A2A2E] rounded-2xl p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#E09F3E] flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4" />
            Novel Source & Proxy
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#94949D] block mb-1.5 font-medium">
                Preset Mirror Sources
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setDomainInput('https://libread.com');
                    setBaseDomain('https://libread.com');
                    setIsSaved(true);
                    setTimeout(() => setIsSaved(false), 2000);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium text-left transition-all ${
                    baseDomain.includes('libread')
                      ? 'border-[#E09F3E] bg-[#E09F3E]/10 text-[#E09F3E]'
                      : 'border-[#2A2A2E] bg-[#0A0A0B] text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    LibRead Mirror
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md font-normal">Fast</span>
                  </div>
                  <div className="text-[10px] opacity-70">Unblocked direct mirror</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDomainInput('https://freewebnovel.com');
                    setBaseDomain('https://freewebnovel.com');
                    setIsSaved(true);
                    setTimeout(() => setIsSaved(false), 2000);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium text-left transition-all ${
                    baseDomain.includes('freewebnovel.com')
                      ? 'border-[#E09F3E] bg-[#E09F3E]/10 text-[#E09F3E]'
                      : 'border-[#2A2A2E] bg-[#0A0A0B] text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold">FreeWebNovel</div>
                  <div className="text-[10px] opacity-70">Original site</div>
                </button>
              </div>

              <label className="text-xs text-[#94949D] block mb-1 font-medium">
                Custom Domain
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="flex-1 bg-[#0A0A0B] border border-[#2A2A2E] text-xs text-[#E1E1E6] px-3 py-2 rounded-xl focus:outline-hidden focus:border-[#E09F3E]"
                />
                <button
                  onClick={handleSaveDomain}
                  className="px-4 py-2 bg-[#E09F3E] text-black font-bold text-xs rounded-xl hover:bg-[#c98e37]"
                >
                  Save
                </button>
              </div>
              {isSaved && (
                <p className="text-[10px] text-emerald-400 mt-1 font-mono">Domain updated successfully!</p>
              )}
            </div>
          </div>
        </div>

        {/* Downloader Settings */}
        <div className="bg-[#161618] border border-[#2A2A2E] rounded-2xl p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#E09F3E] flex items-center gap-2 mb-3">
            <Download className="w-4 h-4" />
            Download Engine
          </h2>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-[#94949D] font-medium">
                Parallel Downloader Threads
              </label>
              <span className="text-xs font-mono font-bold text-[#E09F3E]">
                {downloadConcurrency}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={downloadConcurrency}
              onChange={(e) => setDownloadConcurrency(Number(e.target.value))}
              className="w-full accent-[#E09F3E]"
            />
            <p className="text-[10px] text-[#94949D] mt-1">
              Higher values speed up batch chapter downloads for offline reading.
            </p>
          </div>
        </div>

        {/* Default Reader Prefs */}
        <div className="bg-[#161618] border border-[#2A2A2E] rounded-2xl p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#E09F3E] flex items-center gap-2 mb-3">
            <Moon className="w-4 h-4" />
            Default Reader Appearance
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#94949D] uppercase block mb-1 font-bold">
                Default Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="w-full bg-[#0A0A0B] border border-[#2A2A2E] text-xs text-[#E1E1E6] p-2 rounded-xl focus:outline-hidden focus:border-[#E09F3E]"
              >
                <option value="dark">Elegant Dark</option>
                <option value="sepia">Vintage Sepia</option>
                <option value="light">Pure Light</option>
                <option value="black">Amoled Black</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#94949D] uppercase block mb-1 font-bold">
                Default Font
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value as any)}
                className="w-full bg-[#0A0A0B] border border-[#2A2A2E] text-xs text-[#E1E1E6] p-2 rounded-xl focus:outline-hidden focus:border-[#E09F3E]"
              >
                <option value="sans">System Sans</option>
                <option value="serif">Literary Serif</option>
                <option value="mono">Monospace</option>
              </select>
            </div>
          </div>
        </div>

        {/* Database & System Info */}
        <div className="bg-[#161618] border border-[#2A2A2E] rounded-2xl p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#E09F3E] flex items-center gap-2 mb-3">
            <Database className="w-4 h-4" />
            Storage & System
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#2A2A2E]">
              <span className="text-[#94949D]">Database Engine</span>
              <span className="font-mono text-[#E1E1E6]">SQLite / LocalStorage</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#2A2A2E]">
              <span className="text-[#94949D]">App Platform</span>
              <span className="font-mono text-[#E09F3E]">Capacitor + React</span>
            </div>
          </div>

          <button
            onClick={handleClearCache}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs rounded-xl hover:bg-red-500/20 transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            Reset Local Storage Cache
          </button>
        </div>
      </div>
    </div>
  );
};
