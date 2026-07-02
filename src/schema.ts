import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const urls = sqliteTable('urls', {
  id: text('id').primaryKey(),
  url: text('url').notNull().unique(),
  host: text('host').notNull(),
  path: text('path').notNull(),
  queryString: text('query_string').notNull().default(''),
  pageSlug: text('page_slug').notNull(),
  createdAt: integer('created_at').default(sql`(unixepoch('now'))`),
});

export const runs = sqliteTable('runs', {
  id: text('id').primaryKey(),
  version: integer('version').notNull().unique(),
  status: text('status').notNull().default('open'),
  pid: integer('pid'),
  createdAt: integer('created_at').default(sql`(unixepoch('now'))`),
});

export const urlRuns = sqliteTable(
  'url_runs',
  {
    id: text('id').primaryKey(),
    urlId: text('url_id')
      .notNull()
      .references(() => urls.id),
    runId: text('run_id')
      .notNull()
      .references(() => runs.id),
    status: text('status').notNull().default('pending'),
    error: text('error'),
    createdAt: integer('created_at').default(sql`(unixepoch('now'))`),
  },
  (table) => [unique().on(table.urlId, table.runId)],
);
