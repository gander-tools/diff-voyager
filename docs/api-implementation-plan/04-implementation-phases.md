# Implementation Phases

## Overview

Implementation follows TDD methodology. Each phase:
1. Write tests first (Red)
2. Implement minimal code to pass (Green)
3. Refactor while maintaining green tests

## Phase 0: Foundation Setup

### 0.1 Test Infrastructure

**Tasks:**
- [ ] Configure Vitest for backend package
- [ ] Create test directory structure
- [ ] Implement Mock Server helper class
- [ ] Implement test database helper
- [ ] Create factory functions for test data
- [ ] Create async helper functions

**Files to create:**
```
packages/backend/
├── vitest.config.ts
└── tests/
    ├── setup.ts
    └── helpers/
        ├── mock-server.ts
        ├── test-db.ts
        ├── factories.ts
        └── async.ts
```

**Deliverable:** Running `npm test` executes test suite (empty but functional)

### 0.2 HTML Fixtures

**Tasks:**
- [ ] Create baseline HTML fixtures
- [ ] Create SEO change variants
- [ ] Create header change configurations
- [ ] Create content change variants
- [ ] Create edge case fixtures

**Files to create:**
```
packages/backend/tests/fixtures/
├── html/
│   ├── index.ts
│   ├── baseline.ts
│   ├── seo-changes.ts
│   ├── content-changes.ts
│   └── edge-cases.ts
└── screenshots/
    └── .gitkeep
```

### 0.3 Shared Types Extension

**Tasks:**
- [ ] Add queue types to shared package
- [ ] Add API request types
- [ ] Add API response types
- [ ] Add constants
- [ ] Build and verify exports

**Files to create/modify:**
```
packages/shared/src/
├── types/
│   ├── queue.ts (new)
│   ├── api-requests.ts (new)
│   └── api-responses.ts (new)
├── constants.ts (new)
└── index.ts (update exports)
```

---

## Phase 1: Storage Layer

### 1.1 Database Schema

**Tasks:**
- [ ] Write migration tests
- [ ] Create SQLite database setup
- [ ] Create migration runner
- [ ] Create initial schema migration
- [ ] Verify schema correctness

**Files to create:**
```
packages/backend/src/storage/
├── database.ts
├── migrations/
│   ├── runner.ts
│   └── 001-initial-schema.ts
└── types.ts
```

**Tests first:**
```typescript
describe('Database Setup', () => {
  it('should create database file', async () => { ... });
  it('should run migrations', async () => { ... });
  it('should create all tables', async () => { ... });
});
```

### 1.2 Project Repository

**Tasks:**
- [ ] Write ProjectRepository tests
- [ ] Implement create method
- [ ] Implement findById method
- [ ] Implement findAll method
- [ ] Implement update method

**Tests first:**
```typescript
describe('ProjectRepository', () => {
  describe('create', () => {
    it('should insert project record', async () => { ... });
    it('should return created project with id', async () => { ... });
  });
  describe('findById', () => {
    it('should return project when exists', async () => { ... });
    it('should return null when not exists', async () => { ... });
  });
});
```

### 1.3 Run Repository

**Tasks:**
- [ ] Write RunRepository tests
- [ ] Implement create method
- [ ] Implement findById method
- [ ] Implement findByProjectId method
- [ ] Implement updateStatus method
- [ ] Implement updateStatistics method

### 1.4 Page Repository

**Tasks:**
- [ ] Write PageRepository tests
- [ ] Implement create method
- [ ] Implement findById method
- [ ] Implement findByProjectId method
- [ ] Implement findByNormalizedUrl method

### 1.5 Snapshot Repository

**Tasks:**
- [ ] Write SnapshotRepository tests
- [ ] Implement create method
- [ ] Implement findById method
- [ ] Implement findByPageAndRun method
- [ ] Implement update method

### 1.6 Diff Repository

**Tasks:**
- [ ] Write DiffRepository tests
- [ ] Implement create method
- [ ] Implement findByPageAndRun method
- [ ] Implement findByRun method

### 1.7 Artifact Storage

**Tasks:**
- [ ] Write ArtifactStorage tests
- [ ] Implement directory structure creation
- [ ] Implement saveScreenshot method
- [ ] Implement saveDiffImage method
- [ ] Implement saveHar method
- [ ] Implement saveHtml method
- [ ] Implement getPath method
- [ ] Implement readArtifact method

**Files to create:**
```
packages/backend/src/storage/
├── artifact-storage.ts
└── repositories/
    ├── project-repository.ts
    ├── run-repository.ts
    ├── page-repository.ts
    ├── snapshot-repository.ts
    └── diff-repository.ts
```

---

## Phase 2: Domain Logic

### 2.1 URL Normalizer

**Tasks:**
- [ ] Write URL normalizer tests
- [ ] Implement path normalization
- [ ] Implement query parameter handling
- [ ] Implement fragment removal
- [ ] Implement tracking parameter removal

**Tests first:**
```typescript
describe('UrlNormalizer', () => {
  it('should remove trailing slash', () => { ... });
  it('should lowercase path', () => { ... });
  it('should sort query parameters', () => { ... });
  it('should remove tracking parameters', () => { ... });
});
```

### 2.2 SEO Extractor & Comparator

**Tasks:**
- [ ] Write SEO extraction tests with Mock Server
- [ ] Implement extractSeoData from HTML
- [ ] Write SEO comparison tests
- [ ] Implement compareSeoData
- [ ] Implement severity classification

**Tests use Mock Server:**
```typescript
describe('SeoComparator', () => {
  let mockServer: MockServer;

  beforeAll(async () => {
    mockServer = new MockServer({ routes: [...] });
    await mockServer.start();
  });

  it('should extract title from HTML', async () => {
    const html = HTML_FIXTURES.baseline.simple;
    const seo = SeoComparator.extractSeoData(html);
    expect(seo.title).toBe('Test Page Title');
  });
});
```

### 2.3 Visual Comparator

**Tasks:**
- [ ] Write visual comparison tests
- [ ] Implement pixelmatch integration
- [ ] Implement diff percentage calculation
- [ ] Implement threshold checking
- [ ] Implement diff image generation

### 2.4 Header Comparator

**Tasks:**
- [ ] Write header comparison tests
- [ ] Implement header diff detection
- [ ] Implement added/removed header detection
- [ ] Implement severity classification

### 2.5 Performance Comparator

**Tasks:**
- [ ] Write performance comparison tests
- [ ] Implement metric comparison
- [ ] Implement percentage change calculation
- [ ] Implement threshold checking

### 2.6 Full Page Comparator

**Tasks:**
- [ ] Write full comparison tests
- [ ] Implement orchestration of all comparators
- [ ] Implement DiffSummary generation
- [ ] Implement Change list generation

**Files to create:**
```
packages/backend/src/
├── domain/
│   └── url-normalizer.ts
└── comparison/
    ├── types.ts
    ├── seo-comparator.ts
    ├── visual-comparator.ts
    ├── header-comparator.ts
    ├── performance-comparator.ts
    └── page-comparator.ts
```

---

## Phase 3: Crawler

### 3.1 Page Capture

**Tasks:**
- [ ] Write page capture tests with Mock Server
- [ ] Implement Playwright browser setup
- [ ] Implement page loading with wait
- [ ] Implement HTML capture
- [ ] Implement HTTP status and headers capture
- [ ] Implement screenshot capture
- [ ] Implement redirect chain capture
- [ ] Implement HAR capture (optional)

**Tests use Mock Server with controlled content:**
```typescript
describe('PageCrawler.capturePage', () => {
  let mockServer: MockServer;

  beforeAll(async () => {
    mockServer = new MockServer({
      routes: [
        { path: '/test', body: HTML_FIXTURES.baseline.simple },
        { path: '/404', status: 404, body: 'Not Found' },
        { path: '/redirect', status: 301, headers: { location: '/test' }, body: '' },
      ],
    });
  });

  it('should capture HTML content', async () => { ... });
  it('should handle 404 pages', async () => { ... });
  it('should follow redirects', async () => { ... });
});
```

### 3.2 Single Page Processor

**Tasks:**
- [ ] Write single page processor tests
- [ ] Implement page capture orchestration
- [ ] Implement SEO extraction after capture
- [ ] Implement artifact storage
- [ ] Implement snapshot creation and save

### 3.3 Crawlee Integration

**Tasks:**
- [ ] Write crawler tests with multi-page Mock Server
- [ ] Implement Crawlee RequestQueue setup
- [ ] Implement link discovery
- [ ] Implement URL filtering (include/exclude patterns)
- [ ] Implement domain boundary checking
- [ ] Implement max pages limit
- [ ] Implement concurrency control
- [ ] Implement progress callbacks

**Files to create:**
```
packages/backend/src/crawler/
├── types.ts
├── browser-manager.ts
├── page-capturer.ts
├── single-page-processor.ts
└── site-crawler.ts
```

---

## Phase 4: Task Queue

### 4.1 Task Queue Core

**Tasks:**
- [ ] Write task queue tests
- [ ] Implement task table operations
- [ ] Implement enqueue method
- [ ] Implement dequeue method
- [ ] Implement complete method
- [ ] Implement fail method
- [ ] Implement retry logic

### 4.2 Page Task Queue

**Tasks:**
- [ ] Write page task tests
- [ ] Implement page task operations
- [ ] Implement batch enqueue
- [ ] Implement progress tracking

### 4.3 Task Processor

**Tasks:**
- [ ] Write task processor tests
- [ ] Implement processor loop
- [ ] Implement single page task handling
- [ ] Implement crawl task handling
- [ ] Implement error handling and recovery
- [ ] Implement graceful shutdown

**Files to create:**
```
packages/backend/src/queue/
├── types.ts
├── task-queue.ts
├── page-task-queue.ts
└── task-processor.ts
```

---

## Phase 5: API Layer

### 5.1 Fastify Setup

**Tasks:**
- [ ] Write app setup tests
- [ ] Implement Fastify app creation
- [ ] Implement JSON schema validation
- [ ] Implement error handling middleware
- [ ] Implement request logging
- [ ] Implement CORS configuration

### 5.2 Scan Endpoints (Scenario 1 & 2)

**Tasks:**
- [ ] Write POST /scans/single-page tests
- [ ] Implement single page scan endpoint
- [ ] Write POST /scans/crawl tests
- [ ] Implement crawl endpoint
- [ ] Implement request validation
- [ ] Implement project creation
- [ ] Implement task enqueueing

**Tests with Mock Server:**
```typescript
describe('POST /api/v1/scans/single-page', () => {
  it('should create scan task', async () => {
    const response = await request(app)
      .post('/api/v1/scans/single-page')
      .send({ url: `${mockServerUrl}/page` });

    expect(response.status).toBe(202);
    expect(response.body.taskId).toBeDefined();
  });
});
```

### 5.3 Task Status Endpoint

**Tasks:**
- [ ] Write GET /tasks/:taskId tests
- [ ] Implement task status endpoint
- [ ] Implement progress calculation
- [ ] Implement estimated time remaining

### 5.4 Project Endpoints (Scenario 3)

**Tasks:**
- [ ] Write GET /projects tests
- [ ] Implement projects list endpoint
- [ ] Write GET /projects/:id tests
- [ ] Implement project details endpoint
- [ ] Implement pagination
- [ ] Implement sorting

### 5.5 Run Endpoints (Scenario 3)

**Tasks:**
- [ ] Write GET /projects/:id/runs tests
- [ ] Implement runs list endpoint
- [ ] Write GET /runs/:id tests
- [ ] Implement run details endpoint

### 5.6 Page Endpoints (Scenario 3)

**Tasks:**
- [ ] Write GET /runs/:id/pages tests
- [ ] Implement pages list endpoint
- [ ] Write GET /pages/:id tests
- [ ] Implement page details endpoint
- [ ] Implement filtering (status, changedOnly, diffType)

### 5.7 Diff Endpoint (Scenario 3)

**Tasks:**
- [ ] Write GET /pages/:id/diff tests
- [ ] Implement diff endpoint
- [ ] Implement SEO changes formatting
- [ ] Implement header changes formatting
- [ ] Implement visual diff info

### 5.8 Artifact Endpoints (Scenario 3)

**Tasks:**
- [ ] Write artifact endpoint tests
- [ ] Implement GET /artifacts/:id/screenshot
- [ ] Implement GET /artifacts/:id/diff
- [ ] Implement GET /artifacts/:id/har
- [ ] Implement GET /artifacts/:id/html
- [ ] Implement proper Content-Type headers
- [ ] Implement 404 for missing artifacts

**Files to create:**
```
packages/backend/src/api/
├── app.ts
├── routes/
│   ├── scans.ts
│   ├── tasks.ts
│   ├── projects.ts
│   ├── runs.ts
│   ├── pages.ts
│   └── artifacts.ts
├── middleware/
│   ├── error-handler.ts
│   └── request-logger.ts
└── validation/
    ├── scan-schemas.ts
    └── query-schemas.ts
```

---

## Phase 6: Integration & Workflows

### 6.1 Single Page Workflow (Scenario 1 Complete)

**Tasks:**
- [ ] Write full workflow integration test
- [ ] Verify API → Queue → Crawler → Storage flow
- [ ] Verify project/baseline creation
- [ ] Verify artifact generation
- [ ] Verify retrieval via Scenario 3 endpoints

### 6.2 Crawl Workflow (Scenario 2 Complete)

**Tasks:**
- [ ] Write full crawl workflow test
- [ ] Verify multi-page discovery
- [ ] Verify concurrent processing
- [ ] Verify progress tracking
- [ ] Verify all pages captured

### 6.3 Comparison Workflow

**Tasks:**
- [ ] Write comparison workflow test with Mock Server changes
- [ ] Verify baseline vs run comparison
- [ ] Verify diff detection for all types
- [ ] Verify diff retrieval via API

**Integration test flow:**
```typescript
it('should detect changes between runs', async () => {
  // 1. Create baseline scan
  mockServer.setRoute('/page', HTML_FIXTURES.baseline.simple);
  const baseline = await createScan(url);
  await waitForCompletion(baseline.taskId);

  // 2. Change mock server content
  mockServer.setRoute('/page', HTML_FIXTURES.seoChanges.titleChanged);

  // 3. Create comparison run
  const comparison = await createComparisonRun(baseline.projectId);
  await waitForCompletion(comparison.taskId);

  // 4. Verify diffs detected
  const diffs = await getDiffs(comparison.runId);
  expect(diffs).toContainSeoChange('title');
});
```

---

## Phase 7: Polish & Documentation

### 7.1 Error Handling

**Tasks:**
- [ ] Write error scenario tests
- [ ] Implement consistent error responses
- [ ] Implement validation error details
- [ ] Implement network error handling
- [ ] Implement timeout handling

### 7.2 API Documentation

**Tasks:**
- [ ] Generate OpenAPI spec from routes
- [ ] Add endpoint descriptions
- [ ] Add request/response examples
- [ ] Verify spec accuracy

### 7.3 Performance Optimization

**Tasks:**
- [ ] Add database indexes
- [ ] Implement query optimization
- [ ] Add connection pooling
- [ ] Measure and optimize bottlenecks

---

## Dependency Graph

```
Phase 0 (Foundation)
    │
    ▼
Phase 1 (Storage) ◄──────────────┐
    │                            │
    ▼                            │
Phase 2 (Domain Logic) ──────────┤
    │                            │
    ▼                            │
Phase 3 (Crawler) ───────────────┤
    │                            │
    ▼                            │
Phase 4 (Queue) ─────────────────┘
    │
    ▼
Phase 5 (API)
    │
    ▼
Phase 6 (Integration)
    │
    ▼
Phase 7 (Polish)
```

---

## Deliverables Per Phase

| Phase | Deliverable |
|-------|-------------|
| 0 | Test infrastructure running |
| 1 | All data persists to SQLite |
| 2 | Diff detection works in isolation |
| 3 | Pages captured with artifacts |
| 4 | Async processing works |
| 5 | All API endpoints functional |
| 6 | Full workflows pass |
| 7 | Production-ready code |

---

## Success Criteria

### Scenario 1 Complete When:
- [x] POST /api/v1/scans accepts URL and returns task ID ✅
- [x] Task processes and captures page ✅ (sync mode implemented)
- [x] Project and baseline created ✅
- [x] All artifacts stored ✅ (screenshots, HTML, HAR)
- [x] Retrievable via Scenario 3 endpoints ✅

**Status: Scenario 1 COMPLETE for single-page scans in sync mode** ✅

### Scenario 2 Complete When:
- [ ] POST /api/v1/scans with `crawl: true` accepts URL and crawl options 🟡 (endpoint exists, crawling not implemented)
- [ ] Crawler discovers and captures all pages ❌ (Crawlee integration pending)
- [ ] Progress trackable via task status ❌ (task queue pending)
- [ ] All pages and artifacts stored ❌ (blocked by crawler)
- [ ] Retrievable via Scenario 3 endpoints ❌ (blocked by crawler)

**Status: Scenario 2 BLOCKED - Needs Phase 3 (Crawlee) and Phase 4 (Task Queue)** 🔴

### Scenario 3 Complete When:
- [ ] GET /api/v1/projects (list all projects) ❌ (not implemented yet)
- [x] GET /api/v1/projects/:id returns full project details ✅
- [ ] GET /api/v1/runs/:id (run details) ❌ (not implemented)
- [ ] GET /api/v1/runs/:id/pages (pages list with filtering) ❌ (not implemented)
- [ ] GET /api/v1/pages/:id (page with snapshot) ❌ (not implemented)
- [ ] GET /api/v1/pages/:id/diff (detailed diff) ❌ (blocked by diff comparator)
- [x] GET /api/v1/artifacts/:pageId/* returns binary artifacts ✅ (screenshot, HTML, HAR)

**Status: Scenario 3 PARTIAL - Project retrieval works, diff viewing blocked** 🟡

### Overall Complete When:
- [x] Unit tests exist and pass ✅ (4 test files)
- [x] Integration tests with mock server ✅ (scan endpoints, multiple runs)
- [ ] API responds correctly to all documented requests 🟡 (partial - some endpoints missing)
- [ ] Mock Server tests verify diff detection accuracy ❌ (comparators not implemented)
- [ ] Performance acceptable for typical usage 🟡 (single page works well, multi-page untested)

---

## Implementation Status Update (2026-01-07)

**What's Working:**
- ✅ Single page capture (sync and async modes)
- ✅ Project creation with baseline runs
- ✅ Multiple comparison runs per project
- ✅ Full artifact capture and storage (screenshots, HTML, SEO, HAR)
- ✅ Artifact retrieval via API
- ✅ SQLite storage with proper schema
- ✅ URL normalization
- ✅ Security features (rate limiting, path traversal protection)
- ✅ Swagger UI documentation at `/docs`

**What's Not Working Yet:**
- ❌ Multi-page crawling (Crawlee integration pending)
- ❌ Diff comparison (all comparators pending)
- ❌ Task queue and background processing
- ❌ Most Scenario 3 retrieval endpoints
- ❌ Frontend UI

**Next Priorities:**
1. **SEO Comparator** - Enable detection of SEO changes between runs
2. **Visual Comparator** - Implement pixelmatch for screenshot diffs
3. **Diff API endpoints** - GET /pages/:id/diff to view comparisons
4. **Crawlee Integration** - Multi-page discovery and crawling
5. **Task Queue** - Background processing for large crawls
