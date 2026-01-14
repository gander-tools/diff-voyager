import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { projects } from './projects.js';

/**
 * Mute rules table schema
 * Stores rules for automatically muting/ignoring specific diffs
 */
export const rules = sqliteTable(
  'rules',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    scope: text('scope').notNull(), // 'global' | 'project'
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    conditionsJson: text('conditions_json').notNull(),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    projectIdIdx: index('idx_rules_project_id').on(table.projectId),
    scopeIdx: index('idx_rules_scope').on(table.scope),
    activeIdx: index('idx_rules_active').on(table.active),
  }),
);

// Type inference for SELECT operations
export type Rule = typeof rules.$inferSelect;

// Type inference for INSERT operations
export type InsertRule = typeof rules.$inferInsert;
