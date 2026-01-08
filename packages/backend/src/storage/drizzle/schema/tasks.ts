import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Tasks table schema
 * Stores asynchronous job queue for background processing
 */
export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(),
    status: text('status').notNull().default('pending'),
    priority: text('priority').notNull().default('normal'),
    payloadJson: text('payload_json').notNull(),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    errorMessage: text('error_message'),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    startedAt: text('started_at'),
    completedAt: text('completed_at'),
  },
  (table) => ({
    statusPriorityIdx: index('idx_tasks_status_priority').on(
      table.status,
      table.priority,
      table.createdAt,
    ),
    createdAtIdx: index('idx_tasks_created_at').on(table.createdAt),
    typeIdx: index('idx_tasks_type').on(table.type),
  }),
);

// Type inference for SELECT operations
export type Task = typeof tasks.$inferSelect;

// Type inference for INSERT operations
export type InsertTask = typeof tasks.$inferInsert;
