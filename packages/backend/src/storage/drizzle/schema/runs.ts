import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { projects } from './projects.js';

/**
 * Runs table schema
 * Stores baseline and comparison runs for projects
 */
export const runs = sqliteTable(
  'runs',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    isBaseline: integer('is_baseline', { mode: 'boolean' }).notNull().default(false),
    status: text('status').notNull().default('new'),
    configJson: text('config_json').notNull(),
    statisticsJson: text('statistics_json'),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    startedAt: text('started_at'),
    completedAt: text('completed_at'),
  },
  (table) => ({
    projectIdIdx: index('idx_runs_project_id').on(table.projectId),
    projectIdIsBaselineIdx: index('idx_runs_project_id_is_baseline').on(
      table.projectId,
      table.isBaseline,
    ),
  }),
);

// Type inference for SELECT operations
export type Run = typeof runs.$inferSelect;

// Type inference for INSERT operations
export type InsertRun = typeof runs.$inferInsert;
