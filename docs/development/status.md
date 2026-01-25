# Development Status

**Last Updated**: 2026-01-25

This document tracks the project's current status, completed work, and known issues.

## Table of Contents

1. [Current Focus](#current-focus)
2. [Current Status](#current-status)
3. [Completed Work](#completed-work)
4. [Known Issues](#known-issues)

---

## Current Focus

**Backend**: Integration workflows and diff generation (Phase 6)
**Frontend**: Phase 4 Complete - Diff Review UI with visual comparison, SEO diff, and performance metrics
**Next**: Phase 5 - Rules and Settings management

---

## Current Status

### Backend Status

**Phase 5 Complete** - All core API endpoints implemented and tested:

- **Drizzle ORM Migration**: All 6 repositories migrated from raw SQL (100% complete)
- **API Layer**: 15 endpoints with Swagger documentation, rate limiting, and security
- **Crawler**: Playwright + Crawlee integration for single-page and multi-page crawling
- **Comparison**: SEO, visual, header, and performance diff algorithms
- **Task Queue**: SQLite-based async processing with retry and priority
- **Storage**: SQLite database with artifact file storage
- **Retry**: Snapshot and run retry functionality for failed captures

**Test Coverage**: 200+ backend tests passing with >80% coverage

### Frontend Status

**Phase 4 Complete** - Full diff review interface operational:

**Completed Phases**:
- **Phase 1**: Foundation (layouts, routing, i18n, stores, API client) - 63 tests
- **Phase 2**: Project Management (CRUD, dashboard, multi-step wizard) - 104 tests
- **Phase 3**: Run Management (create, list, detail with polling) - 115 tests
- **Phase 4**: Diff Review (visual diff, SEO comparison, performance charts) - 26 E2E tests

**Key Features Working**:
- Complete project CRUD with multi-step creation wizard
- Run management with real-time status polling
- Page detail view with 4 tabs: SEO, Visual, Performance, Headers
- Visual diff viewer with side-by-side screenshot comparison
- SEO metadata comparison with change highlighting
- Performance metrics charts and comparisons
- Diff actions (Accept, Mute, Create Rule) - UI ready
- Theme switching (light/dark/auto) and language support (EN/PL)

**Test Coverage**: 277 tests passing with >85% coverage

### API Implementation

All API endpoints from the MVP specification are complete:

**Core Endpoints** (7):
- `POST /api/v1/scans` - Create scan (sync/async, single/crawl modes)
- `GET /api/v1/projects` - List projects with pagination
- `GET /api/v1/projects/:id` - Get project details
- `POST /api/v1/projects/:id/runs` - Create comparison run
- `GET /api/v1/projects/:id/runs` - List project runs
- `GET /api/v1/runs/:id` - Get run details
- `GET /api/v1/pages/:id` - Get page details

**Artifact Endpoints** (5):
- `GET /api/v1/artifacts/:pageId/screenshot` - Get screenshot
- `GET /api/v1/artifacts/:pageId/baseline-screenshot` - Get baseline
- `GET /api/v1/artifacts/:pageId/diff` - Get diff image
- `GET /api/v1/artifacts/:pageId/har` - Get HAR file
- `GET /api/v1/artifacts/:pageId/html` - Get HTML

**Retry Endpoints** (2):
- `POST /api/v1/snapshots/:snapshotId/retry` - Retry failed snapshot
- `POST /api/v1/runs/:runId/retry` - Retry failed pages in run

**Utility Endpoints** (2):
- `GET /health` - Health check
- `GET /docs` - Swagger UI

**Design Decisions**:
- **Hybrid Processing**: Both sync (immediate) and async (queued) modes supported
- **Queue**: SQLite-based (zero dependencies, persistent, atomic)
- **Storage**: SQLite + local file system for artifacts
- **Identifiers**: UUID v4 for all resources
- **Error Handling**: Consistent JSON error responses with detailed messages

### Technology Stack

**Backend**:
- Node.js 22/24, TypeScript 5.7
- Fastify (API), SQLite + Drizzle ORM (database)
- Playwright (browser automation), Crawlee (crawling)
- Pixelmatch (visual diff), Vitest (testing)

**Frontend**:
- Vue 3, TypeScript 5.7, Vite 6
- Naive UI (components), Pinia (state)
- Vue Router, vee-validate + Zod (forms)
- @ts-rest (type-safe API), ofetch (HTTP client)

**No External Dependencies**: Redis, message brokers, or separate database servers required

---

## Completed Work

### Drizzle ORM Migration

**Status**: 100% Complete (all 25 migration tasks finished)

**Migrated Repositories**:
1. **PageRepository** - 13 unit tests, type-safe queries
2. **ProjectRepository** - 13 unit tests, JSON config support
3. **RunRepository** - 16 unit tests, boolean fields, optional timestamps
4. **TaskQueue** - 19 unit tests, atomic dequeue with transactions
5. **SnapshotRepository** - 14 unit tests, 4 JSON columns, partial updates
6. **DiffRepository** - 9 unit tests, nested JSON, comparison tests

**Benefits Achieved**:
- Type safety with compile-time validation
- Automatic prepared statements (SQL injection protection)
- JSON column support with TypeScript inference
- Zero runtime overhead
- Better developer experience with IDE autocomplete

### Backend Features

1. **Crawler** (Phase 3 Complete):
   - Browser Manager: Playwright pooling
   - Page Capturer: HTML, screenshots, SEO, HAR
   - Single Page Processor
   - Site Crawler: Crawlee integration
   - Test Coverage: 41+ tests

2. **Comparators** (Phase 2 Complete):
   - SEO Comparator: title, meta, canonical, robots, headings
   - Visual Comparator: pixelmatch, diff images
   - Header Comparator: HTTP headers
   - Performance Comparator: load time, requests, size
   - Page Comparator: orchestration
   - Test Coverage: 63+ tests

3. **Task Queue** (Phase 4 Complete):
   - SQLite-based queue
   - Priority scheduling
   - Retry logic
   - Stale task recovery
   - Background processing
   - Test Coverage: 19+ tests

### Frontend Features

**Phase 1 - Foundation** (63 tests):
- Layout components (DefaultLayout, AppHeader, AppSidebar, AppBreadcrumb)
- Common UI (LoadingSpinner, ErrorAlert, EmptyState, ConfirmDialog, Pagination)
- API client with retry logic and error handling
- i18n with English and Polish (300+ keys)
- 7 Pinia stores (ui, projects, runs, pages, diffs, rules, tasks)
- Vue Router with 11 routes

**Phase 2 - Project Management** (104 tests):
- DashboardView with statistics and recent projects
- ProjectListView with pagination (12 per page, 3-column grid)
- ProjectForm multi-step wizard (Basic Info, Crawl Settings, Run Profile)
- ProjectDetailView with comprehensive information
- ProjectCard, ProjectStatusBadge, ProjectStatistics components
- Full CRUD with delete confirmation and cascade deletion
- Zod validation schemas with vee-validate integration

**Phase 3 - Run Management** (115 tests):
- RunListView, RunCreateView, RunDetailView
- RunCard, RunForm, RunStatusBadge, RunProgress, RunStatistics
- Real-time polling for in-progress runs (3s interval)
- Run retry with scope selection (failed-only vs all pages)

**Phase 4 - Diff Review** (26 E2E tests):
- PageDetailView with 4 tabs (SEO, Visual, Performance, Headers)
- Visual diff viewer with side-by-side comparison
- SEO metadata comparison with highlighted changes
- Performance metrics charts
- Diff actions (Accept, Mute, Create Rule) - UI ready
- Page navigation (Previous/Next buttons)

---

## Known Issues

### Skipped Tests

**Total**: 4 backend integration tests currently skipped

**Tracked in Milestone**: [#1 - Documentation TODO Cleanup](https://github.com/gander-tools/diff-voyager/milestone/1)

| Priority | File Location | Issue | Status |
|----------|---------------|-------|--------|
| **HIGH** | `project-details-endpoint.test.ts:266` | `includePages` query parameter coercion | [#156](https://github.com/gander-tools/diff-voyager/issues/156) |
| MEDIUM | `page-details-endpoint.test.ts:125` | SEO data in response | [#151](https://github.com/gander-tools/diff-voyager/issues/151) |
| MEDIUM | `page-details-endpoint.test.ts:181` | HTTP headers in response | [#152](https://github.com/gander-tools/diff-voyager/issues/152) |
| MEDIUM | `page-details-endpoint.test.ts:237` | Performance metrics in response | [#153](https://github.com/gander-tools/diff-voyager/issues/153) |

**Parent Investigation**: [#148 - Page details endpoint response structure](https://github.com/gander-tools/diff-voyager/issues/148)

**Notes**:
- All skipped tests are in backend integration tests
- Frontend has zero skipped tests
- Three tests (#151-153) appear related to same issue (page details response format)
- Consider batching fixes for #151-153 as single task

---

## See Also

- [Goals](goals.md) - Short-term, medium-term, and long-term goals
- [CLAUDE.md](../../CLAUDE.md) - Development guide and implementation details
- [Architecture Overview](../architecture/overview.md) - System design
- [API Endpoints](../api/endpoints.md) - Complete API specification
- [GitHub Milestones](https://github.com/gander-tools/diff-voyager/milestones) - Tracked work
