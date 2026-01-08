import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { pages } from './pages.js';
import { runs } from './runs.js';

/**
 * Snapshots table schema
 * Stores captured state of pages at specific points in time
 */
export const snapshots = sqliteTable(
  'snapshots',
  {
    id: text('id').primaryKey(),
    pageId: text('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    runId: text('run_id')
      .notNull()
      .references(() => runs.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('pending'),
    httpStatus: integer('http_status'),
    redirectChainJson: text('redirect_chain_json'),
    htmlHash: text('html_hash'),
    htmlPath: text('html_path'),
    headersJson: text('headers_json'),
    seoDataJson: text('seo_data_json'),
    performanceDataJson: text('performance_data_json'),
    screenshotPath: text('screenshot_path'),
    harPath: text('har_path'),
    diffImagePath: text('diff_image_path'),
    capturedAt: text('captured_at'),
    errorMessage: text('error_message'),
    isBaseline: integer('is_baseline', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => ({
    pageIdIdx: index('idx_snapshots_page_id').on(table.pageId),
    runIdIdx: index('idx_snapshots_run_id').on(table.runId),
    pageRunUnique: unique().on(table.pageId, table.runId),
  }),
);

// Type inference for SELECT operations
export type Snapshot = typeof snapshots.$inferSelect;

// Type inference for INSERT operations
export type InsertSnapshot = typeof snapshots.$inferInsert;
