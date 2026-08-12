import { Capacitor, CapacitorHttp } from '@capacitor/core';

export function isCloudflareChallenge(html: string): boolean {
  if (!html) return true;
  return (
    html.includes('Just a moment...') ||
    html.includes('cf-mitigated') ||
    html.includes('Attention Required! | Cloudflare') ||
    html.includes('_cf_chl_opt') ||
    html.includes('challenge-running') ||
    html.includes('challenge-form')
  );
}

export async function fetchHtml(url: string): Promise<string> {
  const isNative = Capacitor.isNativePlatform();

  // Primary attempt
  let html = await doFetch(url, isNative);

  // If blocked by Cloudflare or invalid response, attempt automatic failover mirror
  if (isCloudflareChallenge(html) || html.length < 100) {
    console.warn(`Direct fetch for ${url} returned Cloudflare challenge or empty response. Attempting mirror failover...`);

    let failoverUrl = url;
    if (url.includes('freewebnovel.com')) {
      failoverUrl = url.replace('https://freewebnovel.com', 'https://libread.com')
        .replace('/most-popular-novel/', '/sort/most-popular')
        .replace('/latest-release-novel/', '/sort/latest-release')
        .replace('/completed-novel/', '/sort/completed-novels');
    } else if (url.includes('libread.com')) {
      failoverUrl = url.replace('https://libread.com', 'https://freewebnovel.com');
    }

    try {
      const failoverHtml = await doFetch(failoverUrl, isNative);
      if (!isCloudflareChallenge(failoverHtml) && failoverHtml.length > 100) {
        return failoverHtml;
      }
    } catch (mErr) {
      console.warn('Failover fetch failed:', mErr);
    }
  }

  if (isCloudflareChallenge(html)) {
    throw new Error('Cloudflare Challenge intercepted request.');
  }

  return html;
}

async function doFetch(url: string, isNative: boolean): Promise<string> {
  if (isNative) {
    try {
      const response = await CapacitorHttp.get({
        url,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        responseType: 'text',
      });

      if (response.status >= 200 && response.status < 300) {
        return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
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

    return '';
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

