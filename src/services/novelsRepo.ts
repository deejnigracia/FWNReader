import { dbManager } from './db';
import { Novel, Category, LibraryEntry } from '../types';

export async function upsertNovel(novel: Partial<Novel>): Promise<Novel> {
  const slug = novel.slug!;
  const title = novel.title || 'Untitled';
  const coverUrl = novel.cover_url || '';
  const author = novel.author || 'Unknown';
  const status = novel.status || 'Ongoing';
  const genres = novel.genres || '';
  const synopsis = novel.synopsis || '';
  const sourceUrl = novel.source_url || `https://freewebnovel.com/novel/${slug}.html`;

  await dbManager.runExecute(
    `INSERT OR REPLACE INTO novels (slug, title, cover_url, author, status, genres, synopsis, source_url, last_checked_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [slug, title, coverUrl, author, status, genres, synopsis, sourceUrl]
  );

  const rows = await dbManager.runQuery(`SELECT * FROM novels WHERE slug = ?`, [slug]);
  return rows[0];
}

export async function getNovelBySlug(slug: string): Promise<Novel | null> {
  const rows = await dbManager.runQuery(`SELECT * FROM novels WHERE slug = ?`, [slug]);
  if (!rows || rows.length === 0) return null;

  const novel = rows[0];
  // Check if in library
  const libRows = await dbManager.runQuery(`SELECT * FROM library WHERE novel_id = ?`, [novel.id]);
  novel.in_library = libRows && libRows.length > 0;
  if (novel.in_library) {
    novel.category_id = libRows[0].category_id;
  }

  return novel;
}

export async function getNovelById(id: number): Promise<Novel | null> {
  const rows = await dbManager.runQuery(`SELECT * FROM novels WHERE id = ?`, [id]);
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

export async function addToLibrary(novelId: number, categoryId: number | null = null): Promise<void> {
  await dbManager.runExecute(
    `INSERT OR REPLACE INTO library (novel_id, category_id, added_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
    [novelId, categoryId]
  );
}

export async function removeFromLibrary(novelId: number): Promise<void> {
  await dbManager.runExecute(`DELETE FROM library WHERE novel_id = ?`, [novelId]);
}

export async function updateNovelCategory(novelId: number, categoryId: number | null): Promise<void> {
  await dbManager.runExecute(`UPDATE library SET category_id = ? WHERE novel_id = ?`, [categoryId, novelId]);
}

export async function getLibraryNovels(categoryId?: number | null): Promise<Novel[]> {
  let query = `
    SELECT n.*, l.category_id, 1 as in_library
    FROM library l
    JOIN novels n ON l.novel_id = n.id
  `;
  const params: any[] = [];

  if (categoryId !== undefined && categoryId !== null) {
    query += ` WHERE l.category_id = ?`;
    params.push(categoryId);
  }

  query += ` ORDER BY l.added_at DESC`;

  const rows = await dbManager.runQuery(query, params);
  return rows as Novel[];
}

export async function getCategories(): Promise<Category[]> {
  const rows = await dbManager.runQuery(`SELECT * FROM categories ORDER BY sort_order ASC`);
  return rows as Category[];
}

export async function addCategory(name: string): Promise<Category> {
  const res = await dbManager.runExecute(`INSERT INTO categories (name, sort_order) VALUES (?, 10)`, [name]);
  const categories = await getCategories();
  return categories.find(c => c.name === name) || { id: res.lastId || Date.now(), name, sort_order: 10 };
}

export async function deleteCategory(id: number): Promise<void> {
  await dbManager.runExecute(`DELETE FROM categories WHERE id = ?`, [id]);
}
