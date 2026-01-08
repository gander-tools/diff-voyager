# Architecture Overview

## System Design

Diff Voyager is a local website version comparison tool designed for solo developers upgrading frameworks and dependencies. It verifies that code changes maintain visual correctness, content integrity, SEO compliance, and performance metrics.

## Monorepo Structure

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

### Package Responsibilities

#### Backend (`packages/backend/`)

Node.js application providing core functionality:

```
packages/backend/src/
├── api/                  # Fastify HTTP API
│   ├── routes/          # REST API endpoints
│   ├── middleware/      # Request validation, rate limiting
│   └── app.ts           # Fastify application setup
├── crawler/             # Browser automation and page capture
│   ├── browser-manager.ts    # Playwright browser pooling
│   ├── page-capturer.ts      # Single page capture
│   ├── single-page-processor.ts  # Orchestration
│   └── site-crawler.ts       # Multi-page crawling with Crawlee
├── domain/              # Business logic
│   ├── url-normalizer.ts     # URL normalization
│   ├── seo-comparator.ts     # SEO diff detection
│   ├── visual-comparator.ts  # Screenshot comparison
│   ├── header-comparator.ts  # HTTP header diff
│   ├── performance-comparator.ts  # Performance metrics
│   └── page-comparator.ts    # Full page comparison orchestration
├── storage/             # Persistence layer
│   ├── repositories/    # Data access (Drizzle ORM)
│   ├── drizzle/         # Schema and migrations
│   └── artifact-storage.ts   # File system storage
├── queue/               # Asynchronous task processing
│   ├── task-queue.ts    # SQLite-based queue
│   └── task-processor.ts     # Background worker
└── services/            # High-level orchestration
    └── scan-processor.ts     # Scan workflow coordination
```

#### Frontend (`packages/frontend/`)

Vue 3 application for project and diff management:

```
packages/frontend/src/
├── views/               # Page components
├── components/          # Reusable UI components
├── stores/              # Pinia state management
├── router/              # Vue Router configuration
└── services/            # API client
```

**Status**: Planned but not yet implemented

#### Shared (`packages/shared/`)

TypeScript types shared between backend and frontend:

```
packages/shared/src/
├── types/               # Domain models and API contracts
│   ├── project.ts
│   ├── run.ts
│   ├── page.ts
│   ├── snapshot.ts
│   ├── diff.ts
│   ├── api-requests.ts
│   └── api-responses.ts
└── constants.ts         # Shared constants
```

## Component Relationships

### Data Flow: Single Page Scan

```
API Request (POST /scans)
    ↓
ScanProcessor
    ↓
SinglePageProcessor
    ↓
PageCapturer (Playwright)
    ↓
[HTML, Screenshot, SEO, HAR]
    ↓
SnapshotRepository (Drizzle ORM)
    ↓
ArtifactStorage (File System)
    ↓
API Response
```

### Data Flow: Crawl Scan

```
API Request (POST /scans with crawl:true)
    ↓
ScanProcessor
    ↓
SiteCrawler (Crawlee)
    ↓
[URL Discovery] → TaskQueue
    ↓
TaskProcessor (background)
    ↓
SinglePageProcessor (per URL)
    ↓
PageCapturer (Playwright)
    ↓
Repositories + ArtifactStorage
```

### Data Flow: Comparison

```
Baseline Run (stored)
    ↓
New Comparison Run
    ↓
PageComparator
    ├→ SEOComparator
    ├→ VisualComparator (pixelmatch)
    ├→ HeaderComparator
    └→ PerformanceComparator
    ↓
DiffRepository
    ↓
API Response (GET /pages/:id/diff)
```

## Deployment Architecture

### Local Development

```
┌─────────────────┐
│   Developer     │
│   Machine       │
├─────────────────┤
│                 │
│  Backend API    │
│  (Node.js)      │
│  Port 3000      │
│                 │
│  SQLite DB      │
│  + Artifacts    │
│  (./data/)      │
│                 │
│  (Future)       │
│  Frontend UI    │
│  (Vue 3)        │
│  Port 5173      │
│                 │
└─────────────────┘
```

### Planned: Docker Deployment

```
┌──────────────────────┐
│   Docker Compose     │
├──────────────────────┤
│                      │
│  ┌────────────────┐  │
│  │ Backend        │  │
│  │ Container      │  │
│  │ (Node.js)      │  │
│  └────────────────┘  │
│          ↓           │
│  ┌────────────────┐  │
│  │ Frontend       │  │
│  │ Container      │  │
│  │ (Nginx+Vue)    │  │
│  └────────────────┘  │
│          ↓           │
│  ┌────────────────┐  │
│  │ Volume         │  │
│  │ (SQLite + Data)│  │
│  └────────────────┘  │
│                      │
└──────────────────────┘
```

**Status**: Out of MVP scope

## Security Architecture

### API Security

1. **Rate Limiting**: All endpoints protected with `@fastify/rate-limit`
2. **Path Traversal Prevention**:
   - Input validation (null bytes, empty strings)
   - Path resolution and boundary checking
   - Symlink validation
3. **Input Validation**: JSON schema validation on all requests
4. **SQL Injection Prevention**: Drizzle ORM with automatic prepared statements

### File System Security

```typescript
// Secure file access pattern
async function getArtifact(pageId: string, filename: string) {
  // 1. Validate inputs
  if (!pageId || pageId.includes('\0')) throw new Error('Invalid page ID');

  // 2. Resolve path
  const artifactPath = resolve(ARTIFACTS_DIR, pageId, filename);

  // 3. Check bounds
  if (!artifactPath.startsWith(ARTIFACTS_DIR)) {
    throw new Error('Path traversal detected');
  }

  // 4. Resolve symlinks
  const realPath = await realpath(artifactPath);

  // 5. Verify real path still within bounds
  if (!realPath.startsWith(ARTIFACTS_DIR)) {
    throw new Error('Symlink points outside allowed directory');
  }

  return readFile(realPath);
}
```

## Performance Considerations

### Browser Pooling

- Single browser instance reused across page captures
- Race condition handling for concurrent requests
- Graceful browser cleanup on shutdown

### Database Optimization

- SQLite with WAL mode for concurrent reads
- Drizzle ORM for zero-overhead queries
- Indexes on frequently queried columns

### Task Queue

- SQLite-based queue (no external dependencies)
- Priority-based scheduling
- Stale task recovery
- Configurable retry logic

### Artifact Storage

- File system storage (no database overhead for binary data)
- Lazy diff generation (on-demand)
- Configurable artifact profiles (reduce disk usage)

## Scalability Limits

**MVP Target**: Hundreds of pages per project

**Current Limitations**:
- Single-threaded task processor
- Local file system storage
- SQLite (single-writer)
- No distributed processing

**Future Enhancements** (post-MVP):
- Multi-threaded processing
- Remote storage (S3, etc.)
- PostgreSQL for larger datasets
- Distributed queue (BullMQ + Redis)

## See Also

- [Domain Model](domain-model.md) - Entity relationships and business logic
- [Technology Stack](technology-stack.md) - Detailed technology choices
- [API Overview](../api/overview.md) - API design and endpoints
