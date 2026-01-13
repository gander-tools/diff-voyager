# Diff Voyager - Claude Code Development Guide

## Documentation Index

**Complete Documentation**: See [docs/README.md](docs/README.md) for full documentation index.

### Quick Links

**Getting Started**:
- [Installation & Setup](docs/guides/getting-started.md)
- [Development Workflow](docs/guides/development-workflow.md)
- [Testing Strategy](docs/guides/testing-strategy.md)

**Architecture**:
- [Architecture Overview](docs/architecture/overview.md)
- [Domain Model](docs/architecture/domain-model.md)
- [Technology Stack](docs/architecture/technology-stack.md)

**Development Status**:
- [Implementation Status](docs/development/implementation-status.md) - Current phase completion and major milestones
- [Roadmap](docs/development/roadmap.md) - Planned features

**API Reference**:
- [API Overview](docs/api/overview.md)
- [Endpoints](docs/api/endpoints.md)
- [Types](docs/api/types.md)

## Project Overview

Diff Voyager is a local website version comparison tool designed for solo developers upgrading frameworks and dependencies. It verifies that code changes maintain visual correctness, content integrity, SEO compliance, and performance metrics.

## Architecture

### Monorepo Structure

```
diff-voyager/
├── packages/
│   ├── backend/          # Node.js + TypeScript crawler & API
│   ├── frontend/         # Vue 3 + TypeScript UI
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
- Naive UI component library
- vee-validate + Zod for form validation
- Pinia for state management
- Vue Router for routing
- @ts-rest for type-safe API calls
- Built with Vite

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

# Configure log levels via environment variables
LOG_LEVEL_CONSOLE=info LOG_LEVEL_FILE=debug npm run dev:backend

# Or via CLI arguments (takes priority over env vars)
node packages/backend/dist/index.js --log-level-console info --log-level-file debug

# All available options
node packages/backend/dist/index.js \
  --port 3001 \
  --data-dir ./my-data \
  --log-level-console warn \
  --log-level-file debug
```

**Log Level Configuration:**
- **Environment variables:** `LOG_LEVEL_CONSOLE`, `LOG_LEVEL_FILE` (or `LOG_LEVEL` for both)
- **CLI flags:** `--log-level-console`, `--log-level-file` (or `--log-level` for both)
- **Priority:** CLI flags > environment variables > defaults
- **Valid levels:** `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- **Defaults:** Console=`debug` (dev) or `info` (prod), File=`debug`

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
npm install
npm run dev              # Start dev server
npm test                 # Run tests
```

#### Common Frontend Issues

**Vue 3 Component Resolution Errors**

If you see console errors like:
```
[Vue warn]: Failed to resolve component: NButton
[Vue warn]: Failed to resolve component: DefaultLayout
```

**Root Cause**: Vue 3 requires explicit imports for all components. Components cannot be used in templates without importing them first.

**Solution**: Add explicit imports at the top of the `<script setup>` section:

```typescript
// For Naive UI components
import { NButton, NCard, NLayout } from 'naive-ui';

// For custom components
import DefaultLayout from './components/layouts/DefaultLayout.vue';

// For router components
import { RouterView } from 'vue-router';
```

**Note on @vicons/tabler**: Ensure the package is installed:
```bash
npm install @vicons/tabler
```

Available icon names can be found in `node_modules/@vicons/tabler/es/`. Common icons:
- `Dashboard`, `Settings`, `Filter`
- `Folder` (note: `FolderOpen` does not exist)
- `Globe`, `Moon`, `Sun`
- `PlaylistAdd`, `Playlist`

Import icons with exact PascalCase names:
```typescript
import { Dashboard, Filter, Folder } from '@vicons/tabler';
```

#### Form Validation with vee-validate

**Status**: ✅ Implemented (January 2026)

Diff Voyager uses [vee-validate](https://vee-validate.logaretm.com/) with Zod schemas for declarative form validation in Vue 3.

**Dependencies:**
- `vee-validate@^4.15.1` - Vue 3 form validation library
- `@vee-validate/zod@^4.15.1` - Zod schema integration
- `zod@^3.25.76` - Schema validation (compatible with @ts-rest and vee-validate)

**Why vee-validate + Zod?**

- **Declarative validation**: Define validation rules in Zod schemas, not imperative code
- **Type-safe**: Full TypeScript inference from schemas
- **DRY principle**: Single source of truth for validation and types
- **Better UX**: Built-in support for validation on blur/change/submit
- **Clean code**: No manual error state management

**Example Usage:**

```typescript
// 1. Define Zod schema in validators.ts
export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required'),
  url: z.string().url('Invalid URL format'),
  // ... more fields
});

// 2. Use in Vue component
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';

const { handleSubmit, errors, defineField, validate } = useForm({
  validationSchema: toTypedSchema(createProjectSchema),
  initialValues: { name: '', url: '' },
});

// 3. Define form fields
const [name] = defineField('name');
const [url] = defineField('url');

// 4. Handle submission
const onSubmit = handleSubmit((values) => {
  // values is fully typed from schema
  emit('submit', values);
});
```

**Key Features:**

- **Nested fields**: Use dot notation for nested validation (`viewport.width`)
- **Async validation**: Built-in support for async rules
- **Multi-step forms**: Validate specific fields using `validate()`
- **Integration with Naive UI**: Works seamlessly with NForm components

**Important Notes:**

- vee-validate requires `zod@^3.x` (not v4) for compatibility
- All form validation should use vee-validate for consistency
- Error messages should be defined in Zod schemas, not in components
- Test async validation with proper awaits: `await wrapper.vm.$nextTick()`

See `packages/frontend/src/components/ProjectForm.vue` for a complete multi-step form example.

#### Screenshot Updates

**Status**: ✅ Automated screenshot generation available

Diff Voyager automatically generates documentation screenshots for all UI views.

**When to Update Screenshots**:
- After implementing new views or pages
- After making visual changes to existing views
- After UI/UX improvements
- Before committing frontend changes

**How to Update**:
```bash
# Ensure backend is not running (script will start it automatically)
npm run screenshots
```

**What Happens**:
1. Script starts backend server automatically
2. Script starts frontend dev server
3. Creates test project via API
4. Captures 11 screenshots (1024x768) using Playwright
5. Saves to `docs/screenshots/*.png`
6. Stops both servers

**Screenshot Files**:
- `01-dashboard.png` - Main dashboard
- `02-projects-list.png` - Project list with pagination
- `03-project-create.png` - Multi-step project creation
- `04-project-detail.png` - Project detail view
- `05-run-create.png` - Run creation form
- `06-run-detail.png` - Run detail and results
- `07-page-detail.png` - Page comparison details
- `08-rules-list.png` - Mute rules list
- `09-rule-create.png` - Rule creation form
- `10-settings.png` - Application settings
- `11-not-found.png` - 404 page

**Important Notes**:
- Screenshots are **version controlled** in git (included in commits)
- Used in documentation: `frontend-status.md`, `implementation-status.md`
- Viewport: 1024x768 (configurable in script)
- See `docs/screenshots/README.md` for complete index

**Troubleshooting**:
- If script fails, ensure no servers are running on ports 3000 or 5173
- Check Playwright installation: `npx playwright install`
- Backend must be buildable: `npm run build:backend`

### Shared Types
```bash
cd packages/shared
npm install
npm run build            # Build types
npm test                 # Validate types
```

## @ts-rest Type-Safe API Contract

**Status**: ✅ Implemented (January 2026)

Diff Voyager uses [@ts-rest](https://ts-rest.com/) for type-safe API communication between frontend and backend with a single source of truth.

### Why @ts-rest?

- **Single Source of Truth**: API contract defined once in `packages/shared/src/api-contract.ts`
- **Compile-Time Type Safety**: TypeScript catches mismatches between frontend and backend
- **Zero Hardcoded Paths**: Routes generated automatically from contract
- **Runtime Validation**: Zod schemas validate all requests/responses
- **Better DX**: Full IDE autocomplete for all API calls

### API Contract Structure

The API contract is defined in `packages/shared/src/api-contract.ts`:

```typescript
import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Define Zod schemas for validation
const createScanBodySchema = z.object({
  url: z.string().url(),
  sync: z.boolean().optional(),
  name: z.string().optional(),
  // ... more fields
});

// Define the API contract
export const apiContract = c.router({
  createScan: {
    method: 'POST',
    path: '/scans',
    responses: {
      200: projectDetailsSchema,
      202: createScanAsyncResponseSchema,
      400: errorResponseSchema,
    },
    body: createScanBodySchema,
    summary: 'Create a new scan or crawl',
  },
  // ... more endpoints
});
```

### Backend Implementation (@ts-rest/fastify)

Backend routes in `packages/backend/src/api/routes-ts-rest.ts`:

```typescript
import { apiContract } from '@gander-tools/diff-voyager-shared';
import { initServer } from '@ts-rest/fastify';

export function createTsRestRoutes(config: TsRestRoutesConfig) {
  const s = initServer();

  const router = s.router(apiContract, {
    createScan: {
      handler: async ({ body }) => {
        // body is fully typed from contract!
        const project = await projectRepo.create({
          name: body.name || `Scan: ${body.url}`,
          // ...
        });

        if (body.sync) {
          return { status: 200 as const, body: projectDetails };
        }

        return { status: 202 as const, body: { projectId, status: 'PENDING' } };
      },
    },
    // ... more handlers
  });

  return { router, s };
}

// Register in app.ts
await app.register(tsRestServer.plugin(tsRestRouter), {
  prefix: API_BASE_PATH,
});
```

### Frontend Client (@ts-rest/core)

Frontend client in `packages/frontend/src/services/api/client.ts`:

```typescript
import { initClient } from '@ts-rest/core';
import { apiContract } from '@gander-tools/diff-voyager-shared';

export const tsRestClient = initClient(apiContract, {
  baseUrl: API_BASE_URL,
  baseHeaders: {},
  api: async ({ path, method, headers, body }) => {
    // Use existing retry logic with ofetch
    const response = await fetchWithRetry(path, { method, headers, body });
    return { status: 200, body: response, headers: new Headers() };
  },
});
```

Using the client in services:

```typescript
// packages/frontend/src/services/api/projects.ts
import { tsRestClient } from './client';

export async function createScan(request: CreateScanRequest) {
  const result = await tsRestClient.createScan({ body: request });

  if (result.status === 200) {
    return result.body; // Fully typed!
  }

  if (result.status === 202) {
    return result.body; // Different type, also typed!
  }

  throw new Error('Failed to create scan');
}
```

### Key Features

1. **Query Parameter Coercion**: Use `z.coerce.number()` and `z.coerce.boolean()` for query params (they come as strings from URLs):
   ```typescript
   const listProjectsQuerySchema = z.object({
     limit: z.coerce.number().int().min(1).max(100).optional(),
     offset: z.coerce.number().int().min(0).optional(),
   });
   ```

2. **Multiple Response Types**: Handle different status codes with type safety:
   ```typescript
   responses: {
     200: projectDetailsSchema,      // Success
     202: asyncResponseSchema,        // Accepted
     400: errorResponseSchema,        // Bad Request
     404: errorResponseSchema,        // Not Found
   }
   ```

3. **Path Parameters**: Validated with Zod:
   ```typescript
   params: z.object({
     projectId: z.string().uuid(),
   })
   ```

### Testing

**Backend Tests** (`packages/backend/tests/integration/api/ts-rest-routes.test.ts`):
```typescript
it('should create async scan and return 202', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/scans',
    payload: { url: 'https://example.com', sync: false },
  });

  expect(response.statusCode).toBe(202);
  const body = JSON.parse(response.body);
  expect(body).toHaveProperty('projectId');
  expect(body).toHaveProperty('status', 'PENDING');
});
```

**Frontend Tests** (use MSW to mock responses):
```typescript
import { HttpResponse, http } from 'msw';

server.use(
  http.get(`${API_BASE_URL}/projects`, () => {
    return HttpResponse.json({
      projects: [...],
      pagination: { total: 2, limit: 50, offset: 0, hasMore: false },
    });
  }),
);

const projects = await listProjects();
expect(projects).toHaveLength(2);
```

### Available Endpoints

All endpoints registered at `/api/v1`:

| Method | Path | Contract Name | Description |
|--------|------|---------------|-------------|
| POST | `/scans` | `createScan` | Create new scan (sync or async) |
| GET | `/projects` | `listProjects` | List all projects with pagination |
| GET | `/projects/:projectId` | `getProject` | Get project details |
| GET | `/projects/:projectId/runs` | `listProjectRuns` | List runs for project |
| POST | `/projects/:projectId/runs` | `createProjectRun` | Create new run |
| GET | `/runs/:runId` | `getRunDetails` | Get run details |
| GET | `/pages/:pageId` | `getPageDetails` | Get page details |

### Best Practices

1. **Always update the contract first** when adding new endpoints
2. **Run `npm run build:shared`** after changing the contract
3. **Use `z.coerce` for query parameters** to handle string-to-number conversion
4. **Type narrow response status** with `as const` for proper type inference
5. **Keep error responses consistent** using `errorResponseSchema`

### Migration Status

- ✅ **API Contract Defined**: 7 endpoints in `packages/shared/src/api-contract.ts`
- ✅ **Backend Integration**: All endpoints implemented with @ts-rest/fastify
- ✅ **Frontend Client**: Type-safe client replacing hardcoded API calls
- ✅ **Testing**: 20/20 backend tests, 63/63 frontend tests passing
- ✅ **Documentation**: Usage examples and best practices documented

See [PR #118](https://github.com/gander-tools/diff-voyager/pull/118) for full implementation details.

## Drizzle ORM Usage

**Status**: ✅ Migration Complete (January 2026)

Diff Voyager has successfully migrated from raw SQL to Drizzle ORM. All repositories now use Drizzle for type-safe database queries with automatic prepared statements.

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

All repositories have been successfully migrated to Drizzle ORM:

- ✅ **PageRepository** - Fully migrated with 13 unit tests
- ✅ **ProjectRepository** - Fully migrated with 13 unit tests
- ✅ **RunRepository** - Fully migrated with 16 unit tests
- ✅ **TaskQueue** - Fully migrated with 19 unit tests
- ✅ **SnapshotRepository** - Fully migrated with 14 unit tests
- ✅ **DiffRepository** - Fully migrated with 9 unit tests

**Total**: 25/25 migration tasks complete (100%)

See [docs/guides/drizzle-migration.md](docs/guides/drizzle-migration.md) for detailed migration history and patterns.

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

## TODO Management

**Policy:** All TODOs must be created as GitHub Issues and linked in documentation.

### Issue Types

The project uses GitHub Issue Types to categorize work:

- **Bug** (🔴 red) - Unexpected problems, test failures, regressions
- **Feature** (🔵 blue) - New functionality, enhancements, user-facing improvements
- **Task** (🟡 yellow) - Implementation work, refactoring, technical tasks

### Milestones

Development is tracked through phase-specific milestones:

- [Milestone #1: Documentation TODO Cleanup](https://github.com/gander-tools/diff-voyager/milestone/1) - Fix skipped tests
- [Milestone #2: Phase 6: Integration Workflows](https://github.com/gander-tools/diff-voyager/milestone/2) - Due Jan 24, 2026
- [Milestone #3: Phase 7: Production Polish](https://github.com/gander-tools/diff-voyager/milestone/3) - Due Feb 7, 2026
- [Milestone #4: Backend MVP Complete](https://github.com/gander-tools/diff-voyager/milestone/4) - Due Feb 21, 2026
- [Milestone #5: Frontend Phase 3: Run Management](https://github.com/gander-tools/diff-voyager/milestone/5) - Due Mar 31, 2026
- [Milestone #6: Frontend Phase 4: Diff Review](https://github.com/gander-tools/diff-voyager/milestone/6) - Due Apr 30, 2026
- [Milestone #7: Frontend MVP Complete](https://github.com/gander-tools/diff-voyager/milestone/7) - Due May 31, 2026
- [Milestone #8: v1.0 Public Release](https://github.com/gander-tools/diff-voyager/milestone/8) - Due Jun 30, 2026

### Creating New TODOs

1. **Create GitHub Issue:**
   - Use Conventional Commits format for title: `<type>(<scope>): <description>`
   - **Set Issue Type:** Bug, Feature, or Task (required)
   - Add appropriate labels: scope (backend/frontend/shared), priority (high/medium/low)
   - **Add to milestone:** Choose appropriate phase milestone
   - Assign to appropriate person

2. **Link in Documentation:**
   - Reference issue in documentation: `🔗 [Issue #X](https://github.com/gander-tools/diff-voyager/issues/X)`
   - Keep documentation concise, details in GitHub issue
   - Update documentation when issue status changes

3. **Avoid Inline TODOs:**
   - Don't add `// TODO:` comments in code without corresponding issue
   - Code TODOs should reference GitHub issue: `// TODO(#123): Fix this`

### Examples

**Good:**
```markdown
### Next Steps

- [ ] Implement project export → [Issue #150](https://github.com/gander-tools/diff-voyager/issues/150)
- [ ] Add diff filtering → [Issue #165](https://github.com/gander-tools/diff-voyager/issues/165)
```

**Avoid:**
```markdown
### Next Steps

- [ ] Implement project export
  - JSON manifest generation
  - Artifact bundling
  - Zip archive creation
  [... long detailed description ...]
```

## Issue Management and Dependency Tracking

**Policy:** All feature implementation must follow structured issue hierarchy with explicit dependency tracking.

### Issue Hierarchy Structure

Every major feature (Phase) should have:

1. **Parent Issue** - Epic tracking all sub-issues
   - Contains tasklist with links to all sub-issues
   - Groups sub-issues by implementation level
   - Tracks overall acceptance criteria

2. **Sub-Issues** - Organized in 4 levels based on dependencies

#### Level 1: Atomic Components (No Dependencies)

- Building blocks that don't depend on other issues
- Can be implemented in parallel
- Typically `size/small` or `size/medium`
- Examples: RunCard, RunForm, RunStatusBadge

**Issue Body Format:**
```markdown
## Description
[Component description]

## Level
**Level 1: Atomic Component** (no dependencies)

## Implementation
[Technical details]
```

#### Level 2: Composite Views (Depend on Level 1)

- Views that use atomic components
- Can be implemented in parallel once their dependencies are ready
- Typically `size/medium` or `size/large`
- Must document dependencies in issue body and comments

**Issue Body Format:**
```markdown
## Description
[View description]

## Level
**Level 2: Composite View**

## Dependencies
Depends on:
- #X (ComponentName) - description
- #Y (ComponentName) - description

## Implementation
[Technical details - how components are used]
```

**Required Comment:**
```markdown
**Dependencies:** Depends on #X (ComponentName), #Y (ComponentName)
```

#### Level 3: Integration (Depends on All Views)

- Single issue that connects everything together
- Routing, navigation, store integration, API wiring
- Depends on ALL Level 1 + Level 2 issues
- Typically `size/medium`

**Issue Body Format:**
```markdown
## Description
Integrate all [FeatureName] components and views into complete workflow.

## Level
**Level 3: Integration** (depends on all components and views)

## Integration Tasks
- [ ] Add routes to Vue Router
- [ ] Wire up store (Pinia) with CRUD actions
- [ ] Add navigation links in parent views
- [ ] Connect API services
- [ ] Add breadcrumbs and navigation

## Dependencies
Depends on:
- Level 1: #A, #B, #C (all components)
- Level 2: #X, #Y, #Z (all views)

Blocks: #[PARENT] (parent issue)
```

#### Level 4: Testing (Depends on Integration)

- E2E tests for complete feature flow
- Depends on Integration issue being complete
- Blocks parent issue from being closed
- Typically `size/medium`

**Issue Body Format:**
```markdown
## Description
Add end-to-end tests for [FeatureName] workflow.

## Level
**Level 4: Testing** (depends on integration)

## Test Scenarios
- [ ] Happy path: [flow description]
- [ ] Error handling: [scenarios]
- [ ] Edge cases: [scenarios]

## Dependencies
Depends on: #[INTEGRATION_ISSUE] (Integration)
Blocks: #[PARENT] (parent issue - cannot close without E2E tests)
```

### Example: Run Management (Phase 3)

**Levels:**
- Level 1: 5 atomic components (RunCard, RunForm, RunStatusBadge, RunProgress, RunStatistics)
- Level 2: 3 composite views (RunListView, RunCreateView, RunDetailView)
- Level 3: 1 integration (Routing + Store + Navigation)
- Level 4: 1 E2E testing

**Dependency Matrix:**
```
Issue      | Level | Depends On
-----------|-------|------------------
#188       | 1     | - (atomic)
#189       | 1     | - (atomic)
#190       | 1     | - (atomic)
#191       | 1     | - (atomic)
#192       | 1     | - (atomic)
#185       | 2     | #188
#186       | 2     | #189
#187       | 2     | #190, #191, #192
#235       | 3     | #185, #186, #187 (+ all L1)
#236       | 4     | #235
#179       | Epic  | #236 (+ all others)
```

### Execution Rules

1. **Cannot start Level N until all dependencies from Level N-1 are CLOSED**
2. **Within a level, issues can be worked on in parallel** (if dependencies met)
3. **Parent issue stays OPEN until ALL sub-issues (including E2E) are CLOSED**
4. **Always add dependency comments to issues** for GitHub tracking

### Creating Issues for New Feature

**Checklist:**
- [ ] Create parent issue with tasklist grouped by levels
- [ ] Create all Level 1 issues (atomic components)
- [ ] Create all Level 2 issues (composite views) with dependencies documented
- [ ] Create Level 3 issue (integration) depending on all Level 1 + 2
- [ ] Create Level 4 issue (E2E tests) depending on integration
- [ ] Add dependency comments to ALL issues except Level 1
- [ ] Assign to milestone
- [ ] Add appropriate labels (size, priority, scope)

### Benefits

- ✅ Clear execution order prevents premature implementation
- ✅ Parallel work possible within levels
- ✅ Dependencies visible in GitHub
- ✅ Parent issue tracks progress across levels
- ✅ Easy to identify what's blocking vs. what's ready
