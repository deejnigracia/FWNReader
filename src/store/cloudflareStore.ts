import { create } from 'zustand';

export interface CloudflareStats {
  totalRequests: number;
  blockedRequests: number;
  bypassedRequests: number;
  fallbackCount: number;
  lastBlockedTimestamp: string | null;
  shieldStatus: 'Active Shield Detected' | 'Idle' | 'Bypassing';
  activeCountermeasures: {
    headerRotation: boolean;
    mirrorBridge: boolean;
    emulateChrome120: boolean;
    autoFallback: boolean;
  };
}

interface CloudflareStoreState extends CloudflareStats {
  isTesting: boolean;
  testResult: {
    success: boolean;
    statusCode: number;
    bypassed: boolean;
    message: string;
    timestamp: string;
  } | null;
  fetchStats: () => Promise<void>;
  toggleCountermeasure: (key: keyof CloudflareStats['activeCountermeasures']) => Promise<void>;
  resetCounters: () => Promise<void>;
  runDiagnostic: (targetUrl?: string) => Promise<void>;
  incrementFallback: () => void;
}

export const useCloudflareStore = create<CloudflareStoreState>((set, get) => ({
  totalRequests: 0,
  blockedRequests: 0,
  bypassedRequests: 0,
  fallbackCount: 0,
  lastBlockedTimestamp: null,
  shieldStatus: 'Idle',
  activeCountermeasures: {
    headerRotation: true,
    mirrorBridge: true,
    emulateChrome120: true,
    autoFallback: true,
  },
  isTesting: false,
  testResult: null,

  fetchStats: async () => {
    try {
      const res = await fetch('/api/cloudflare-stats');
      if (res.ok) {
        const data = await res.json();
        set({
          totalRequests: data.totalRequests ?? get().totalRequests,
          blockedRequests: data.blockedRequests ?? get().blockedRequests,
          bypassedRequests: data.bypassedRequests ?? get().bypassedRequests,
          lastBlockedTimestamp: data.lastBlockedTimestamp ?? get().lastBlockedTimestamp,
          shieldStatus: data.shieldStatus ?? get().shieldStatus,
          activeCountermeasures: data.activeCountermeasures || get().activeCountermeasures,
        });
      }
    } catch (e) {
      // Ignore background sync errors
    }
  },

  toggleCountermeasure: async (key) => {
    const current = get().activeCountermeasures;
    const updated = { ...current, [key]: !current[key] };
    set({ activeCountermeasures: updated });

    try {
      await fetch('/api/cloudflare-countermeasures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.warn('Failed to update countermeasures on server:', e);
    }
  },

  resetCounters: async () => {
    set({
      blockedRequests: 0,
      bypassedRequests: 0,
      totalRequests: 0,
      fallbackCount: 0,
      lastBlockedTimestamp: null,
      shieldStatus: 'Idle',
    });
    try {
      await fetch('/api/cloudflare-countermeasures/reset', { method: 'POST' });
    } catch (e) {
      console.warn('Failed to reset server counters:', e);
    }
  },

  incrementFallback: () => {
    set((state) => ({ fallbackCount: state.fallbackCount + 1 }));
  },

  runDiagnostic: async (targetUrl = 'https://libread.com') => {
    set({ isTesting: true, testResult: null });
    try {
      const startTime = Date.now();
      const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();
      
      if (isNative) {
        const { fetchHtml, isCloudflareChallenge } = await import('../services/httpClient');
        const testUrl = targetUrl.includes('freewebnovel.com') ? 'https://libread.com/sort/most-popular' : targetUrl;
        const html = await fetchHtml(testUrl);
        const duration = Date.now() - startTime;
        const isBlocked = isCloudflareChallenge(html);

        set({
          testResult: {
            success: !isBlocked && html.length > 100,
            statusCode: isBlocked ? 403 : 200,
            bypassed: true,
            message: !isBlocked
              ? `Success (${duration}ms) - Native Mirror Connection Active (${html.length} bytes)`
              : `Cloudflare Challenge Intercepted (${duration}ms) - Switch domain mirror to LibRead in settings.`,
            timestamp: new Date().toLocaleTimeString(),
          },
        });
        return;
      }

      const res = await fetch(`/api/proxy?url=${encodeURIComponent(targetUrl)}&diagnostic=true`);
      const isBypassed = res.headers.get('X-Cloudflare-Bypassed') === 'true';
      const isShielded = res.headers.get('X-Cloudflare-Shield') === 'intercepted';
      const text = await res.text();
      const duration = Date.now() - startTime;

      let msg = '';
      if (res.ok && !isShielded) {
        msg = `Success (${duration}ms) - Live response received (${text.length} bytes)`;
      } else if (isBypassed) {
        msg = `Cloudflare Countermeasure Success (${duration}ms) - Bypassed via Proxy Mirror Bridge!`;
      } else {
        msg = `Cloudflare Shield Active (403 Challenge Intercepted) (${duration}ms) - Countermeasure engaged fallback.`;
      }

      set({
        testResult: {
          success: res.ok && !isShielded,
          statusCode: res.status,
          bypassed: isBypassed,
          message: msg,
          timestamp: new Date().toLocaleTimeString(),
        },
      });
      await get().fetchStats();
    } catch (err: any) {
      set({
        testResult: {
          success: false,
          statusCode: 500,
          bypassed: false,
          message: `Network/Proxy Diagnostic Error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      });
    } finally {
      set({ isTesting: false });
    }
  },
}));
