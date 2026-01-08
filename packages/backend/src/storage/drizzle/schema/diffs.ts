import { index, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { pages } from './pages.js';
import { runs } from './runs.js';
import { snapshots } from './snapshots.js';

/**
 * Diffs table schema
 * Stores comparison results between baseline and run snapshots
 */
export const diffs = sqliteTable(
  'diffs',
  {
    id: text('id').primaryKey(),
    pageId: text('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    runId: text('run_id')
      .notNull()
      .references(() => runs.id, { onDelete: 'cascade' }),
    baselineSnapshotId: text('baseline_snapshot_id')
      .notNull()
      .references(() => snapshots.id),
    runSnapshotId: text('run_snapshot_id')
      .notNull()
      .references(() => snapshots.id),
    summaryJson: text('summary_json').notNull(),
    changesJson: text('changes_json').notNull(),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    runIdIdx: index('idx_diffs_run_id').on(table.runId),
    pageRunUnique: unique().on(table.pageId, table.runId),
  }),
);

// Type inference for SELECT operations
export type Diff = typeof diffs.$inferSelect;

// Type inference for INSERT operations
export type InsertDiff = typeof diffs.$inferInsert;
