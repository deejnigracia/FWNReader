import { getChapterContent } from './freewebnovel';
import { updateChapterContent } from './chaptersRepo';
import { Chapter } from '../types';

export interface DownloadProgressEvent {
  novelId: number;
  total: number;
  completed: number;
  currentChapterTitle: string;
  isProcessing: boolean;
  error?: string;
}

type ProgressListener = (event: DownloadProgressEvent) => void;

class DownloadQueueService {
  private queue: Array<{ chapter: Chapter; novelId: number }> = [];
  private isProcessing: boolean = false;
  private listeners: Set<ProgressListener> = new Set();
  private totalInBatch: number = 0;
  private completedInBatch: number = 0;

  subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(novelId: number, currentChapterTitle: string, error?: string) {
    const event: DownloadProgressEvent = {
      novelId,
      total: this.totalInBatch,
      completed: this.completedInBatch,
      currentChapterTitle,
      isProcessing: this.isProcessing,
      error,
    };
    this.listeners.forEach((fn) => fn(event));
  }

  enqueueChapters(novelId: number, chapters: Chapter[]) {
    const undownloaded = chapters.filter((c) => !c.content);
    if (undownloaded.length === 0) return;

    for (const chap of undownloaded) {
      if (!this.queue.some((q) => q.chapter.id === chap.id)) {
        this.queue.push({ chapter: chap, novelId });
      }
    }

    this.totalInBatch = this.queue.length;
    this.completedInBatch = 0;

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      this.notify(0, '', undefined);
      return;
    }

    this.isProcessing = true;
    const task = this.queue.shift()!;
    const { chapter, novelId } = task;

    this.notify(novelId, chapter.title || `Chapter ${chapter.chapter_number}`);

    try {
      const res = await getChapterContent(chapter.source_url);
      if (res.content) {
        await updateChapterContent(chapter.id, res.content);
        this.completedInBatch++;
        this.notify(novelId, chapter.title);
      } else {
        this.notify(novelId, chapter.title, 'Failed to extract content');
      }
    } catch (e: any) {
      console.error('Download queue item error:', e);
      this.notify(novelId, chapter.title, e.message);
    }

    // Polite sequential delay (800ms) to respect source site
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Process next in queue
    await this.processQueue();
  }

  getIsProcessing(): boolean {
    return this.isProcessing;
  }
}

export const downloadQueue = new DownloadQueueService();
