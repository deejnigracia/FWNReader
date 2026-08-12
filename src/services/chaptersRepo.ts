import { dbManager } from './db';
import { Chapter } from '../types';

export async function saveChapters(novelId: number, chapters: Partial<Chapter>[]): Promise<void> {
  for (const chap of chapters) {
    await dbManager.runExecute(
      `INSERT OR IGNORE INTO chapters (novel_id, chapter_number, title, source_url, content)
       VALUES (?, ?, ?, ?, ?)`,
      [novelId, chap.chapter_number, chap.title || `Chapter ${chap.chapter_number}`, chap.source_url, chap.content || null]
    );
  }
}

export async function getChaptersForNovel(novelId: number, sortAsc: boolean = true): Promise<Chapter[]> {
  const sortDir = sortAsc ? 'ASC' : 'DESC';
  const rows = await dbManager.runQuery(
    `SELECT * FROM chapters WHERE novel_id = ? ORDER BY chapter_number ${sortDir}`,
    [novelId]
  );
  return rows as Chapter[];
}

export async function getChapterById(chapterId: number): Promise<Chapter | null> {
  const rows = await dbManager.runQuery(`SELECT * FROM chapters WHERE id = ?`, [chapterId]);
  if (!rows || rows.length === 0) return null;
  return rows[0] as Chapter;
}

export async function updateChapterContent(chapterId: number, content: string): Promise<void> {
  await dbManager.runExecute(
    `UPDATE chapters SET content = ?, downloaded_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [content, chapterId]
  );
}

export async function markChapterRead(chapterId: number, isRead: boolean = true): Promise<void> {
  await dbManager.runExecute(`UPDATE chapters SET is_read = ? WHERE id = ?`, [isRead ? 1 : 0, chapterId]);
}

export async function markAllChaptersRead(novelId: number, isRead: boolean = true): Promise<void> {
  await dbManager.runExecute(`UPDATE chapters SET is_read = ? WHERE novel_id = ?`, [isRead ? 1 : 0, novelId]);
}

export async function deleteDownloadedChapter(chapterId: number): Promise<void> {
  await dbManager.runExecute(`UPDATE chapters SET content = NULL, downloaded_at = NULL WHERE id = ?`, [chapterId]);
}

export async function getDownloadedCount(novelId: number): Promise<number> {
  const rows = await dbManager.runQuery(`SELECT * FROM chapters WHERE novel_id = ?`, [novelId]);
  return rows.filter((c: any) => c.content !== null).length;
}

export async function getUnreadCount(novelId: number): Promise<number> {
  const rows = await dbManager.runQuery(`SELECT * FROM chapters WHERE novel_id = ?`, [novelId]);
  return rows.filter((c: any) => !c.is_read).length;
}
