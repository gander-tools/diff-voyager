/**
 * ProjectRepositoryDrizzle - Drizzle ORM implementation
 * Type-safe project repository with JSON config support
 */

import { randomUUID } from 'node:crypto';
import { RunStatus } from '@gander-tools/diff-voyager-shared';
import { count, desc, eq } from 'drizzle-orm';
import type { DrizzleDb } from '../drizzle/db.js';
import { projects } from '../drizzle/schema/index.js';
import type { IProjectRepository } from './interfaces/project-repository.interface.js';
import type { CreateProjectInput, ProjectConfig, ProjectEntity } from './project-repository.js';

/**
 * Drizzle-based implementation of ProjectRepository
 * Provides type-safe queries with automatic JSON serialization
 */
export class ProjectRepositoryDrizzle implements IProjectRepository {
  constructor(private db: DrizzleDb) {}

  async create(input: CreateProjectInput): Promise<ProjectEntity> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.db.insert(projects).values({
      id,
      name: input.name,
      description: input.description || null,
      baseUrl: input.baseUrl,
      configJson: JSON.stringify(input.config),
      status: RunStatus.NEW,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id,
      name: input.name,
      description: input.description,
      baseUrl: input.baseUrl,
      config: input.config,
      status: RunStatus.NEW,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  async findById(id: string): Promise<ProjectEntity | null> {
    const rows = await this.db.select().from(projects).where(eq(projects.id, id));

    if (rows.length === 0) {
      return null;
    }

    return this.rowToEntity(rows[0]);
  }

  async findAll(
    options: { limit?: number; offset?: number } = {},
  ): Promise<{ projects: ProjectEntity[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Get total count
    const countResult = await this.db.select({ count: count() }).from(projects);
    const total = countResult[0].count;

    // Get paginated projects (newest first)
    const rows = await this.db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);

    const projectEntities = rows.map((row) => this.rowToEntity(row));

    return { projects: projectEntities, total };
  }

  async updateStatus(id: string, status: RunStatus): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .update(projects)
      .set({
        status,
        updatedAt: now,
      })
      .where(eq(projects.id, id));
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(projects).where(eq(projects.id, id));

    // Drizzle returns result with changes property indicating affected rows
    // If no rows affected, project didn't exist
    return result.changes > 0;
  }

  /**
   * Convert database row to ProjectEntity
   * Handles JSON deserialization and optional fields
   */
  private rowToEntity(row: typeof projects.$inferSelect): ProjectEntity {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      baseUrl: row.baseUrl,
      config: JSON.parse(row.configJson) as ProjectConfig,
      status: row.status as RunStatus,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
