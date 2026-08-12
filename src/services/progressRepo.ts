import { dbManager } from './db';
import { ReadingProgress, HistoryItem } from '../types';

export interface ReadingHistoryItem {
  novel_id: number;
  chapter_id: number;
  last_read_at: string;
  novel_title: string;
  novel_cover: string;
  novel_slug: string;
  chapter_title: string;
}

export async function saveReadingProgress(novelId: number, lastChapterId: number, scrollPosition: number = 0): Promise<void> {
  await dbManager.runExecute(
    `INSERT OR REPLACE INTO reading_progress (novel_id, last_chapter_id, scroll_position, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
    [novelId, lastChapterId, scrollPosition]
  );

  await addToHistory(novelId, lastChapterId);
}

export async function getReadingProgress(novelId: number): Promise<ReadingProgress | null> {
  const rows = await dbManager.runQuery(`SELECT * FROM reading_progress WHERE novel_id = ?`, [novelId]);
  if (!rows || rows.length === 0) return null;
  return rows[0] as ReadingProgress;
}

export async function addToHistory(novelId: number, chapterId: number): Promise<void> {
  await dbManager.runExecute(
    `INSERT INTO history (novel_id, chapter_id, opened_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
    [novelId, chapterId]
  );
}

export async function getHistoryList(): Promise<HistoryItem[]> {
  const rows = await dbManager.runQuery(`SELECT * FROM history ORDER BY opened_at DESC`);
  return rows as HistoryItem[];
}

export async function getAllReadingHistory(): Promise<ReadingHistoryItem[]> {
  const query = `
    SELECT 
      h.novel_id,
      h.chapter_id,
      h.opened_at as last_read_at,
      n.title as novel_title,
      n.cover_url as novel_cover,
      n.slug as novel_slug,
      c.title as chapter_title
    FROM history h
    LEFT JOIN novels n ON h.novel_id = n.id
    LEFT JOIN chapters c ON h.chapter_id = c.id
    ORDER BY h.opened_at DESC
    LIMIT 30
  `;
  const rows = await dbManager.runQuery(query);
  return rows as ReadingHistoryItem[];
}

export async function clearHistory(): Promise<void> {
  await dbManager.runExecute(`DELETE FROM history`);
}
