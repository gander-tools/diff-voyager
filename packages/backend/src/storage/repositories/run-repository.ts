/**
 * Run repository for SQLite storage
 */

import { randomUUID } from "node:crypto";
import { RunStatus } from "@gander-tools/diff-voyager-shared";
import type { Database } from "better-sqlite3";
import type { RunRow } from "../types.js";

export interface RunConfig {
	viewport: { width: number; height: number };
	captureScreenshots: boolean;
	captureHar: boolean;
}

export interface RunStatistics {
	totalPages: number;
	completedPages: number;
	errorPages: number;
	changedPages: number;
	unchangedPages: number;
}

export interface CreateRunInput {
	projectId: string;
	isBaseline: boolean;
	config: RunConfig;
}

export interface RunEntity {
	id: string;
	projectId: string;
	isBaseline: boolean;
	status: RunStatus;
	config: RunConfig;
	statistics: RunStatistics | null;
	createdAt: Date;
	startedAt?: Date;
	completedAt?: Date;
}

export class RunRepository {
	constructor(private db: Database) {}

	async create(input: CreateRunInput): Promise<RunEntity> {
		const id = randomUUID();
		const now = new Date().toISOString();

		const stmt = this.db.prepare(`
      INSERT INTO runs (id, project_id, is_baseline, status, config_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

		stmt.run(
			id,
			input.projectId,
			input.isBaseline ? 1 : 0,
			RunStatus.NEW,
			JSON.stringify(input.config),
			now,
		);

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
		const stmt = this.db.prepare("SELECT * FROM runs WHERE id = ?");
		const row = stmt.get(id) as RunRow | undefined;
		if (!row) return null;
		return this.rowToEntity(row);
	}

	async findByProjectId(projectId: string): Promise<RunEntity[]> {
		const stmt = this.db.prepare(
			"SELECT * FROM runs WHERE project_id = ? ORDER BY created_at DESC",
		);
		const rows = stmt.all(projectId) as RunRow[];
		return rows.map((row) => this.rowToEntity(row));
	}

	async updateStatus(id: string, status: RunStatus): Promise<void> {
		const now = new Date().toISOString();
		let sql = "UPDATE runs SET status = ?, ";

		if (status === RunStatus.IN_PROGRESS) {
			sql += "started_at = ? WHERE id = ?";
		} else if (status === RunStatus.COMPLETED) {
			sql += "completed_at = ? WHERE id = ?";
		} else {
			sql = "UPDATE runs SET status = ? WHERE id = ?";
			this.db.prepare(sql).run(status, id);
			return;
		}

		this.db.prepare(sql).run(status, now, id);
	}

	async updateStatistics(id: string, statistics: RunStatistics): Promise<void> {
		const stmt = this.db.prepare(
			"UPDATE runs SET statistics_json = ? WHERE id = ?",
		);
		stmt.run(JSON.stringify(statistics), id);
	}

	private rowToEntity(row: RunRow): RunEntity {
		return {
			id: row.id,
			projectId: row.project_id,
			isBaseline: row.is_baseline === 1,
			status: row.status as RunStatus,
			config: JSON.parse(row.config_json),
			statistics: row.statistics_json ? JSON.parse(row.statistics_json) : null,
			createdAt: new Date(row.created_at),
			startedAt: row.started_at ? new Date(row.started_at) : undefined,
			completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
		};
	}
}
