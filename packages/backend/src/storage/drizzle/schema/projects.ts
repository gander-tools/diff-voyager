import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Projects table schema
 * Stores project configuration for crawling operations
 */
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  baseUrl: text('base_url').notNull(),
  configJson: text('config_json').notNull(),
  status: text('status').notNull().default('new'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// Type inference for SELECT operations
export type Project = typeof projects.$inferSelect;

// Type inference for INSERT operations
export type InsertProject = typeof projects.$inferInsert;
