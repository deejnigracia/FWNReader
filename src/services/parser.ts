import { ScrapedSearchResult, Novel, Chapter } from '../types';

export function normalizeCoverUrl(rawUrl: string, baseDomain: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  if (url.startsWith('//')) {
    url = `https:${url}`;
  } else if (!url.startsWith('http')) {
    const cleanDomain = baseDomain.replace(/\/$/, '');
    url = `${cleanDomain}/${url.replace(/^\//, '')}`;
  }

  // Redirect freewebnovel image CDN requests to unblocked libread mirror CDN
  if (url.includes('freewebnovel.com/files/article/')) {
    url = url.replace('freewebnovel.com', 'libread.com');
  }

  return url;
}

export function parseSearch(html: string, baseDomain: string): ScrapedSearchResult[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const results: ScrapedSearchResult[] = [];
  const seenSlugs = new Set<string>();

  // Try standard freewebnovel search list items (.li-row, .con, .col-content .item)
  const items = doc.querySelectorAll('.li-row, .col-content .item, .col-content .li, .search-result .item');

  items.forEach((item) => {
    const titleEl = item.querySelector('.tit a, .title a, h3 a, h2 a');
    if (!titleEl) return;

    const title = titleEl.textContent?.trim() || '';
    let href = titleEl.getAttribute('href') || '';
    if (href && !href.startsWith('http')) {
      href = `${baseDomain.replace(/\/$/, '')}/${href.replace(/^\//, '')}`;
    }

    // Extract slug from href e.g. /novel/lord-of-the-mysteries.html or /libread/shadow-slave-227142
    const slugMatch = href.match(/\/novel\/([^/]+)/) || href.match(/\/libread\/([^/]+)/) || href.match(/\/([^/]+)\.html/);
    const rawSlug = slugMatch ? slugMatch[1].replace('.html', '') : title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const slug = rawSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (seenSlugs.has(slug)) return;
    seenSlugs.add(slug);

    const imgEl = item.querySelector('img');
    const rawCover = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-original') || imgEl?.getAttribute('data-lazy-src') || '';
    
    let coverUrl = normalizeCoverUrl(rawCover, baseDomain);

    const authorEl = item.querySelector('.author, .item-author, .s1, .s2');
    const author = authorEl?.textContent?.replace(/Author[:\s]*/i, '').trim() || 'Unknown';

    const latestEl = item.querySelector('.chapter, .latest, .s3');
    const latestChapter = latestEl?.textContent?.trim() || '';

    const statusEl = item.querySelector('.status, .state');
    const status = statusEl?.textContent?.trim() || 'Ongoing';

    if (title && href) {
      results.push({
        slug,
        title,
        cover_url: coverUrl || `https://picsum.photos/seed/${slug}/300/400`,
        author,
        latest_chapter: latestChapter,
        status,
        source_url: href,
      });
    }
  });

  return results;
}

export function parseNovelPage(html: string, url: string, slug: string, baseDomain: string): { novel: Partial<Novel>; chapters: Partial<Chapter>[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Title
  const titleEl = doc.querySelector('.m-desc .tit, h1.tit, h1.title, .novel-title');
  const title = titleEl?.textContent?.trim() || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Cover
  const metaOgImg = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                    doc.querySelector('meta[name="image"]')?.getAttribute('content');

  const imgEl = doc.querySelector('.m-book1 .pic img, .m-desc .pic img, .pic img, .novel-cover img, .col-left img');
  const rawCover = metaOgImg || imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-original') || '';

  let coverUrl = normalizeCoverUrl(rawCover, baseDomain);
  if (!coverUrl) {
    coverUrl = `https://picsum.photos/seed/${slug}/300/400`;
  }

  // Author & Status & Genres
  let author = 'Unknown Author';
  let status = 'Ongoing';
  const genres: string[] = [];

  const metaItems = doc.querySelectorAll('.m-desc .item, .novel-meta div, .col-content .item');
  metaItems.forEach((item) => {
    const text = item.textContent || '';
    if (text.toLowerCase().includes('author')) {
      author = text.replace(/author[:\s]*/i, '').trim();
    } else if (text.toLowerCase().includes('status')) {
      status = text.replace(/status[:\s]*/i, '').trim();
    } else if (text.toLowerCase().includes('genre')) {
      const genreLinks = item.querySelectorAll('a');
      genreLinks.forEach(g => {
        const val = g.textContent?.trim();
        if (val) genres.push(val);
      });
    }
  });

  if (genres.length === 0) {
    doc.querySelectorAll('.m-desc .genre a, .tags a, .genres a').forEach(g => {
      const val = g.textContent?.trim();
      if (val && !genres.includes(val)) genres.push(val);
    });
  }

  // Synopsis
  const synopsisEl = doc.querySelector('.m-desc .txt, .synopsis, .description, .inner');
  const synopsis = synopsisEl?.textContent?.replace(/synopsis[:\s]*/i, '').trim() || 'No detailed synopsis available.';

  // Chapters
  const chapters: Partial<Chapter>[] = [];
  const chapterLinks = doc.querySelectorAll('.m-newest2 ul li a, .chapter-list ul li a, #news-chapter-list a, .list-chapter a');

  let chapterNum = 1;
  chapterLinks.forEach((link) => {
    const chapTitle = link.textContent?.trim() || `Chapter ${chapterNum}`;
    let href = link.getAttribute('href') || '';
    if (href && !href.startsWith('http')) {
      href = `${baseDomain.replace(/\/$/, '')}/${href.replace(/^\//, '')}`;
    }

    // Try extracting explicit chapter number from title or url
    const numMatch = chapTitle.match(/chapter\s*(\d+(\.\d+)?)/i) || href.match(/chapter-(\d+(\.\d+)?)/i);
    const parsedNum = numMatch ? parseFloat(numMatch[1]) : chapterNum;

    if (href) {
      chapters.push({
        chapter_number: parsedNum,
        title: chapTitle,
        source_url: href,
        content: null,
        is_read: false,
      });
      chapterNum++;
    }
  });

  return {
    novel: {
      slug,
      title,
      cover_url: coverUrl,
      author,
      status: status.toLowerCase().includes('completed') ? 'Completed' : 'Ongoing',
      genres: genres.join(', ') || 'Fantasy, Action, Adventure',
      synopsis,
      source_url: url,
    },
    chapters,
  };
}

export function parseChapterContent(html: string): { content: string; prevUrl?: string; nextUrl?: string; title?: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Find content container (.txt #content, .txt-content, .reader-content, #chapter-content)
  const contentEl = doc.querySelector('#content, .txt #content, .txt-content, .m-read .txt, .chapter-entity, .txt, .read-content, .article-content, div[class*="content"], div[id*="content"], .reading-content');

  let paragraphs: string[] = [];

  if (contentEl) {
    // Remove unwanted elements like script, iframe, ads, header buttons
    contentEl.querySelectorAll('script, style, ins, .ads, .ad, .chapter-nav, .nav-btn, .a-btn').forEach(el => el.remove());

    const pTags = contentEl.querySelectorAll('p');
    if (pTags.length > 0) {
      pTags.forEach(p => {
        const text = p.textContent?.trim();
        if (text && !text.toLowerCase().includes('freewebnovel.com') && !text.toLowerCase().includes('libread.com') && text.length > 2) {
          paragraphs.push(text);
        }
      });
    }

    if (paragraphs.length === 0) {
      // Split by innerHTML <br> tags or innerText lines
      const htmlContent = contentEl.innerHTML.replace(/<br\s*\/?>/gi, '\n');
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const rawText = tempDiv.textContent || '';
      paragraphs = rawText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 2 && !s.toLowerCase().includes('freewebnovel.com') && !s.toLowerCase().includes('libread.com'));
    }
  }

  // Extract title
  const titleEl = doc.querySelector('h1, h2, .chapter-title, .tit, .title');
  const title = titleEl?.textContent?.trim() || '';

  // Extract Prev / Next chapter URLs
  let prevUrl: string | undefined;
  let nextUrl: string | undefined;

  const navLinks = doc.querySelectorAll('a');
  navLinks.forEach(link => {
    const text = link.textContent?.toLowerCase() || '';
    const href = link.getAttribute('href');
    if (href) {
      if (text.includes('prev') || text.includes('previous')) {
        prevUrl = href;
      } else if (text.includes('next')) {
        nextUrl = href;
      }
    }
  });

  return {
    content: paragraphs.join('\n\n'),
    title,
    prevUrl,
    nextUrl,
  };
}
