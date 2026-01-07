/**
 * Page repository for SQLite storage
 */

import { randomUUID } from "node:crypto";
import type { Database } from "better-sqlite3";
import type { PageRow } from "../types.js";

export interface CreatePageInput {
	projectId: string;
	normalizedUrl: string;
	originalUrl: string;
}

export interface PageEntity {
	id: string;
	projectId: string;
	normalizedUrl: string;
	originalUrl: string;
	createdAt: Date;
}

export class PageRepository {
	constructor(private db: Database) {}

	async create(input: CreatePageInput): Promise<PageEntity> {
		const id = randomUUID();
		const now = new Date().toISOString();

		const stmt = this.db.prepare(`
      INSERT INTO pages (id, project_id, normalized_url, original_url, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

		stmt.run(id, input.projectId, input.normalizedUrl, input.originalUrl, now);

		return {
			id,
			projectId: input.projectId,
			normalizedUrl: input.normalizedUrl,
			originalUrl: input.originalUrl,
			createdAt: new Date(now),
		};
	}

	async findById(id: string): Promise<PageEntity | null> {
		const stmt = this.db.prepare("SELECT * FROM pages WHERE id = ?");
		const row = stmt.get(id) as PageRow | undefined;
		if (!row) return null;
		return this.rowToEntity(row);
	}

	async findByProjectId(projectId: string): Promise<PageEntity[]> {
		const stmt = this.db.prepare("SELECT * FROM pages WHERE project_id = ?");
		const rows = stmt.all(projectId) as PageRow[];
		return rows.map((row) => this.rowToEntity(row));
	}

	async findByNormalizedUrl(
		projectId: string,
		normalizedUrl: string,
	): Promise<PageEntity | null> {
		const stmt = this.db.prepare(
			"SELECT * FROM pages WHERE project_id = ? AND normalized_url = ?",
		);
		const row = stmt.get(projectId, normalizedUrl) as PageRow | undefined;
		if (!row) return null;
		return this.rowToEntity(row);
	}

	async findOrCreate(input: CreatePageInput): Promise<PageEntity> {
		const existing = await this.findByNormalizedUrl(
			input.projectId,
			input.normalizedUrl,
		);
		if (existing) return existing;
		return this.create(input);
	}

	private rowToEntity(row: PageRow): PageEntity {
		return {
			id: row.id,
			projectId: row.project_id,
			normalizedUrl: row.normalized_url,
			originalUrl: row.original_url,
			createdAt: new Date(row.created_at),
		};
	}
}
