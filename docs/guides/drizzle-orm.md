# Drizzle ORM Usage

**Status**: ✅ Migration Complete (January 2026)

Diff Voyager has successfully migrated from raw SQL to Drizzle ORM. All repositories now use Drizzle for type-safe database queries with automatic prepared statements.

## Repository Pattern with Drizzle

Repositories use Drizzle ORM for type-safe database queries with automatic prepared statements:

```typescript
import { eq, and } from 'drizzle-orm';
import { pages } from '../drizzle/schema/index.js';
import type { DrizzleDb } from '../drizzle/db.js';

export class PageRepositoryDrizzle implements IPageRepository {
  constructor(private db: DrizzleDb) {}

  // Type-safe SELECT with WHERE clause
  async findById(id: string): Promise<PageEntity | null> {
    const rows = await this.db
      .select()
      .from(pages)
      .where(eq(pages.id, id));

    if (rows.length === 0) return null;
    return this.rowToEntity(rows[0]);
  }

  // Type-safe INSERT
  async create(input: CreatePageInput): Promise<PageEntity> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.db.insert(pages).values({
      id,
      projectId: input.projectId,
      normalizedUrl: input.normalizedUrl,
      originalUrl: input.originalUrl,
      createdAt: now,
    });

    return {
      id,
      projectId: input.projectId,
      normalizedUrl: input.normalizedUrl,
      originalUrl: input.originalUrl,
      createdAt: new Date(now),
    };
  }

  // Multiple WHERE conditions with and()
  async findByNormalizedUrl(projectId: string, normalizedUrl: string): Promise<PageEntity | null> {
    const rows = await this.db
      .select()
      .from(pages)
      .where(and(
        eq(pages.projectId, projectId),
        eq(pages.normalizedUrl, normalizedUrl)
      ));

    if (rows.length === 0) return null;
    return this.rowToEntity(rows[0]);
  }

  private rowToEntity(row: typeof pages.$inferSelect): PageEntity {
    return {
      id: row.id,
      projectId: row.projectId,
      normalizedUrl: row.normalizedUrl,
      originalUrl: row.originalUrl,
      createdAt: new Date(row.createdAt),
    };
  }
}
```

## Schema Definition

Schemas are defined in TypeScript with automatic type inference:

```typescript
import { sqliteTable, text, index, unique } from 'drizzle-orm/sqlite-core';
import { projects } from './projects.js';

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
```

## JSON Columns

JSON columns have type-safe access with TypeScript inference:

```typescript
// Schema definition with typed JSON column
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { ProjectConfig } from '../repositories/project-repository.js';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  configJson: text('config_json')
    .notNull()
    .$type<ProjectConfig>(),
});

// Usage in repository
const projects = await this.db.select().from(projects);
const config: ProjectConfig = projects[0].configJson; // Type-safe!
```

## Migration Status

All repositories have been successfully migrated to Drizzle ORM:

- ✅ **PageRepository** - Fully migrated with 13 unit tests
- ✅ **ProjectRepository** - Fully migrated with 13 unit tests
- ✅ **RunRepository** - Fully migrated with 16 unit tests
- ✅ **TaskQueue** - Fully migrated with 19 unit tests
- ✅ **SnapshotRepository** - Fully migrated with 14 unit tests
- ✅ **DiffRepository** - Fully migrated with 9 unit tests

**Total**: 25/25 migration tasks complete (100%)

See [Roadmap](../development/roadmap.md) for detailed migration history and patterns.

## Benefits

- **Type Safety**: Compile-time type checking prevents SQL errors
- **Security**: Automatic prepared statements eliminate SQL injection risks
- **Developer Experience**: IDE autocomplete for queries and schema
- **Zero Runtime Overhead**: Thin abstraction over SQL with no performance penalty
- **JSON Support**: First-class support for JSON columns with type inference

## Common Patterns

### Filtering with WHERE

```typescript
// Single condition
await db.select().from(projects).where(eq(projects.id, projectId));

// Multiple conditions (AND)
await db.select().from(pages).where(and(
  eq(pages.projectId, projectId),
  eq(pages.normalizedUrl, url)
));

// Multiple conditions (OR)
import { or } from 'drizzle-orm';
await db.select().from(runs).where(or(
  eq(runs.status, 'completed'),
  eq(runs.status, 'failed')
));
```

### Ordering and Limiting

```typescript
import { desc, asc } from 'drizzle-orm';

// Order by creation date descending, limit 10
await db
  .select()
  .from(runs)
  .where(eq(runs.projectId, projectId))
  .orderBy(desc(runs.createdAt))
  .limit(10);
```

### Updates and Deletes

```typescript
// Update
await db
  .update(runs)
  .set({ status: 'completed', completedAt: new Date().toISOString() })
  .where(eq(runs.id, runId));

// Delete
await db.delete(projects).where(eq(projects.id, projectId));
```

## Related Documentation

- [Backend Development](backend-dev.md) - Backend workflow and testing
- [Security Guidelines](security.md) - SQL injection prevention
- [@ts-rest Guide](ts-rest.md) - API contract patterns
