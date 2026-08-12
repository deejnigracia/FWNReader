import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'freewebnovel_reader_db';

class DatabaseManager {
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private isNative: boolean = false;
  private webStorageKey = 'fwn_reader_sqlite_web_v1';

  // In-memory / localStorage fallback store for browser mode
  private webDb: {
    novels: any[];
    categories: any[];
    library: any[];
    chapters: any[];
    reading_progress: any[];
    history: any[];
    seqs: { [key: string]: number };
  } = {
    novels: [],
    categories: [
      { id: 1, name: 'Reading', sort_order: 1 },
      { id: 2, name: 'Plan to Read', sort_order: 2 },
      { id: 3, name: 'On Hold', sort_order: 3 },
      { id: 4, name: 'Completed', sort_order: 4 },
    ],
    library: [],
    chapters: [],
    reading_progress: [],
    history: [],
    seqs: { novels: 1, categories: 5, chapters: 1, history: 1 },
  };

  async initialize(): Promise<void> {
    this.isNative = Capacitor.isNativePlatform();

    if (this.isNative) {
      try {
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
        const ret = await this.sqlite.checkConnectionsConsistency();
        const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;

        if (ret.result && isConn) {
          this.db = await this.sqlite.retrieveConnection(DB_NAME, false);
        } else {
          this.db = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
        }

        await this.db.open();
        await this.runMigrationsNative();
        console.log('Native SQLite initialized successfully');
        return;
      } catch (e) {
        console.warn('Failed to init Native SQLite, falling back to Web DB:', e);
        this.isNative = false;
      }
    }

    // Web LocalStorage persistence setup
    try {
      const saved = localStorage.getItem(this.webStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.webDb = { ...this.webDb, ...parsed };
      } else {
        this.saveWebDb();
      }
    } catch (e) {
      console.error('Error loading web storage:', e);
    }
  }

  private saveWebDb() {
    try {
      localStorage.setItem(this.webStorageKey, JSON.stringify(this.webDb));
    } catch (e) {
      console.error('Failed to persist web storage:', e);
    }
  }

  private async runMigrationsNative() {
    if (!this.db) return;

    const sql = `
      CREATE TABLE IF NOT EXISTS novels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        cover_url TEXT,
        author TEXT,
        status TEXT,
        genres TEXT,
        synopsis TEXT,
        source_url TEXT NOT NULL,
        last_checked_at DATETIME,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        sort_order INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS library (
        novel_id INTEGER PRIMARY KEY REFERENCES novels(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id),
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
        chapter_number REAL NOT NULL,
        title TEXT,
        source_url TEXT NOT NULL,
        content TEXT,
        downloaded_at DATETIME,
        is_read BOOLEAN DEFAULT 0,
        UNIQUE(novel_id, chapter_number)
      );

      CREATE TABLE IF NOT EXISTS reading_progress (
        novel_id INTEGER PRIMARY KEY REFERENCES novels(id) ON DELETE CASCADE,
        last_chapter_id INTEGER REFERENCES chapters(id),
        scroll_position REAL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
        chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
        opened_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (1, 'Reading', 1);
      INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (2, 'Plan to Read', 2);
      INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (3, 'On Hold', 3);
      INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (4, 'Completed', 4);
    `;

    await this.db.execute(sql);
  }

  // --- QUERY APIS ---

  async runQuery(statement: string, values: any[] = []): Promise<any> {
    if (this.isNative && this.db) {
      const res = await this.db.query(statement, values);
      return res.values || [];
    }
    return this.queryWebDb(statement, values);
  }

  async runExecute(statement: string, values: any[] = []): Promise<any> {
    if (this.isNative && this.db) {
      return await this.db.run(statement, values);
    }
    return this.executeWebDb(statement, values);
  }

  // Web DB Engine SQL interpreter for browser preview
  private queryWebDb(sql: string, params: any[]): any[] {
    const s = sql.trim().toLowerCase();

    // SELECT FROM novels
    if (s.includes('from novels')) {
      if (s.includes('where slug =')) {
        const slug = params[0];
        return this.webDb.novels.filter(n => n.slug === slug);
      }
      if (s.includes('where id =')) {
        const id = params[0];
        return this.webDb.novels.filter(n => n.id === id);
      }
      return [...this.webDb.novels];
    }

    // SELECT FROM library
    if (s.includes('from library')) {
      const res = this.webDb.library.map(lib => {
        const novel = this.webDb.novels.find(n => n.id === lib.novel_id);
        const downloadedCount = this.webDb.chapters.filter(c => c.novel_id === lib.novel_id && c.content !== null).length;
        const unreadCount = this.webDb.chapters.filter(c => c.novel_id === lib.novel_id && !c.is_read).length;
        const totalChapters = this.webDb.chapters.filter(c => c.novel_id === lib.novel_id).length;

        return {
          ...lib,
          ...(novel || {}),
          id: lib.novel_id,
          downloaded_count: downloadedCount,
          unread_count: unreadCount,
          total_chapters_count: totalChapters,
        };
      });
      return res;
    }

    // SELECT FROM categories
    if (s.includes('from categories')) {
      return [...this.webDb.categories].sort((a, b) => a.sort_order - b.sort_order);
    }

    // SELECT FROM chapters
    if (s.includes('from chapters')) {
      let result = [...this.webDb.chapters];
      if (s.includes('where novel_id =')) {
        const novelId = params[0];
        result = result.filter(c => c.novel_id === novelId);
      }
      if (s.includes('where id =')) {
        const id = params[0];
        result = result.filter(c => c.id === id);
      }
      if (s.includes('order by chapter_number desc')) {
        result.sort((a, b) => b.chapter_number - a.chapter_number);
      } else if (s.includes('order by chapter_number asc')) {
        result.sort((a, b) => a.chapter_number - b.chapter_number);
      }
      return result;
    }

    // SELECT FROM reading_progress
    if (s.includes('from reading_progress')) {
      if (s.includes('where novel_id =')) {
        const novelId = params[0];
        return this.webDb.reading_progress.filter(rp => rp.novel_id === novelId);
      }
      return [...this.webDb.reading_progress];
    }

    // SELECT FROM history
    if (s.includes('from history')) {
      const items = this.webDb.history.map(h => {
        const novel = this.webDb.novels.find(n => n.id === h.novel_id);
        const chap = this.webDb.chapters.find(c => c.id === h.chapter_id);
        return {
          ...h,
          novel_title: novel?.title || 'Unknown Novel',
          novel_cover: novel?.cover_url || '',
          chapter_title: chap?.title || `Chapter ${chap?.chapter_number || ''}`,
          chapter_number: chap?.chapter_number || 1,
        };
      }).sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());
      return items;
    }

    return [];
  }

  private executeWebDb(sql: string, params: any[]): any {
    const s = sql.trim().toLowerCase();

    // INSERT INTO novels / UPSERT
    if (s.startsWith('insert or replace into novels') || s.startsWith('insert into novels')) {
      const existingIdx = this.webDb.novels.findIndex(n => n.slug === params[0]);
      const record = {
        id: existingIdx >= 0 ? this.webDb.novels[existingIdx].id : this.webDb.seqs.novels++,
        slug: params[0],
        title: params[1],
        cover_url: params[2],
        author: params[3],
        status: params[4],
        genres: params[5],
        synopsis: params[6],
        source_url: params[7],
        last_checked_at: new Date().toISOString(),
        cached_at: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        this.webDb.novels[existingIdx] = { ...this.webDb.novels[existingIdx], ...record };
      } else {
        this.webDb.novels.push(record);
      }
      this.saveWebDb();
      return { changes: 1, lastId: record.id };
    }

    // INSERT INTO library
    if (s.startsWith('insert or replace into library') || s.startsWith('insert into library')) {
      const novelId = params[0];
      const categoryId = params[1] || null;
      const existingIdx = this.webDb.library.findIndex(l => l.novel_id === novelId);

      const item = {
        novel_id: novelId,
        category_id: categoryId,
        added_at: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        this.webDb.library[existingIdx] = item;
      } else {
        this.webDb.library.push(item);
      }
      this.saveWebDb();
      return { changes: 1 };
    }

    // DELETE FROM library
    if (s.startsWith('delete from library')) {
      const novelId = params[0];
      this.webDb.library = this.webDb.library.filter(l => l.novel_id !== novelId);
      this.saveWebDb();
      return { changes: 1 };
    }

    // INSERT OR IGNORE INTO chapters
    if (s.includes('into chapters')) {
      // Multiple insertion or single
      const novelId = params[0];
      const chapNum = params[1];
      const title = params[2];
      const sourceUrl = params[3];
      const content = params[4] || null;

      const existingIdx = this.webDb.chapters.findIndex(c => c.novel_id === novelId && c.chapter_number === chapNum);
      if (existingIdx >= 0) {
        if (content !== null) {
          this.webDb.chapters[existingIdx].content = content;
          this.webDb.chapters[existingIdx].downloaded_at = new Date().toISOString();
        }
      } else {
        this.webDb.chapters.push({
          id: this.webDb.seqs.chapters++,
          novel_id: novelId,
          chapter_number: chapNum,
          title,
          source_url: sourceUrl,
          content,
          downloaded_at: content ? new Date().toISOString() : null,
          is_read: false,
        });
      }
      this.saveWebDb();
      return { changes: 1 };
    }

    // UPDATE chapters SET content = ?
    if (s.includes('update chapters set content =')) {
      const content = params[0];
      const chapterId = params[1];
      const chap = this.webDb.chapters.find(c => c.id === chapterId);
      if (chap) {
        chap.content = content;
        chap.downloaded_at = new Date().toISOString();
        this.saveWebDb();
      }
      return { changes: 1 };
    }

    // UPDATE chapters SET is_read = ?
    if (s.includes('update chapters set is_read =')) {
      const isRead = params[0];
      const chapterId = params[1];
      const chap = this.webDb.chapters.find(c => c.id === chapterId);
      if (chap) {
        chap.is_read = Boolean(isRead);
        this.saveWebDb();
      }
      return { changes: 1 };
    }

    // UPDATE chapters SET is_read = 1 WHERE novel_id = ?
    if (s.includes('update chapters set is_read = 1 where novel_id =')) {
      const novelId = params[0];
      this.webDb.chapters.forEach(c => {
        if (c.novel_id === novelId) c.is_read = true;
      });
      this.saveWebDb();
      return { changes: 1 };
    }

    // INSERT OR REPLACE INTO reading_progress
    if (s.includes('into reading_progress')) {
      const novelId = params[0];
      const lastChapterId = params[1];
      const scrollPos = params[2] || 0;
      const idx = this.webDb.reading_progress.findIndex(rp => rp.novel_id === novelId);
      const record = {
        novel_id: novelId,
        last_chapter_id: lastChapterId,
        scroll_position: scrollPos,
        updated_at: new Date().toISOString(),
      };
      if (idx >= 0) {
        this.webDb.reading_progress[idx] = record;
      } else {
        this.webDb.reading_progress.push(record);
      }
      this.saveWebDb();
      return { changes: 1 };
    }

    // INSERT INTO history
    if (s.includes('into history')) {
      const novelId = params[0];
      const chapterId = params[1];
      this.webDb.history.push({
        id: this.webDb.seqs.history++,
        novel_id: novelId,
        chapter_id: chapterId,
        opened_at: new Date().toISOString(),
      });
      this.saveWebDb();
      return { changes: 1 };
    }

    // INSERT INTO categories
    if (s.includes('into categories')) {
      const name = params[0];
      const sortOrder = params[1] || 10;
      const cat = { id: this.webDb.seqs.categories++, name, sort_order: sortOrder };
      this.webDb.categories.push(cat);
      this.saveWebDb();
      return { changes: 1, lastId: cat.id };
    }

    // DELETE FROM categories
    if (s.includes('delete from categories')) {
      const id = params[0];
      this.webDb.categories = this.webDb.categories.filter(c => c.id !== id);
      this.saveWebDb();
      return { changes: 1 };
    }

    // Export/Import JSON helpers
    this.saveWebDb();
    return { changes: 1 };
  }

  exportDataJson(): string {
    return JSON.stringify(this.webDb, null, 2);
  }

  importDataJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object') {
        this.webDb = { ...this.webDb, ...parsed };
        this.saveWebDb();
        return true;
      }
    } catch (e) {
      console.error('Failed to parse import backup JSON:', e);
    }
    return false;
  }
}

export const dbManager = new DatabaseManager();
