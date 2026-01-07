/**
 * Storage layer types for SQLite database
 */

/**
 * Storage configuration
 */
export interface StorageConfig {
	/** Base directory for all storage */
	baseDir: string;

	/** SQLite database path */
	dbPath: string;

	/** Artifacts directory path */
	artifactsDir: string;
}

/**
 * Database schema for projects table
 */
export interface ProjectRow {
	id: string;
	name: string;
	description: string | null;
	base_url: string;
	config_json: string;
	status: string;
	created_at: string;
	updated_at: string;
}

/**
 * Database schema for runs table
 */
export interface RunRow {
	id: string;
	project_id: string;
	is_baseline: number;
	status: string;
	config_json: string;
	statistics_json: string | null;
	created_at: string;
	started_at: string | null;
	completed_at: string | null;
}

/**
 * Database schema for pages table
 */
export interface PageRow {
	id: string;
	project_id: string;
	normalized_url: string;
	original_url: string;
	created_at: string;
}

/**
 * Database schema for snapshots table
 */
export interface SnapshotRow {
	id: string;
	page_id: string;
	run_id: string;
	status: string;
	http_status: number | null;
	redirect_chain_json: string | null;
	html_hash: string | null;
	html_path: string | null;
	headers_json: string | null;
	seo_data_json: string | null;
	performance_data_json: string | null;
	screenshot_path: string | null;
	har_path: string | null;
	diff_image_path: string | null;
	captured_at: string | null;
	error_message: string | null;
}

/**
 * Database schema for diffs table
 */
export interface DiffRow {
	id: string;
	page_id: string;
	run_id: string;
	baseline_snapshot_id: string;
	run_snapshot_id: string;
	summary_json: string;
	changes_json: string;
	created_at: string;
}
