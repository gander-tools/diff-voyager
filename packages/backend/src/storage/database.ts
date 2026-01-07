/**
 * SQLite database setup and management
 */

import Database from "better-sqlite3";
import type { StorageConfig } from "./types.js";

export type DatabaseInstance = Database.Database;

/**
 * Initialize database with schema
 */
export function createDatabase(config: StorageConfig): DatabaseInstance {
	const db = new Database(config.dbPath);

	// Enable WAL mode for better concurrent access
	db.pragma("journal_mode = WAL");

	// Run migrations
	runMigrations(db);

	return db;
}

/**
 * Run database migrations
 */
function runMigrations(db: DatabaseInstance): void {
	// Create migrations tracking table
	db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

	// Check if initial schema migration was applied
	const applied = db
		.prepare("SELECT 1 FROM migrations WHERE name = ?")
		.get("001-initial-schema");

	if (!applied) {
		applyInitialSchema(db);
		db.prepare("INSERT INTO migrations (name) VALUES (?)").run(
			"001-initial-schema",
		);
	}
}

/**
 * Apply initial schema migration
 */
function applyInitialSchema(db: DatabaseInstance): void {
	db.exec(`
    -- Projects table
    CREATE TABLE projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      base_url TEXT NOT NULL,
      config_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Runs table
    CREATE TABLE runs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      is_baseline INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'new',
      config_json TEXT NOT NULL,
      statistics_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      started_at TEXT,
      completed_at TEXT
    );

    CREATE INDEX idx_runs_project_id ON runs(project_id);

    -- Pages table
    CREATE TABLE pages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      normalized_url TEXT NOT NULL,
      original_url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, normalized_url)
    );

    CREATE INDEX idx_pages_project_id ON pages(project_id);

    -- Snapshots table
    CREATE TABLE snapshots (
      id TEXT PRIMARY KEY,
      page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      http_status INTEGER,
      redirect_chain_json TEXT,
      html_hash TEXT,
      html_path TEXT,
      headers_json TEXT,
      seo_data_json TEXT,
      performance_data_json TEXT,
      screenshot_path TEXT,
      har_path TEXT,
      diff_image_path TEXT,
      captured_at TEXT,
      error_message TEXT,
      UNIQUE(page_id, run_id)
    );

    CREATE INDEX idx_snapshots_page_id ON snapshots(page_id);
    CREATE INDEX idx_snapshots_run_id ON snapshots(run_id);

    -- Diffs table
    CREATE TABLE diffs (
      id TEXT PRIMARY KEY,
      page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
      baseline_snapshot_id TEXT NOT NULL REFERENCES snapshots(id),
      run_snapshot_id TEXT NOT NULL REFERENCES snapshots(id),
      summary_json TEXT NOT NULL,
      changes_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(page_id, run_id)
    );

    CREATE INDEX idx_diffs_run_id ON diffs(run_id);
  `);
}

/**
 * Close database connection
 */
export function closeDatabase(db: DatabaseInstance): void {
	db.close();
}
