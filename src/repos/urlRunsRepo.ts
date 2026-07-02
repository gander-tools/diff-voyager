import { randomUUID } from 'node:crypto';
import { and, asc, count, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { urlRuns, urls } from '../schema';
import type { UrlRun } from '../types';

export interface UrlRunsRepo {
  claimNextPending(runId: string): UrlRun | undefined;
  countPending(runId: string): number;
  listFailed(runId: string): { url: string; error: string | null }[];
  markDone(id: string): void;
  markFailed(id: string, error: string): void;
  bulkInsert(runId: string, urlIds: string[]): void;
  deleteByRun(runId: string): void;
}

function toUrlRun(row: typeof urlRuns.$inferSelect): UrlRun {
  return {
    id: row.id,
    url_id: row.urlId,
    run_id: row.runId,
    status: row.status as UrlRun['status'],
    error: row.error,
    created_at: row.createdAt as number,
  };
}

export class DrizzleUrlRunsRepo implements UrlRunsRepo {
  constructor(private readonly db: BetterSQLite3Database) {}

  claimNextPending(runId: string): UrlRun | undefined {
    const candidate = this.db
      .select({ id: urlRuns.id })
      .from(urlRuns)
      .where(and(eq(urlRuns.runId, runId), eq(urlRuns.status, 'pending')))
      .orderBy(asc(urlRuns.createdAt))
      .limit(1)
      .get();

    if (!candidate) {
      return undefined;
    }

    const claimed = this.db
      .update(urlRuns)
      .set({ status: 'processing' })
      .where(and(eq(urlRuns.id, candidate.id), eq(urlRuns.status, 'pending')))
      .returning()
      .get();

    return claimed ? toUrlRun(claimed) : undefined;
  }

  countPending(runId: string): number {
    const row = this.db
      .select({ c: count() })
      .from(urlRuns)
      .where(and(eq(urlRuns.runId, runId), eq(urlRuns.status, 'pending')))
      .get();
    return row?.c ?? 0;
  }

  listFailed(runId: string): { url: string; error: string | null }[] {
    return this.db
      .select({ url: urls.url, error: urlRuns.error })
      .from(urlRuns)
      .innerJoin(urls, eq(urls.id, urlRuns.urlId))
      .where(and(eq(urlRuns.runId, runId), eq(urlRuns.status, 'failed')))
      .all();
  }

  markDone(id: string): void {
    this.db.update(urlRuns).set({ status: 'done' }).where(eq(urlRuns.id, id)).run();
  }

  markFailed(id: string, error: string): void {
    this.db.update(urlRuns).set({ status: 'failed', error }).where(eq(urlRuns.id, id)).run();
  }

  bulkInsert(runId: string, urlIds: string[]): void {
    for (const urlId of urlIds) {
      this.db.insert(urlRuns).values({ id: randomUUID(), urlId, runId }).run();
    }
  }

  deleteByRun(runId: string): void {
    this.db.delete(urlRuns).where(eq(urlRuns.runId, runId)).run();
  }
}
