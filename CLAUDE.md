# Diff Voyager - Claude Code Development Guide

## Project Overview

Diff Voyager is a local website version comparison tool designed for solo developers upgrading frameworks and dependencies. It verifies that code changes maintain visual correctness, content integrity, SEO compliance, and performance metrics.

## Architecture

### Monorepo Structure

```
diff-voyager/
├── packages/
│   ├── backend/          # Node.js + TypeScript crawler & API
│   ├── frontend/         # Vue 3 + TypeScript UI (built with bun)
│   └── shared/           # Shared TypeScript types
├── docs/                 # Documentation
├── .claude/              # Claude Code configuration
│   └── PRD.md           # Product Requirements Document
└── README.md
```

### Technology Stack

**Backend:**
- Node.js with TypeScript
- Crawlee + Playwright for browser automation and crawling
- Persistent queue and storage (SQLite planned)
- Local HTTP API for frontend communication

**Frontend:**
- Vue.js 3 + TypeScript
- Built with bun
- Communicates with backend via local API

**Shared:**
- TypeScript types shared between backend and frontend
- Domain models: Project, Run, Page, PageSnapshot, Diff, Rule/Mute

## Core Domain Models

### Project
- Configuration for crawling (base URL, scope rules)
- Run profiles (which artifacts to collect)
- Ignore filters (CSS/XPath, headers)
- Collection of Runs

### Baseline
- First full run of a project
- Reference set of pages and artifacts
- Immutable within project

### Run
- Comparison run against baseline
- Status tracking (new, in_progress, interrupted, completed)
- Statistics and diff results

### Page
- Normalized page identifier
- URL normalization rules
- Related entries in baseline and runs

### PageSnapshot
- Raw HTML/DOM with hash
- HTTP headers and status
- SEO data (title, meta, canonical, robots, H1)
- Artifacts: screenshots, HAR files, diffs
- Performance metadata

### Diff
- HTML/SEO comparison results
- Visual comparison (pixel diff)
- HAR/performance comparison
- Business status: new, accepted, muted

### Rule/MuteRule
- Ignore/mute rules (CSS/XPath selectors)
- Scope (global/per project)
- Associated difference types

## Security Guidelines

**CRITICAL:** Security vulnerabilities MUST be prevented at all times. Follow these mandatory rules:

### API Security

1. **Rate Limiting:**
   - ALL API endpoints that perform file system operations MUST have rate limiting
   - Use `@fastify/rate-limit` for Fastify routes
   - Configure appropriate limits per endpoint based on resource intensity
   - Example:
     ```typescript
     app.get('/artifacts/:id/file', {
       config: { rateLimit: { max: 50, timeWindow: '1 minute' } }
     }, handler);
     ```

2. **Path Traversal Prevention:**
   - NEVER use user input directly in file paths with `path.join()`, `fs.readFile()`, etc.
   - ALWAYS validate inputs (check for empty strings, null bytes)
   - ALWAYS validate requested paths stay within allowed directories
   - ALWAYS resolve symlinks and validate the real path
   - Example secure file access function:
     ```typescript
     async function getSecureFile(baseDir: string, userPath: string, filename: string) {
       // Validate inputs (no empty strings, no null bytes)
       if (!userPath || userPath.includes('\0') || !filename || filename.includes('\0')) {
         throw new Error('Invalid path');
       }

       const base = resolve(baseDir);
       const requested = resolve(base, userPath, filename);

       // FIRST CHECK: Path must be within baseDir
       if (!requested.startsWith(base + sep)) {
         throw new Error('Path traversal detected');
       }

       // Verify file exists and is a regular file
       const fileStat = await stat(requested);
       if (!fileStat.isFile()) {
         throw new Error('Not a regular file');
       }

       // CRITICAL: Resolve symlinks and verify real path
       const realPath = await realpath(requested);

       // SECOND CHECK: Real path must still be within baseDir
       // This prevents symlink attacks
       if (!realPath.startsWith(base + sep)) {
         throw new Error('Symlink points outside allowed directory');
       }

       return await readFile(realPath);
     }
     ```

3. **Input Validation:**
   - Validate ALL user inputs at API boundaries
   - Reject malformed requests early
   - Use schema validation (Fastify schemas, Zod, etc.)
   - Sanitize inputs before use

4. **OWASP Top 10 Prevention:**
   - Command Injection: Never pass user input to shell commands
   - SQL Injection: Use parameterized queries (we use prepared statements)
   - XSS: Sanitize HTML output when serving user content
   - SSRF: Validate and restrict URLs for crawling
   - Insecure Deserialization: Validate JSON schemas

### Code Quality for Security

1. **Indentation and Formatting:**
   - ALWAYS maintain correct code indentation
   - Use Biome formatter before committing
   - Incorrect indentation can hide logic errors that lead to vulnerabilities

2. **Error Handling:**
   - Never expose internal errors to users
   - Log detailed errors internally
   - Return generic error messages externally
   - Handle all async rejections

3. **Testing:**
   - Write security tests for all validation logic
   - Test path traversal prevention
   - Test rate limiting behavior
   - Test input validation edge cases

### Pre-Commit Checklist

Before committing ANY code that:
- Accepts user input
- Performs file system operations
- Executes external commands
- Handles authentication/authorization

Verify:
- [ ] Rate limiting is applied (if file system or expensive operation)
- [ ] Path traversal is prevented (if file paths involved)
- [ ] Input validation is present
- [ ] Error handling doesn't leak information
- [ ] Tests cover security scenarios
- [ ] Code is properly formatted (run `npm run format`)

### Common Vulnerabilities to AVOID

**NEVER:**
- Use `path.join(baseDir, req.params.userId)` without validation
- Execute file operations without rate limiting
- Pass user input to `exec()`, `spawn()`, or similar
- Trust user input for file names, paths, or commands
- Skip input validation "just for MVP"

**ALWAYS:**
- Validate paths stay within allowed directories
- Apply rate limiting to resource-intensive endpoints
- Sanitize and validate all user inputs
- Use parameterized queries for database operations
- Test security features explicitly

## Development Workflow

### TDD Approach

Development follows Test-Driven Development:

1. **Unit Tests:**
   - Domain models and business logic
   - Comparison logic (HTML/SEO, visual, performance)
   - Mute rules and acceptance logic

2. **Integration Tests:**
   - Test server with controlled HTML/CSS
   - Crawler traversal and result saving
   - Comparison runs on modified versions

3. **E2E Tests:**
   - Full flow: create project → baseline → run → review

### Main Solo Developer Flow

1. Create new project with base URL
2. Run full crawl to establish baseline
3. Make code changes (outside tool)
4. Run comparison against baseline
5. Review differences (SEO, visual, performance)
6. Fix issues and rerun until acceptable
7. Accept or mute remaining differences

## Key Features

### Data Collection (Per Page)
- HTML and HTTP headers
- HTTP status and redirects
- SEO metadata extraction
- Full-page screenshots (configurable viewport)
- HAR files with performance metrics (optional)

### Comparison & Diff
- **HTML/SEO:** Changes in meta tags, content
- **Visual:** Pixel-by-pixel diff with threshold
- **Performance:** Load time, request count, total size changes

### Diff Management
- Mark differences as "accepted"
- Create mute rules from specific differences
- Filter by difference type
- Show/hide muted differences

### Export
- JSON manifest with project data
- Directory structure with all artifacts
- HTML, screenshots, diffs, HAR files

## Development Commands

### Initial Setup
```bash
# Install all dependencies (from root)
npm install

# Build shared types (required before backend)
npm run build:shared

# Build backend
npm run build:backend

# Or setup everything at once
npm run setup
```

```shell
npx playwright install
```

### Running the API Server
```bash
# Start backend server (default port 3000)
npm run dev:backend

# Or with custom port/data directory
PORT=3001 DATA_DIR=./my-data npm run dev:backend
```

The server will be available at `http://localhost:3000` with endpoints:
- `POST /api/v1/scans` - Create a scan (single page or crawl)
- `GET /api/v1/projects/:id` - Get project details with pages
- `GET /api/v1/artifacts/:pageId/*` - Get artifacts (screenshot, har, html)
- `GET /health` - Health check

**API Documentation:**
- Swagger UI is available at `http://localhost:3000/docs`
- Interactive API documentation with request/response examples
- Try out API endpoints directly from the browser

### Testing the API

**Quick test with curl:**
```bash
# Async scan (returns immediately)
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Sync scan (blocks until complete, returns full result)
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "sync": true}'

# Get project details
curl http://localhost:3000/api/v1/projects/{projectId}
```

**Scan options:**
```json
{
  "url": "https://example.com",
  "sync": true,
  "name": "My Project",
  "crawl": false,
  "viewport": { "width": 1920, "height": 1080 },
  "collectHar": false,
  "waitAfterLoad": 1000
}
```

### Backend Development
```bash
cd packages/backend

# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/domain/url-normalizer.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Build TypeScript
npm run build

# Start dev server with hot reload
npm run dev
```

### Test Structure
```
packages/backend/tests/
├── unit/                    # Unit tests (no external deps)
│   ├── domain/             # URL normalizer, etc.
│   └── storage/            # Repository tests
├── integration/            # Integration tests (with DB, mock server)
│   └── api/                # API endpoint tests
├── fixtures/               # Test data
│   └── html/               # HTML fixtures for SEO testing
└── helpers/                # Test utilities
    ├── mock-server.ts      # HTTP mock server
    ├── test-db.ts          # In-memory SQLite
    └── factories.ts        # Test data factories
```

### Frontend Development
```bash
cd packages/frontend
bun install
bun run dev              # Start dev server
bun test                 # Run tests
```

### Shared Types
```bash
cd packages/shared
npm install
npm run build            # Build types
npm test                 # Validate types
```

## Drizzle ORM Usage

Diff Voyager is migrating from raw SQL to Drizzle ORM for improved type safety and developer experience. The migration follows an incremental approach with dual implementations during transition.

### Repository Pattern with Drizzle

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

### Schema Definition

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

### JSON Columns

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

### Migration Status

- ✅ **PageRepository** - Fully migrated to Drizzle with 100% test coverage
- ⏳ **ProjectRepository** - Pending
- ⏳ **RunRepository** - Pending
- ⏳ **TaskQueue** - Pending
- ⏳ **SnapshotRepository** - Pending
- ⏳ **DiffRepository** - Pending

See `/docs/05-drizzle-migration-plan.md` for detailed migration progress.

### Benefits

- **Type Safety**: Compile-time type checking prevents SQL errors
- **Security**: Automatic prepared statements eliminate SQL injection risks
- **Developer Experience**: IDE autocomplete for queries and schema
- **Zero Runtime Overhead**: Thin abstraction over SQL with no performance penalty
- **JSON Support**: First-class support for JSON columns with type inference

## Testing Strategy

### Backend Tests
- Domain model tests
- Crawler integration tests
- API endpoint tests
- Comparison logic tests

### Frontend Tests
- Component tests
- View integration tests
- Type validation tests

## Non-Functional Requirements

- **Local operation:** No permanent internet required
- **Performance:** Handle hundreds of pages reasonably
- **Stability:** Resume after interruption
- **Security:** Anonymize sensitive fields via rules

## Risks & Mitigations

- **Dynamic content:** Use CSS/XPath filters and mute rules
- **Large websites:** Page/time limits, restricted artifact profiles
- **Simple visual diff:** Pixel-by-pixel may have false positives
- **No advanced auth:** MVP doesn't support complex login

## Success Criteria

- Complete framework migration without losing SEO elements
- Identify critical regressions in 1-2 comparison runs
- Transparent report for focused review session
- Stable operation on typical project sizes

## Future Enhancements (Out of MVP Scope)

- CI/CD integration
- SEO tool integration
- Email/Slack notifications
- Advanced visual diff algorithms
- Multi-user support
- Docker deployment

## Contributing

When working on Diff Voyager:

1. Read the PRD in `.claude/PRD.md`
2. Follow TDD - write tests first
3. Use shared TypeScript types
4. Keep changes focused and simple
5. Update documentation as needed

## Git Workflow

- Main branch: (check git status)
- Feature branches: Use descriptive names
- **Commit messages: MUST use Conventional Commits format**
  - Format: `<type>(<scope>): <description>`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
  - Example: `feat(backend): add page snapshot comparison logic`
  - Example: `fix(frontend): resolve visual diff rendering issue`
  - Example: `docs: update CLAUDE.md with commit guidelines`
- Push regularly to backup work
