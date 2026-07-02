import { randomUUID } from 'node:crypto';
import { and, eq, max } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { runs, urlRuns, urls } from '../schema';
import type { RunRecord } from '../types';

export interface RunsRepo {
  findOpenRun(): RunRecord | undefined;
  insertRunWithUrlRuns(): { id: string; version: number };
  updatePid(runId: string, pid: number): void;
  deleteRun(runId: string): void;
  markAbandoned(runId: string): void;
  markDone(runId: string): void;
  markDoneWithErrors(runId: string): void;
}

function toRunRecord(row: typeof runs.$inferSelect): RunRecord {
  return {
    id: row.id,
    version: row.version,
    status: row.status as RunRecord['status'],
    pid: row.pid,
    created_at: row.createdAt as number,
  };
}

export class DrizzleRunsRepo implements RunsRepo {
  constructor(private readonly db: BetterSQLite3Database) {}

  findOpenRun(): RunRecord | undefined {
    const row = this.db.select().from(runs).where(eq(runs.status, 'open')).get();
    return row ? toRunRecord(row) : undefined;
  }

  insertRunWithUrlRuns(): { id: string; version: number } {
    const runId = randomUUID();

    const version = this.db.transaction((tx) => {
      const nextVersion =
        (tx
          .select({ v: max(runs.version) })
          .from(runs)
          .get()?.v ?? 0) + 1;

      tx.insert(runs).values({ id: runId, version: nextVersion }).run();

      const urlRows = tx.select({ id: urls.id }).from(urls).all();
      for (const { id: urlId } of urlRows) {
        tx.insert(urlRuns).values({ id: randomUUID(), urlId, runId }).run();
      }

      return nextVersion;
    });

    return { id: runId, version };
  }

  updatePid(runId: string, pid: number): void {
    this.db.update(runs).set({ pid }).where(eq(runs.id, runId)).run();
  }

  deleteRun(runId: string): void {
    this.db.delete(runs).where(eq(runs.id, runId)).run();
  }

  markAbandoned(runId: string): void {
    this.db
      .update(runs)
      .set({ status: 'abandoned' })
      .where(and(eq(runs.id, runId), eq(runs.status, 'open')))
      .run();
  }

  markDone(runId: string): void {
    this.db
      .update(runs)
      .set({ status: 'done' })
      .where(and(eq(runs.id, runId), eq(runs.status, 'open')))
      .run();
  }

  markDoneWithErrors(runId: string): void {
    this.db
      .update(runs)
      .set({ status: 'done_with_errors' })
      .where(and(eq(runs.id, runId), eq(runs.status, 'open')))
      .run();
  }
}
