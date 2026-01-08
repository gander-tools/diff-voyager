import { index, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { projects } from './projects.js';

/**
 * Pages table schema
 * Stores normalized page identifiers for crawled pages
 */
export const pages = sqliteTable(
  'pages',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    normalizedUrl: text('normalized_url').notNull(),
    originalUrl: text('original_url').notNull(),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    projectIdIdx: index('idx_pages_project_id').on(table.projectId),
    projectUrlUnique: unique().on(table.projectId, table.normalizedUrl),
  }),
);

// Type inference for SELECT operations
export type Page = typeof pages.$inferSelect;

// Type inference for INSERT operations
export type InsertPage = typeof pages.$inferInsert;
