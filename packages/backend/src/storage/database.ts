/**
 * SQLite database setup and management
 */

import Database from 'better-sqlite3';
import type { StorageConfig } from './types.js';

export type DatabaseInstance = Database.Database;

/**
 * Initialize database with schema
 */
export function createDatabase(config: StorageConfig): DatabaseInstance {
  const db = new Database(config.dbPath);

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');

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
  const applied001 = db
    .prepare('SELECT 1 FROM migrations WHERE name = ?')
    .get('001-initial-schema');

  if (!applied001) {
    applyInitialSchema(db);
    db.prepare('INSERT INTO migrations (name) VALUES (?)').run('001-initial-schema');
  }

  // Check if task queue migration was applied
  const applied002 = db.prepare('SELECT 1 FROM migrations WHERE name = ?').get('002-task-queue');

  if (!applied002) {
    applyTaskQueueSchema(db);
    db.prepare('INSERT INTO migrations (name) VALUES (?)').run('002-task-queue');
  }

  // Check if snapshot baseline migration was applied
  const applied003 = db
    .prepare('SELECT 1 FROM migrations WHERE name = ?')
    .get('003-snapshot-baseline');

  if (!applied003) {
    applySnapshotBaselineMigration(db);
    db.prepare('INSERT INTO migrations (name) VALUES (?)').run('003-snapshot-baseline');
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
 * Apply task queue schema migration
 */
function applyTaskQueueSchema(db: DatabaseInstance): void {
  db.exec(`
    -- Tasks table for asynchronous job processing
    CREATE TABLE tasks (
      id TEXT NOT NULL PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'normal',
      payload_json TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      started_at TEXT,
      completed_at TEXT
    );

    -- Index on status and priority for efficient dequeue operations
    CREATE INDEX idx_tasks_status_priority ON tasks(status, priority DESC, created_at ASC);

    -- Index on created_at for ordering
    CREATE INDEX idx_tasks_created_at ON tasks(created_at);

    -- Index on type for filtering by task type
    CREATE INDEX idx_tasks_type ON tasks(type);
  `);
}

/**
 * Add is_baseline column to snapshots table
 */
function applySnapshotBaselineMigration(db: DatabaseInstance): void {
  db.exec(`
    ALTER TABLE snapshots ADD COLUMN is_baseline INTEGER NOT NULL DEFAULT 0;
  `);
}

/**
 * Close database connection
 */
export function closeDatabase(db: DatabaseInstance): void {
  db.close();
}
