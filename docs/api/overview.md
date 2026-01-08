# API Overview

## Document Purpose

This document describes the REST API of Diff Voyager, enabling programmatic page scanning and comparison. All endpoints are fully implemented and tested.

**Implementation Status**: ✅ Complete (Phase 5 - January 2026)

## Scenarios Summary

### Scenario 1: Single Page Scan API ✅

**Status**: Fully implemented

**Flow:**
1. Client sends POST request with a single URL to scan
2. Server creates a new Project with single-page configuration (no crawler)
3. Processing mode:
   - **Sync mode** (`sync: true`): Request blocks until complete, returns full result
   - **Async mode** (`sync: false`): Task queued, returns task ID immediately
4. Task is processed:
   - Page is loaded via Playwright
   - HTML, HTTP headers, and status are captured
   - SEO metadata is extracted
   - Screenshot is taken
   - Optional: HAR file is generated
   - All artifacts are persisted
5. Results are available via retrieval endpoints

### Scenario 2: Full Domain Crawl API ✅

**Status**: Fully implemented

**Flow:**
1. Client sends POST request with base URL and `crawl: true`
2. Server creates a new Project with crawler configuration
3. Task is queued in SQLite-based queue
4. Server returns task/project identifier immediately
5. Background task processor:
   - Crawlee discovers all pages within domain scope
   - Each page is captured (as in Scenario 1)
   - Progress is tracked per-page
   - Run can be interrupted and resumed
6. Results are available via retrieval endpoints

### Scenario 3: Project/Results Retrieval API ✅

**Status**: Fully implemented

**Endpoints**:
1. ✅ GET /api/v1/projects - List all projects with pagination
2. ✅ GET /api/v1/projects/:id - Get project details with pages
3. ✅ GET /api/v1/projects/:id/runs - List runs for project
4. ✅ GET /api/v1/runs/:id - Get run details with statistics
5. ✅ GET /api/v1/runs/:id/pages - List pages with filtering
6. ✅ GET /api/v1/pages/:id - Get page details with latest snapshot
7. ✅ GET /api/v1/pages/:id/diff - Get detailed diff comparison
8. ✅ GET /api/v1/tasks/:id - Get task status and progress
9. ✅ GET /api/v1/artifacts/:pageId/* - Get artifact binaries (screenshot, HTML, HAR, diff)

## Key Design Decisions

### Identifiers
- **Project ID**: UUID v4, generated on project creation
- **Run ID**: UUID v4, generated on run creation
- **Page ID**: UUID v4, generated per normalized URL per project
- **Snapshot ID**: UUID v4, generated per page per run

### Queue & Processing

**Processing Options:**

| # | Solution | Pros | Cons | Container |
|---|----------|------|------|-----------|
| **0** | **⚡ Synchronous (no queue)** | Simplest, immediate result, works from CLI | Blocks request, no resume, timeout risk | None |
| 1 | SQLite (DB records) | Zero dependencies, atomic, persistent, resumable | Single-writer, no distributed workers | None |
| 2 | BullMQ + Redis | Node.js native, job scheduling, retries, dashboard | Redis dependency | `redis:alpine` |
| 3 | PostgreSQL SKIP LOCKED | ACID, if already using Postgres | Heavier than SQLite | `postgres:alpine` |
| 4 | Beanstalkd | Simple protocol, lightweight, tubes | Less popular, fewer Node.js libs | `schickling/beanstalkd` |
| 5 | RabbitMQ (AMQP) | Mature, reliable, routing, clustering | Heavier, more complex | `rabbitmq:alpine` |

---

## Current Implementation

**Stack**: Hybrid approach - Both sync and async processing with SQLite queue

```
┌─────────────────────────────────────────────────────────┐
│  Current: Flexible sync/async processing               │
├─────────────────────────────────────────────────────────┤
│  Processing:  Sync (immediate) or Async (queued)       │
│  Queue:       SQLite-based task queue (Phase 4)        │
│  Database:    SQLite with Drizzle ORM                  │
│  Artifacts:   Local file system                         │
│  Containers:  None required                             │
└─────────────────────────────────────────────────────────┘
```

**Synchronous Mode** (`sync: true`):
- Request blocks until scan completes
- Full response returned immediately
- Ideal for single page scans and CLI usage
- No queue overhead

**Asynchronous Mode** (`sync: false`):
- Task queued in SQLite
- Task ID returned immediately
- Background task processor handles execution
- Supports resume after interruption
- Progress tracking via task status endpoint
- Ideal for multi-page crawls

**Benefits**:
- Zero external dependencies (no Redis, no message broker)
- Persistent queue survives restarts
- Atomic task operations (no double processing)
- Priority-based scheduling
- Automatic retry on failure

---

**Queue features (if using options 1-5):**
- Persistent task storage (survives restart)
- Atomic task claiming (no double processing)
- Task states: PENDING, IN_PROGRESS, COMPLETED, FAILED
- Retry logic with configurable attempt limits
- Resume capability after interruption

### Storage
- **SQLite** database for metadata and relationships (single file, zero config)
- **File system** for artifacts (screenshots, diffs, HARs)
- Structured directory layout per project

### Response Format
- All endpoints return JSON
- Binary artifacts returned with appropriate Content-Type
- Consistent error response structure
- Pagination for list endpoints

## MVP Scope Alignment

This implementation covers PRD sections:
- 4.1: Main solo developer flow (baseline creation, comparison runs)
- 4.3: Crawl and queue (persistent queue, atomic operations, resume)
- 4.4: Data collection (HTML, headers, SEO, screenshots, HAR)
- 4.5: Comparison and diff (HTML/SEO, visual, HAR comparison)

**Deferred to future iterations:**
- 4.2: Project edit/delete (only create for now)
- 4.6: Diff acceptance and muting (read-only for now)
- 4.7: Export functionality

## Document Structure

| Document | Content |
|----------|---------|
| `01-domain-types.md` | TypeScript interfaces and types |
| `02-api-endpoints.md` | REST API specification |
| `03-tdd-test-plan.md` | Test structure and test cases |
| `04-implementation-phases.md` | Development phases and tasks |
