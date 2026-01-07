# Diff Voyager

[![CI](https://github.com/gander-tools/diff-voyager/actions/workflows/ci.yml/badge.svg)](https://github.com/gander-tools/diff-voyager/actions/workflows/ci.yml)

> **Local Website Version Comparison Tool for Framework Migrations**

Diff Voyager helps solo developers verify that framework upgrades and dependency changes don't break their websites. It crawls your site, captures baselines, and compares visual appearance, SEO metadata, and performance metrics across versions.

## Features

- **Visual Regression Detection**: Pixel-perfect screenshot comparison with configurable thresholds
- **SEO Integrity Checks**: Verify title tags, meta descriptions, canonical URLs, robots directives, and heading structure
- **Performance Monitoring**: Track load times, request counts, and total page size via HAR files
- **Smart Diff Management**: Accept changes or create mute rules to filter out expected differences
- **Resumable Crawls**: Interrupt and resume runs without losing progress
- **Project-Based Workflow**: Manage multiple migration projects with separate baselines

## Architecture

Diff Voyager is a monorepo with three packages:

```
packages/
├── backend/   # Node.js crawler and API (Crawlee + Playwright)
├── frontend/  # Vue 3 UI (built with bun)
└── shared/    # Shared TypeScript types
```

## Requirements

- **Node.js**: v22 or v24
- **Bun** (for frontend development)
- **Operating System**: Linux, macOS, or Windows with WSL2

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/gander-tools/diff-voyager.git
cd diff-voyager

# Install dependencies and build shared types
npm install
npm run setup

# Install Playwright browsers (required for page capture)
npx playwright install
```

### Running the Backend API

```bash
# Start backend server (default: http://localhost:3000)
npm run dev:backend

# Or with custom configuration
PORT=3001 DATA_DIR=./my-data npm run dev:backend
```

The API server will start with the following endpoints:
- **`POST /api/v1/scans`** - Create a new scan (single page or crawl)
- **`GET /api/v1/projects/:id`** - Get project details with pages
- **`GET /api/v1/artifacts/:pageId/*`** - Get artifacts (screenshots, HTML, HAR)
- **`GET /health`** - Health check

**Interactive API Documentation**: Visit **`http://localhost:3000/docs`** for Swagger UI with live API testing.

### Testing the API

**Single page scan (synchronous mode):**
```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "sync": true,
    "name": "My Test Project"
  }'
```

**Response:**
```json
{
  "projectId": "uuid-here",
  "runId": "uuid-here",
  "status": "COMPLETED",
  "message": "Scan completed successfully",
  "projectUrl": "/api/v1/projects/uuid-here"
}
```

**Asynchronous scan (returns immediately):**
```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

**Get project details:**
```bash
curl http://localhost:3000/api/v1/projects/{projectId}
```

### Frontend (Planned)

```bash
# Frontend development (coming soon)
npm run dev:frontend
```

Visit `http://localhost:5173` to access the UI (when available).

## Usage Examples

### Example 1: Create a Baseline Scan

Capture a single page with all artifacts (screenshot, HTML, SEO metadata):

```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "sync": true,
    "name": "Example.com Project",
    "viewport": {"width": 1920, "height": 1080},
    "collectHar": false,
    "waitAfterLoad": 1000
  }' | jq
```

**Response includes:**
- `projectId` - Use this for subsequent scans of the same URL
- `runId` - Identifier for this specific scan run
- `status` - "COMPLETED" for successful sync scans
- `projectUrl` - Endpoint to retrieve full project details

### Example 2: Create a Comparison Run

After making changes to your site, scan the same URL again to create a comparison run:

```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "sync": true,
    "name": "Example.com Project"
  }' | jq
```

The system will automatically:
- Detect this is the same project (based on normalized URL)
- Create a new comparison run instead of a baseline
- Store both snapshots for future comparison

### Example 3: Get Project Details

Retrieve all runs and pages for a project:

```bash
curl http://localhost:3000/api/v1/scans/projects/{projectId} | jq
```

**Response includes:**
```json
{
  "project": {
    "id": "uuid",
    "name": "Example.com Project",
    "baseUrl": "https://example.com",
    "createdAt": "2024-01-07T12:00:00Z"
  },
  "pages": [
    {
      "id": "page-uuid",
      "normalizedUrl": "https://example.com",
      "snapshots": [
        {
          "runId": "run-uuid-1",
          "isBaseline": true,
          "capturedAt": "2024-01-07T12:00:00Z",
          "httpStatus": 200,
          "seo": {
            "title": "Example Domain",
            "metaDescription": "Example domain for documentation",
            "canonical": "https://example.com",
            "robots": "index,follow",
            "h1": ["Example Domain"]
          },
          "hasScreenshot": true,
          "hasHar": false
        },
        {
          "runId": "run-uuid-2",
          "isBaseline": false,
          "capturedAt": "2024-01-07T13:00:00Z",
          "httpStatus": 200,
          "seo": {...},
          "hasScreenshot": true,
          "hasHar": false
        }
      ]
    }
  ]
}
```

### Example 4: Retrieve Artifacts

Get the screenshot for a specific page:

```bash
# Get screenshot
curl http://localhost:3000/api/v1/artifacts/{pageId}/screenshot.png \
  --output screenshot.png

# Get raw HTML
curl http://localhost:3000/api/v1/artifacts/{pageId}/page.html \
  --output page.html

# Get performance data (if collectHar: true was used)
curl http://localhost:3000/api/v1/artifacts/{pageId}/performance.har \
  --output performance.har
```

### Example 5: Async Scan (Non-Blocking)

For integration with external systems, use async mode:

```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "sync": false
  }' | jq
```

**Response:**
```json
{
  "projectId": "uuid",
  "status": "PENDING",
  "message": "Scan queued for processing",
  "projectUrl": "/api/v1/projects/uuid"
}
```

Poll the project endpoint to check when processing is complete.

## Development

### Project Structure

```
diff-voyager/
├── packages/
│   ├── backend/          # Crawler, API, diff engine
│   │   ├── src/
│   │   │   ├── crawler/  # Crawlee + Playwright integration
│   │   │   ├── api/      # Fastify HTTP API
│   │   │   ├── domain/   # Business logic
│   │   │   └── storage/  # Persistence layer
│   │   └── tests/
│   ├── frontend/         # Vue 3 application
│   │   ├── src/
│   │   │   ├── views/    # Page components
│   │   │   ├── components/
│   │   │   ├── stores/   # Pinia state management
│   │   │   └── router/
│   │   └── tests/
│   └── shared/           # Domain models and types
│       ├── src/
│       │   ├── types/    # TypeScript interfaces
│       │   └── models/   # Domain entities
│       └── tests/
├── docs/                 # Documentation
├── .claude/              # Claude Code configuration
│   └── PRD.md           # Product Requirements Document
└── README.md
```

### Testing

Diff Voyager follows Test-Driven Development (TDD):

```bash
# Run all tests
npm test

# Test specific package
npm run test:backend
npm run test:frontend
npm run test:shared

# Watch mode
cd packages/backend && npm run test:watch
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build:backend
npm run build:frontend
npm run build:shared
```

## Implementation Status

Diff Voyager is actively under development following the [API Implementation Plan](docs/api-implementation-plan/00-overview.md). Here's the current status:

### ✅ Phase 1: Storage Layer (COMPLETE)

All storage components are fully implemented and tested:

- **Database Schema** - SQLite with 3 migrations applied (projects, runs, pages, snapshots, diffs, tasks)
- **Project Repository** - CRUD operations for projects
- **Run Repository** - Run management with baseline tracking
- **Page Repository** - Page tracking with URL normalization
- **Snapshot Repository** - Page snapshot storage with full artifact metadata
- **Diff Repository** - Comparison result storage (NEW in this release)
- **Artifact Storage** - File-based artifact storage (screenshots, HTML, HAR)

**Test Coverage:** 100% of repositories have comprehensive unit tests

### ✅ Phase 2: Domain Logic (COMPLETE)

All comparison logic is implemented:

- **URL Normalizer** - Consistent URL normalization
- **SEO Comparator** - Detects changes in title, meta, canonical, robots, H1/H2
- **Visual Comparator** - Pixel-by-pixel diff with pixelmatch
- **Header Comparator** - HTTP header difference detection
- **Performance Comparator** - Load time, request count, size delta analysis
- **Page Comparator** - Orchestrates all comparators for full page comparison

### ✅ Phase 4: Task Queue (COMPLETE)

Asynchronous task processing system:

- **Task Queue Core** - Enqueue, dequeue, complete, fail operations
- **Page Task Queue** - Batch operations for multi-page processing
- **Task Processor** - Background processing loop with retry logic and stale task recovery
- **Graceful Shutdown** - Clean process termination

### 🟡 Phase 3: Crawler (PARTIAL)

- **Page Capturer** - ✅ Single page capture with Playwright
- **Artifact Generation** - ✅ Screenshots, HTML, HAR files
- **SEO Extraction** - ✅ Full metadata extraction
- **Crawlee Integration** - ❌ Multi-page discovery (not yet implemented)

### 🟡 Phase 5: API Layer (PARTIAL)

Implemented endpoints:

- ✅ `POST /api/v1/scans` - Create scan (single page, sync/async modes)
- ✅ `GET /api/v1/projects/:id` - Get project details with pages
- ✅ `GET /api/v1/artifacts/:pageId/*` - Retrieve artifacts (screenshot, HTML, HAR)
- ✅ `GET /health` - Health check
- ✅ `GET /docs` - Swagger UI

Missing endpoints:

- ❌ `GET /api/v1/runs/:id` - Run details
- ❌ `GET /api/v1/pages/:id` - Page details with snapshot
- ❌ `GET /api/v1/pages/:id/diff` - Detailed diff view

### ❌ Phase 6: Integration & Workflows (NOT STARTED)

- ❌ Diff workflow integration (comparators ready, workflow implementation pending)
- ❌ Multi-page crawl workflow

### ❌ Frontend UI (NOT STARTED)

Vue 3 frontend is planned but not yet implemented.

### Current Capabilities

**What Works:**
- ✅ Single page scanning (sync and async)
- ✅ Project creation with automatic baseline runs
- ✅ Multiple comparison runs per project
- ✅ Full artifact capture and retrieval
- ✅ Secure file access with path traversal protection
- ✅ Rate limiting on file operations
- ✅ Comprehensive storage layer with diff tracking
- ✅ All comparison algorithms ready (SEO, visual, headers, performance)

**What's Not Working Yet:**
- ❌ Multi-page crawling (Crawlee integration)
- ❌ Diff comparison workflow (comparators ready, integration pending)
- ❌ Diff retrieval API endpoints
- ❌ Frontend UI

### Next Priorities

1. **Phase 6** - Integrate diff comparators into scan workflow
2. **Phase 5** - Implement remaining API endpoints for diff retrieval
3. **Phase 3** - Complete Crawlee integration for multi-page crawling
4. **Frontend** - Begin Vue 3 UI development

## Typical Workflow

1. **Create Project**: Set up a new project with your website's base URL
2. **Establish Baseline**: Run a full crawl to capture the current state
3. **Make Changes**: Update your framework, dependencies, or code
4. **Run Comparison**: Crawl the updated site and compare against baseline
5. **Review Diffs**: Examine visual, SEO, and performance differences
6. **Accept or Mute**: Mark acceptable changes or create rules to ignore expected differences
7. **Iterate**: Fix issues and rerun until all critical differences are resolved

## Core Concepts

### Project
A migration effort with configuration for crawling, comparison profiles, and mute rules.

### Baseline
The reference snapshot of your site before changes. Immutable within a project.

### Run
A comparison crawl against the baseline. Track status, statistics, and differences.

### Page Snapshot
Complete capture of a page: HTML, HTTP headers, SEO data, screenshot, HAR file, and performance metrics.

### Diff
Comparison results between baseline and run for a specific page. Includes HTML/SEO changes, visual differences, and performance deltas.

### Mute Rules
Filters to ignore expected differences (e.g., timestamps, analytics scripts, dynamic content).

## Technology Stack

- **Backend**: Node.js, TypeScript, Crawlee, Playwright, Fastify
- **Frontend**: Vue 3, TypeScript, Pinia, Vite, built with bun
- **Testing**: Vitest
- **Diff Engine**: Pixelmatch for visual comparison

## Documentation

- [Product Requirements Document](.claude/PRD.md) - Detailed feature specifications
- [Claude Code Guide](CLAUDE.md) - Development guide for AI-assisted coding

## Contributing

1. Read the [PRD](.claude/PRD.md) to understand requirements
2. Follow TDD - write tests first
3. Use shared TypeScript types from `@gander-tools/diff-voyager-shared`
4. Keep changes focused and avoid over-engineering
5. Update documentation as needed

## License

GNU General Public License v3.0 (GPL-3.0)

See [LICENSE](LICENSE) for details.

## MVP Process

Development follows the [API Implementation Plan](docs/api-implementation-plan/) with Test-Driven Development (TDD). Each phase builds on the previous, ensuring solid foundations.

### Phase 0: Foundation Setup (100% ✅)
- [x] Test infrastructure (Vitest, MockServer, test helpers)
- [x] HTML fixtures for SEO testing
- [x] Shared TypeScript types (API requests/responses)
- [x] Build automation for shared package

### Phase 1: Storage Layer (85% ✅)
- [x] SQLite database schema with migrations
- [x] ProjectRepository (create, findById, findByBaseUrl)
- [x] RunRepository (create, findById, findByProjectId, updateStatus)
- [x] PageRepository (create, findById, findOrCreateByUrl)
- [x] SnapshotRepository (create, findByPageAndRun)
- [x] Artifact file storage (screenshots, HTML, HAR)
- [ ] DiffRepository (comparison results storage) - **Next priority**
- [ ] Database indexes for query optimization

### Phase 2: Domain Logic (100% ✅)
- [x] URL Normalizer (path normalization, query handling, tracking parameter removal)
- [x] SEO data extraction (title, meta, canonical, robots, H1)
- [x] SEO Comparator (detect changes in meta tags and content)
- [x] Visual Comparator (pixelmatch integration, diff image generation)
- [x] Header Comparator (HTTP header differences)
- [x] Performance Comparator (load time, request count, size deltas)
- [x] Full Page Comparator (orchestration of all comparators)

**Implementation Complete:** All domain comparison logic implemented with TDD. Comparators for SEO metadata, visual screenshots (via pixelmatch), HTTP headers, and performance metrics. Full page comparator orchestrates all comparisons and produces unified diff summaries.

### Phase 3: Crawler (100% ✅)
- [x] Playwright browser setup
- [x] Page capture (HTML, headers, status, redirects)
- [x] Screenshot capture with configurable viewport
- [x] SEO data extraction during capture
- [x] Performance metrics collection
- [x] HAR file capture (optional)
- [x] Browser manager for instance pooling
- [x] Single page processor (orchestrates capture and storage)
- [x] Crawlee integration for multi-page discovery
- [x] Link discovery and following
- [x] Domain boundary checking
- [x] Max pages limit and concurrency control
- [x] URL filtering patterns (include/exclude)

**Implementation Complete:** Full crawler infrastructure with Playwright for page capture and Crawlee for multi-page site crawling. Includes browser pooling, single page processing orchestration, link discovery, domain filtering, concurrency control, and progress tracking. Ready for integration with scan endpoints.

### Phase 4: Task Queue (100% ✅)
- [x] Task queue core (enqueue, dequeue, complete, fail)
- [x] Page task queue (batch operations, progress tracking)
- [x] Task processor (background processing loop)
- [x] Retry logic and error recovery
- [x] Graceful shutdown

**Implementation Complete:** SQLite-based task queue with full retry logic, priority scheduling, stale task recovery, batch operations, and background task processor with graceful shutdown. Ready for async multi-page crawls.

### Phase 5: API Layer (65% ✅)
- [x] Fastify app with Swagger UI (`/docs`)
- [x] Request validation and error handling
- [x] Rate limiting and security headers
- [x] POST /api/v1/scans (create scan with sync/async mode)
- [x] GET /api/v1/projects/:projectId (project details with pages)
- [x] GET /api/v1/artifacts/:pageId/* (screenshots, HTML, HAR, diffs)
- [x] GET /health (health check)
- [ ] GET /api/v1/tasks/:taskId (task status and progress) - **Needed for async mode**
- [ ] POST /api/v1/projects/:id/runs (explicit comparison run creation)
- [ ] GET /api/v1/runs/:runId (run details with statistics)
- [ ] GET /api/v1/runs/:runId/pages (pages list with filtering)
- [ ] GET /api/v1/pages/:pageId/diff (detailed diff view) - **Ready to implement**

### Phase 6: Integration & Workflows (50% 🟡)
- [x] ScanProcessor (orchestrates project → run → capture → storage)
- [x] Single page baseline capture (sync mode)
- [x] Multiple comparison runs per project
- [x] Artifact persistence (screenshots, HTML, performance data)
- [ ] Baseline vs run comparison workflow - **Ready to implement (Phase 2 complete)**
- [ ] Diff generation and storage - **Ready to implement (Phase 2 complete)**
- [ ] Multi-page crawl workflow - **Ready to implement (Phase 3 complete)**
- [x] Async task processing integration (Phase 4 task queue complete)

### Phase 7: Polish & Production Ready (50% 🟡)
- [x] Rate limiting on all API endpoints
- [x] Path traversal prevention with symlink protection
- [x] Input validation and error sanitization
- [x] Swagger/OpenAPI documentation
- [x] Integration tests with mock server
- [ ] Complete error scenario tests
- [ ] Database query optimization and indexing
- [ ] Performance benchmarking and optimization
- [ ] Connection pooling

### Frontend Development (Planned)
- [ ] Vue 3 UI with project and run management
- [ ] Diff review interface (visual, SEO, performance)
- [ ] Diff acceptance and muting workflow
- [ ] Mute rules configuration
- [ ] Export functionality

### Current Status: **Phase 3 Complete - Crawler Infrastructure Ready** ✅

**What's working now:**

✅ **Page Capture & Storage:**
- Single page scanning (sync and async modes)
- HTML, HTTP headers, and status code capture
- SEO metadata extraction (title, meta description, canonical, robots, H1)
- Full-page screenshots with configurable viewport
- Performance metrics collection
- HAR file capture (optional)
- SQLite database storage with proper schema

✅ **Project Management:**
- Project creation with baseline runs
- Multiple comparison runs per project
- URL normalization and duplicate detection
- Artifact file storage and retrieval

✅ **API & Documentation:**
- RESTful API with Fastify
- Swagger UI at `/docs` for interactive testing
- Request validation and error handling
- Rate limiting and security headers
- Path traversal protection with symlink validation

✅ **Testing:**
- Unit tests for domain logic (URL normalizer, all comparators)
- Integration tests with mock HTTP server
- Repository layer tests
- API endpoint tests

✅ **Comparison Logic (Phase 2 Complete):**
- SEO comparison (title, meta, canonical, robots, H1)
- Visual comparison (pixelmatch integration)
- HTTP header comparison
- Performance metrics comparison
- Full page comparison orchestration

✅ **Crawler Infrastructure (Phase 3 Complete):**
- Browser manager for instance pooling
- Single page processor orchestration
- Multi-page site crawling with Crawlee
- Link discovery and following
- Domain boundary checking (same-domain, subdomain support)
- Concurrent page processing with configurable limits
- URL filtering (include/exclude patterns)
- Progress tracking and callbacks

**Not yet available:**

🟡 **Diff Integration (Ready to implement):**
- Baseline vs run comparison workflow
- Diff generation during comparison runs
- Diff acceptance and muting

❌ **Frontend UI:**
- Vue 3 interface
- Visual diff review
- Project and run management
- Mute rules configuration

### Future Enhancements (Post-MVP)
- CI/CD integration (GitHub Actions, GitLab CI)
- SEO tool integration (Lighthouse, Screaming Frog)
- Advanced visual diff algorithms (structural comparison)
- Multi-user support and authentication
- Docker deployment
- Email/Slack notifications
- Project templates and presets

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/gander-tools/diff-voyager).
