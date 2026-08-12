import { fetchHtml } from './httpClient';
import { parseSearch, parseNovelPage, parseChapterContent } from './parser';
import { ScrapedSearchResult, Novel, Chapter } from '../types';
import { useCloudflareStore } from '../store/cloudflareStore';

const DEFAULT_BASE_DOMAIN = 'https://libread.com';

export async function searchNovels(query: string, baseDomain: string = DEFAULT_BASE_DOMAIN): Promise<ScrapedSearchResult[]> {
  if (!query.trim()) return getBrowseNovels('most-popular', 1, baseDomain);

  try {
    const searchUrl = `${baseDomain.replace(/\/$/, '')}/search?searchkey=${encodeURIComponent(query)}`;
    const html = await fetchHtml(searchUrl);
    const parsed = parseSearch(html, baseDomain);

    if (parsed.length > 0) {
      useCloudflareStore.getState().fetchStats();
      return parsed;
    }
  } catch (err) {
    console.warn('Live search failed:', err);
  }

  return [];
}

export async function getBrowseNovels(category: string = 'most-popular', page: number = 1, baseDomain: string = DEFAULT_BASE_DOMAIN): Promise<ScrapedSearchResult[]> {
  try {
    let url = `${baseDomain.replace(/\/$/, '')}/most-popular-novel/`;
    if (baseDomain.includes('libread')) {
      url = `${baseDomain.replace(/\/$/, '')}/sort/most-popular/`;
      if (category === 'latest-release') url = `${baseDomain.replace(/\/$/, '')}/sort/latest-release/`;
      if (category === 'completed') url = `${baseDomain.replace(/\/$/, '')}/sort/completed-novels/`;
    } else {
      if (category === 'latest-release') url = `${baseDomain.replace(/\/$/, '')}/latest-release-novel/`;
      if (category === 'completed') url = `${baseDomain.replace(/\/$/, '')}/completed-novel/`;
    }

    if (category.startsWith('genre-')) {
      const g = category.replace('genre-', '');
      url = `${baseDomain.replace(/\/$/, '')}/genre/${g}/`;
    }
    if (page > 1) {
      url += `${page}.html`;
    }

    const html = await fetchHtml(url);
    const parsed = parseSearch(html, baseDomain);
    if (parsed.length > 0) {
      useCloudflareStore.getState().fetchStats();
      return parsed;
    }
  } catch (err) {
    console.warn('Live browse fetch failed:', err);
    useCloudflareStore.getState().fetchStats();
  }

  return [];
}

export async function getNovelDetail(slug: string, baseDomain: string = DEFAULT_BASE_DOMAIN): Promise<{ novel: Partial<Novel>; chapters: Partial<Chapter>[] }> {
  let url = slug.startsWith('http') ? slug : `${baseDomain.replace(/\/$/, '')}/novel/${slug}.html`;
  if (!slug.startsWith('http')) {
    if (baseDomain.includes('libread') || slug.includes('libread')) {
      const cleanSlug = slug.replace(/^\/libread\//, '').replace(/^libread\//, '');
      url = `${baseDomain.replace(/\/$/, '')}/libread/${cleanSlug}`;
    }
  }

  const html = await fetchHtml(url);
  const parsed = parseNovelPage(html, url, slug, baseDomain);

  if (parsed.novel.title && parsed.chapters.length > 0) {
    useCloudflareStore.getState().fetchStats();
    return parsed;
  }

  throw new Error(`Failed to load novel details for ${slug}`);
}

export async function getChapterContent(chapterUrl: string): Promise<{ content: string; title?: string }> {
  const html = await fetchHtml(chapterUrl);
  const parsed = parseChapterContent(html);
  if (parsed.content && parsed.content.length > 50) {
    return { content: parsed.content, title: parsed.title };
  }

  throw new Error(`Unable to parse chapter content from ${chapterUrl}`);
}
