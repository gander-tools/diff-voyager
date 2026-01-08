/**
 * RunRepositoryDrizzle - Drizzle ORM implementation
 * Type-safe run repository with JSON config and statistics support
 */

import { randomUUID } from 'node:crypto';
import { RunStatus } from '@gander-tools/diff-voyager-shared';
import { desc, eq } from 'drizzle-orm';
import type { DrizzleDb } from '../drizzle/db.js';
import { runs } from '../drizzle/schema/index.js';
import type { IRunRepository } from './interfaces/run-repository.interface.js';
import type { CreateRunInput, RunEntity, RunStatistics } from './run-repository.js';

/**
 * Drizzle-based implementation of RunRepository
 * Provides type-safe queries with automatic JSON serialization
 */
export class RunRepositoryDrizzle implements IRunRepository {
  constructor(private db: DrizzleDb) {}

  async create(input: CreateRunInput): Promise<RunEntity> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.db.insert(runs).values({
      id,
      projectId: input.projectId,
      isBaseline: input.isBaseline ? 1 : 0,
      status: RunStatus.NEW,
      configJson: JSON.stringify(input.config),
      statisticsJson: null,
      createdAt: now,
      startedAt: null,
      completedAt: null,
    });

    return {
      id,
      projectId: input.projectId,
      isBaseline: input.isBaseline,
      status: RunStatus.NEW,
      config: input.config,
      statistics: null,
      createdAt: new Date(now),
    };
  }

  async findById(id: string): Promise<RunEntity | null> {
    const rows = await this.db.select().from(runs).where(eq(runs.id, id));

    if (rows.length === 0) {
      return null;
    }

    return this.rowToEntity(rows[0]);
  }

  async findByProjectId(projectId: string): Promise<RunEntity[]> {
    const rows = await this.db
      .select()
      .from(runs)
      .where(eq(runs.projectId, projectId))
      .orderBy(desc(runs.createdAt));

    return rows.map((row) => this.rowToEntity(row));
  }

  async updateStatus(id: string, status: RunStatus): Promise<void> {
    const now = new Date().toISOString();

    if (status === RunStatus.IN_PROGRESS) {
      await this.db
        .update(runs)
        .set({
          status,
          startedAt: now,
        })
        .where(eq(runs.id, id));
    } else if (status === RunStatus.COMPLETED) {
      await this.db
        .update(runs)
        .set({
          status,
          completedAt: now,
        })
        .where(eq(runs.id, id));
    } else {
      await this.db.update(runs).set({ status }).where(eq(runs.id, id));
    }
  }

  async updateStatistics(id: string, statistics: RunStatistics): Promise<void> {
    await this.db
      .update(runs)
      .set({
        statisticsJson: JSON.stringify(statistics),
      })
      .where(eq(runs.id, id));
  }

  /**
   * Convert database row to RunEntity
   * Handles JSON deserialization, boolean conversion, and optional fields
   */
  private rowToEntity(row: typeof runs.$inferSelect): RunEntity {
    return {
      id: row.id,
      projectId: row.projectId,
      isBaseline: row.isBaseline === 1,
      status: row.status as RunStatus,
      config: JSON.parse(row.configJson),
      statistics: row.statisticsJson ? JSON.parse(row.statisticsJson) : null,
      createdAt: new Date(row.createdAt),
      startedAt: row.startedAt ? new Date(row.startedAt) : undefined,
      completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
    };
  }
}
