import { Capacitor } from '@capacitor/core';

export async function fetchHtml(url: string): Promise<string> {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      const capHttp = (Capacitor as any).Http || (window as any).Capacitor?.Plugins?.CapacitorHttp;
      if (capHttp) {
        const response = await capHttp.get({
          url,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          },
        });
        if (response.status >= 200 && response.status < 300) {
          return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        }
      }
    } catch (e: any) {
      console.warn('CapacitorHttp failed, trying fallback proxy:', e);
    }
  }

  // Web mode fallback using server proxy
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl, {
    headers: {
      'Accept': 'text/html',
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return await res.text();
}
