import { Capacitor, CapacitorHttp } from '@capacitor/core';

export async function fetchHtml(url: string): Promise<string> {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      const response = await CapacitorHttp.get({
        url,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        responseType: 'text',
      });

      if (response.status >= 200 && response.status < 300) {
        const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        if (html && html.length > 100) {
          return html;
        }
      } else {
        console.warn(`CapacitorHttp returned status ${response.status} for ${url}`);
      }
    } catch (e: any) {
      console.warn('CapacitorHttp failed:', e);
    }

    // Secondary attempt on native: direct fetch
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'text/html' },
      });
      if (res.ok) {
        return await res.text();
      }
    } catch (e) {
      console.warn('Native direct fetch failed:', e);
    }

    throw new Error(`Failed to fetch ${url} on native device.`);
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
