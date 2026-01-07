/**
 * Diff repository for SQLite storage
 */

import { randomUUID } from 'node:crypto';
import type { Change, Diff, DiffSummary } from '@gander-tools/diff-voyager-shared';
import type { Database } from 'better-sqlite3';
import type { DiffRow } from '../types.js';

export interface CreateDiffInput {
  pageId: string;
  runId: string;
  baselineSnapshotId: string;
  runSnapshotId: string;
  summary: DiffSummary;
  changes: Change[];
}

export class DiffRepository {
  constructor(private db: Database) {}

  async create(input: CreateDiffInput): Promise<Diff> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO diffs (id, page_id, run_id, baseline_snapshot_id, run_snapshot_id, summary_json, changes_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.pageId,
      input.runId,
      input.baselineSnapshotId,
      input.runSnapshotId,
      JSON.stringify(input.summary),
      JSON.stringify(input.changes),
      now,
    );

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
    const stmt = this.db.prepare(`
      SELECT * FROM diffs WHERE page_id = ? AND run_id = ?
    `);

    const row = stmt.get(pageId, runId) as DiffRow | undefined;

    if (!row) {
      return null;
    }

    return this.rowToEntity(row);
  }

  async findByRun(runId: string): Promise<Diff[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM diffs WHERE run_id = ? ORDER BY created_at DESC
    `);

    const rows = stmt.all(runId) as DiffRow[];

    return rows.map((row) => this.rowToEntity(row));
  }

  private rowToEntity(row: DiffRow): Diff {
    return {
      id: row.id,
      pageId: row.page_id,
      runId: row.run_id,
      baselineSnapshotId: row.baseline_snapshot_id,
      runSnapshotId: row.run_snapshot_id,
      summary: JSON.parse(row.summary_json) as DiffSummary,
      changes: JSON.parse(row.changes_json) as Change[],
      createdAt: new Date(row.created_at),
    };
  }
}
