/**
 * Project repository for SQLite storage
 */

import { randomUUID } from 'node:crypto';
import { RunStatus } from '@gander-tools/diff-voyager-shared';
import type { Database } from 'better-sqlite3';
import type { ProjectRow } from '../types.js';

export interface ProjectConfig {
  crawl: boolean;
  viewport: { width: number; height: number };
  visualDiffThreshold: number;
  maxPages?: number;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  baseUrl: string;
  config: ProjectConfig;
}

export interface ProjectEntity {
  id: string;
  name: string;
  description?: string;
  baseUrl: string;
  config: ProjectConfig;
  status: RunStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class ProjectRepository {
  constructor(private db: Database) {}

  async create(input: CreateProjectInput): Promise<ProjectEntity> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO projects (id, name, description, base_url, config_json, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.name,
      input.description || null,
      input.baseUrl,
      JSON.stringify(input.config),
      RunStatus.NEW,
      now,
      now,
    );

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
    const stmt = this.db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `);

    const row = stmt.get(id) as ProjectRow | undefined;

    if (!row) {
      return null;
    }

    return this.rowToEntity(row);
  }

  async findAll(
    options: { limit?: number; offset?: number } = {},
  ): Promise<{ projects: ProjectEntity[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Get total count
    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM projects');
    const countRow = countStmt.get() as { count: number };
    const total = countRow.count;

    // Get paginated projects (newest first)
    const projectsStmt = this.db.prepare(`
      SELECT * FROM projects
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    const rows = projectsStmt.all(limit, offset) as ProjectRow[];
    const projects = rows.map((row) => this.rowToEntity(row));

    return { projects, total };
  }

  async updateStatus(id: string, status: RunStatus): Promise<void> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE projects SET status = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run(status, now, id);
  }

  private rowToEntity(row: ProjectRow): ProjectEntity {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      baseUrl: row.base_url,
      config: JSON.parse(row.config_json),
      status: row.status as RunStatus,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
