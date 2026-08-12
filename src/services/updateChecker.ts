import { getLibraryNovels, getNovelById, upsertNovel } from './novelsRepo';
import { getNovelDetail } from './freewebnovel';
import { saveChapters, getChaptersForNovel } from './chaptersRepo';
import { Novel, Chapter } from '../types';

export interface UpdateCheckProgress {
  totalNovels: number;
  checkedCount: number;
  currentNovelTitle: string;
  isChecking: boolean;
  newChaptersFound: number;
}

export interface UpdatedChapterItem {
  novel: Novel;
  newChapters: Chapter[];
}

type UpdateListener = (progress: UpdateCheckProgress) => void;

class UpdateCheckerService {
  private isChecking: boolean = false;
  private listeners: Set<UpdateListener> = new Set();

  subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(totalNovels: number, checkedCount: number, currentNovelTitle: string, newChaptersFound: number) {
    const payload: UpdateCheckProgress = {
      totalNovels,
      checkedCount,
      currentNovelTitle,
      isChecking: this.isChecking,
      newChaptersFound,
    };
    this.listeners.forEach(fn => fn(payload));
  }

  async checkAllLibraryNovels(): Promise<{ updatedCount: number; totalNewChapters: number }> {
    if (this.isChecking) return { updatedCount: 0, totalNewChapters: 0 };

    this.isChecking = true;
    const libraryList = await getLibraryNovels();
    let checkedCount = 0;
    let totalNewChapters = 0;
    let updatedCount = 0;

    for (const novel of libraryList) {
      this.notify(libraryList.length, checkedCount, novel.title, totalNewChapters);

      try {
        const liveDetail = await getNovelDetail(novel.slug);
        const existingChapters = await getChaptersForNovel(novel.id);
        const existingNumbers = new Set(existingChapters.map(c => c.chapter_number));

        const newChaps = liveDetail.chapters.filter(c => c.chapter_number !== undefined && !existingNumbers.has(c.chapter_number));

        if (newChaps.length > 0) {
          await saveChapters(novel.id, newChaps);
          await upsertNovel({ ...novel, status: liveDetail.novel.status || novel.status });
          totalNewChapters += newChaps.length;
          updatedCount++;
        }
      } catch (e) {
        console.warn(`Update check failed for novel ${novel.title}:`, e);
      }

      checkedCount++;
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    this.isChecking = false;
    this.notify(libraryList.length, checkedCount, 'Completed', totalNewChapters);

    return { updatedCount, totalNewChapters };
  }
}

export const updateChecker = new UpdateCheckerService();

export async function checkForLibraryUpdates(): Promise<UpdatedChapterItem[]> {
  const libraryList = await getLibraryNovels();
  const results: UpdatedChapterItem[] = [];

  for (const novel of libraryList) {
    try {
      const liveDetail = await getNovelDetail(novel.slug);
      const existingChapters = await getChaptersForNovel(novel.id);
      const existingNumbers = new Set(existingChapters.map((c) => c.chapter_number));

      const newChapsRaw = liveDetail.chapters.filter(
        (c) => c.chapter_number !== undefined && !existingNumbers.has(c.chapter_number)
      );

      if (newChapsRaw.length > 0) {
        await saveChapters(novel.id, newChapsRaw);
        await upsertNovel({ ...novel, status: liveDetail.novel.status || novel.status });
      }

      const allUpdated = await getChaptersForNovel(novel.id, true);
      const unreadList = allUpdated.filter((c) => !c.is_read);

      if (unreadList.length > 0) {
        results.push({
          novel,
          newChapters: unreadList.slice(-5), // show recent unread
        });
      }
    } catch (e) {
      console.warn(`Failed to check updates for ${novel.title}:`, e);
    }
  }

  return results;
}
