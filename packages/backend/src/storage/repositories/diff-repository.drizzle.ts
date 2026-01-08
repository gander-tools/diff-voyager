/**
 * DiffRepositoryDrizzle - Drizzle ORM implementation
 * THE FINAL REPOSITORY - Type-safe diff repository with 2 JSON columns
 */

import { randomUUID } from 'node:crypto';
import type { Change, Diff, DiffSummary } from '@gander-tools/diff-voyager-shared';
import { and, desc, eq } from 'drizzle-orm';
import type { DrizzleDb } from '../drizzle/db.js';
import { diffs } from '../drizzle/schema/index.js';
import type { CreateDiffInput } from './diff-repository.js';
import type { IDiffRepository } from './interfaces/diff-repository.interface.js';

/**
 * Drizzle-based implementation of DiffRepository - FINAL MIGRATION!
 * Handles 2 JSON columns: summary, changes
 */
export class DiffRepositoryDrizzle implements IDiffRepository {
  constructor(private db: DrizzleDb) {}

  async create(input: CreateDiffInput): Promise<Diff> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.db.insert(diffs).values({
      id,
      pageId: input.pageId,
      runId: input.runId,
      baselineSnapshotId: input.baselineSnapshotId,
      runSnapshotId: input.runSnapshotId,
      summaryJson: JSON.stringify(input.summary),
      changesJson: JSON.stringify(input.changes),
      createdAt: now,
    });

    return {
      id,
      pageId: input.pageId,
      runId: input.runId,
      baselineSnapshotId: input.baselineSnapshotId,
      runSnapshotId: input.runSnapshotId,
      summary: input.summary,
      changes: input.changes,
      createdAt: new Date(now),
    };
  }

  async findByPageAndRun(pageId: string, runId: string): Promise<Diff | null> {
    const rows = await this.db
      .select()
      .from(diffs)
      .where(and(eq(diffs.pageId, pageId), eq(diffs.runId, runId)))
      .all();

    if (rows.length === 0) {
      return null;
    }

    return this.rowToEntity(rows[0]);
  }

  async findByRun(runId: string): Promise<Diff[]> {
    const rows = await this.db
      .select()
      .from(diffs)
      .where(eq(diffs.runId, runId))
      .orderBy(desc(diffs.createdAt))
      .all();

    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Convert database row to Diff entity
   * Handles 2 JSON columns: summary, changes
   */
  private rowToEntity(row: typeof diffs.$inferSelect): Diff {
    return {
      id: row.id,
      pageId: row.pageId,
      runId: row.runId,
      baselineSnapshotId: row.baselineSnapshotId,
      runSnapshotId: row.runSnapshotId,
      summary: JSON.parse(row.summaryJson) as DiffSummary,
      changes: JSON.parse(row.changesJson) as Change[],
      createdAt: new Date(row.createdAt),
    };
  }
}
