# Development Roadmap

**Last Updated**: 2026-01-13

This document consolidates the project's current status, completed work, known issues, and future plans.

## Table of Contents

1. [Current Status](#current-status)
2. [Completed Work](#completed-work)
3. [Known Issues](#known-issues)
4. [Short-term Goals](#short-term-goals-mvp-completion)
5. [Medium-term Goals](#medium-term-goals-frontend-mvp)
6. [Long-term Goals](#long-term-goals-post-mvp)

---

## Current Focus

**Backend**: Integration workflows and diff generation (Phase 6)
**Frontend**: Phase 4 Complete - Diff Review UI with visual comparison, SEO diff, and performance metrics
**Next**: Phase 5 - Rules and Settings management

---

## Current Status

### Backend Status ✅

**Phase 5 Complete** - All core API endpoints implemented and tested:

- ✅ **Drizzle ORM Migration**: All 6 repositories migrated from raw SQL (100% complete)
- ✅ **API Layer**: 15 endpoints with Swagger documentation, rate limiting, and security
- ✅ **Crawler**: Playwright + Crawlee integration for single-page and multi-page crawling
- ✅ **Comparison**: SEO, visual, header, and performance diff algorithms
- ✅ **Task Queue**: SQLite-based async processing with retry and priority
- ✅ **Storage**: SQLite database with artifact file storage
- ✅ **Retry**: Snapshot and run retry functionality for failed captures

**Test Coverage**: 200+ backend tests passing with >80% coverage

### Frontend Status ✅

**Phase 4 Complete** - Full diff review interface operational:

**✅ Completed Phases**:
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

### API Implementation ✅

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

**Design Decisions** (consolidated from api/overview.md):
- **Hybrid Processing**: Both sync (immediate) and async (queued) modes supported
- **Queue**: SQLite-based (zero dependencies, persistent, atomic)
- **Storage**: SQLite + local file system for artifacts
- **Identifiers**: UUID v4 for all resources
- **Error Handling**: Consistent JSON error responses with detailed messages

### Technology Stack ✅

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

### Drizzle ORM Migration ✅

**Status**: 100% Complete (all 25 migration tasks finished)

**Migrated Repositories** (from drizzle-migration.md):
1. ✅ **PageRepository** - 13 unit tests, type-safe queries
2. ✅ **ProjectRepository** - 13 unit tests, JSON config support
3. ✅ **RunRepository** - 16 unit tests, boolean fields, optional timestamps
4. ✅ **TaskQueue** - 19 unit tests, atomic dequeue with transactions
5. ✅ **SnapshotRepository** - 14 unit tests, 4 JSON columns, partial updates
6. ✅ **DiffRepository** - 9 unit tests, nested JSON, comparison tests

**Benefits Achieved**:
- Type safety with compile-time validation
- Automatic prepared statements (SQL injection protection)
- JSON column support with TypeScript inference
- Zero runtime overhead
- Better developer experience with IDE autocomplete

### Backend Features ✅

**From features/README.md:**

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

### Frontend Features ✅

**From frontend-status.md:**

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

### Skipped Tests (from skipped-tests.md)

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
- Frontend has zero skipped tests ✅
- Three tests (#151-153) appear related to same issue (page details response format)
- Consider batching fixes for #151-153 as single task

---

## Short-term Goals (MVP Completion)

### 1. Fix Skipped Tests (Priority: High)

**Target**: Week 1-2

**Milestone**: [#1 - Documentation TODO Cleanup](https://github.com/gander-tools/diff-voyager/milestone/1)

See GitHub Issues for detailed tracking (all **Bug** type):
- [ ] 🔴 Fix `includePages` parameter coercion → [#156](https://github.com/gander-tools/diff-voyager/issues/156)
- [ ] 🔴 Investigate page details endpoint response structure → [#148](https://github.com/gander-tools/diff-voyager/issues/148) (parent)
  - [ ] 🔴 Include SEO data → [#151](https://github.com/gander-tools/diff-voyager/issues/151)
  - [ ] 🔴 Include HTTP headers → [#152](https://github.com/gander-tools/diff-voyager/issues/152)
  - [ ] 🔴 Include performance metrics → [#153](https://github.com/gander-tools/diff-voyager/issues/153)
- [ ] 🔴 Fix HAR file URL handling → [#157](https://github.com/gander-tools/diff-voyager/issues/157)

**Acceptance Criteria**: See individual issues for detailed criteria.

### 2. Complete Phase 6: Integration Workflows (Priority: High)

**Target**: Weeks 3-4

**Milestone**: [#2 - Phase 6: Integration Workflows](https://github.com/gander-tools/diff-voyager/milestone/2)

See GitHub Issues for detailed tracking:
- [ ] 🔵 Implement automatic diff generation → [#149](https://github.com/gander-tools/diff-voyager/issues/149) (Feature, parent)
  - [ ] 🟡 Create integration tests for diff workflow → [#154](https://github.com/gander-tools/diff-voyager/issues/154) (Task)
- [ ] 🟡 End-to-end testing of Crawlee integration → [#158](https://github.com/gander-tools/diff-voyager/issues/158) (Task)
- [ ] 🟡 Performance optimization for crawls → [#159](https://github.com/gander-tools/diff-voyager/issues/159) (Task)

**Acceptance Criteria**: See individual issues for detailed criteria.

### 3. Complete Phase 7: Production Polish (Priority: Medium)

**Target**: Weeks 5-6

**Milestone**: [#3 - Phase 7: Production Polish](https://github.com/gander-tools/diff-voyager/milestone/3)

See GitHub Issues for detailed tracking (all **Task** type):
- [ ] 🟡 Add database indexes for query optimization → [#160](https://github.com/gander-tools/diff-voyager/issues/160)
- [ ] 🟡 Analyze and optimize slow queries → [#161](https://github.com/gander-tools/diff-voyager/issues/161)
- [ ] 🟡 Complete error scenario tests → [#162](https://github.com/gander-tools/diff-voyager/issues/162)
- [ ] 🟡 Improve error messages for better UX → [#163](https://github.com/gander-tools/diff-voyager/issues/163)
- [ ] 🟡 Performance benchmarking and baselines → [#164](https://github.com/gander-tools/diff-voyager/issues/164)

**Acceptance Criteria**: See individual issues for detailed criteria.

### 4. MVP Feature Completion (Priority: Medium)

**Target**: Weeks 7-8

**Milestone**: [#4 - Backend MVP Complete](https://github.com/gander-tools/diff-voyager/milestone/4)

See GitHub Issues for detailed tracking (all **Feature** type):
- [ ] 🔵 Implement project export functionality → [#150](https://github.com/gander-tools/diff-voyager/issues/150) (parent)
  - [ ] 🔵 Add export API endpoint → [#155](https://github.com/gander-tools/diff-voyager/issues/155)
- [ ] 🔵 Implement diff filtering → [#165](https://github.com/gander-tools/diff-voyager/issues/165)
- [ ] 🔵 Add search functionality for diffs and pages → [#166](https://github.com/gander-tools/diff-voyager/issues/166)

**Acceptance Criteria**: See individual issues for detailed criteria.

**GitHub Milestones**:
- [Milestone #1: Documentation TODO Cleanup](https://github.com/gander-tools/diff-voyager/milestone/1) - Fix skipped tests
- [Milestone #2: Phase 6: Integration Workflows](https://github.com/gander-tools/diff-voyager/milestone/2) - Integration workflows (due Jan 24, 2026)
- [Milestone #3: Phase 7: Production Polish](https://github.com/gander-tools/diff-voyager/milestone/3) - Production readiness (due Feb 7, 2026)
- [Milestone #4: Backend MVP Complete](https://github.com/gander-tools/diff-voyager/milestone/4) - Backend MVP features (due Feb 21, 2026)
- [Milestone #5: Frontend Phase 3: Run Management](https://github.com/gander-tools/diff-voyager/milestone/5) - Run management UI (due Mar 31, 2026)
- [Milestone #6: Frontend Phase 4: Diff Review](https://github.com/gander-tools/diff-voyager/milestone/6) - Diff review UI (due Apr 30, 2026)
- [Milestone #7: Frontend MVP Complete](https://github.com/gander-tools/diff-voyager/milestone/7) - Frontend MVP (due May 31, 2026)
- [Milestone #8: v1.0 Public Release](https://github.com/gander-tools/diff-voyager/milestone/8) - Public release (due Jun 30, 2026)

## Medium-term Goals (Frontend MVP)

### 5. Frontend UI Development (Priority: High)

**Target**: Weeks 9-16 (2 months)

**Milestones**:
- [#5 - Frontend Phase 3: Run Management](https://github.com/gander-tools/diff-voyager/milestone/5) - Due Mar 31, 2026
- [#6 - Frontend Phase 4: Diff Review](https://github.com/gander-tools/diff-voyager/milestone/6) - Due Apr 30, 2026
- [#7 - Frontend MVP Complete](https://github.com/gander-tools/diff-voyager/milestone/7) - Due May 31, 2026

#### 5.1 Project Setup ✅

- [x] Vue 3 + Vite project scaffolding
- [x] Pinia store setup
- [x] Vue Router configuration
- [x] API client service (@ts-rest)
- [x] Component library selection (Naive UI)

#### 5.2 Phase 3: Run Management ✅

**Status**: Complete (All 8 sub-issues implemented, 115 tests passing)

**Parent Issue**: [#179 - feat(frontend): implement Run Management views](https://github.com/gander-tools/diff-voyager/issues/179)

**Views**:
- [x] 🔵 RunListView → [#185](https://github.com/gander-tools/diff-voyager/issues/185) ✅
- [x] 🔵 RunCreateView → [#186](https://github.com/gander-tools/diff-voyager/issues/186) ✅
- [x] 🔵 RunDetailView → [#187](https://github.com/gander-tools/diff-voyager/issues/187) ✅

**Components**:
- [x] 🟡 RunCard → [#188](https://github.com/gander-tools/diff-voyager/issues/188) ✅
- [x] 🟡 RunForm → [#189](https://github.com/gander-tools/diff-voyager/issues/189) ✅
- [x] 🟡 RunStatusBadge → [#190](https://github.com/gander-tools/diff-voyager/issues/190) ✅
- [x] 🟡 RunProgress → [#191](https://github.com/gander-tools/diff-voyager/issues/191) ✅
- [x] 🟡 RunStatistics → [#192](https://github.com/gander-tools/diff-voyager/issues/192) ✅

#### 5.3 Phase 4: Diff Review

**Parent Issue**: [#180 - feat(frontend): implement Diff Review interface](https://github.com/gander-tools/diff-voyager/issues/180)

**Views**:
- [x] 🔵 PageDetailView → [#193](https://github.com/gander-tools/diff-voyager/issues/193) ✅

**Page Components**:
- [x] 🟡 PageList → [#194](https://github.com/gander-tools/diff-voyager/issues/194) ✅
- [x] 🟡 PageStatusBadge → [#195](https://github.com/gander-tools/diff-voyager/issues/195) ✅
- [x] 🟡 PageFilters → [#196](https://github.com/gander-tools/diff-voyager/issues/196) ✅

**Diff Components**:
- [x] 🟡 DiffSummary → [#197](https://github.com/gander-tools/diff-voyager/issues/197) ✅
- [x] 🟡 DiffBadge → [#198](https://github.com/gander-tools/diff-voyager/issues/198) ✅
- [x] 🟡 SeoDiffView → [#199](https://github.com/gander-tools/diff-voyager/issues/199) ✅
- [x] 🔵 VisualDiffView → [#200](https://github.com/gander-tools/diff-voyager/issues/200) ✅
- [x] 🟡 PerformanceDiffView → [#201](https://github.com/gander-tools/diff-voyager/issues/201) ✅
- [x] 🟡 DiffActions → [#202](https://github.com/gander-tools/diff-voyager/issues/202) ✅

**Integration & Testing**:
- [x] 🔵 E2E Tests → [#238](https://github.com/gander-tools/diff-voyager/issues/238) ✅

#### 5.4 Phase 5: Rules and Settings

**Parent Issue**: [#183 - feat(frontend): implement Rules and Settings views](https://github.com/gander-tools/diff-voyager/issues/183)

**Views**:
- [ ] 🔵 RulesListView → [#203](https://github.com/gander-tools/diff-voyager/issues/203)
- [ ] 🔵 RuleCreateView → [#204](https://github.com/gander-tools/diff-voyager/issues/204)
- [ ] 🔵 SettingsView → [#205](https://github.com/gander-tools/diff-voyager/issues/205)

**Components**:
- [ ] 🟡 RuleForm → [#206](https://github.com/gander-tools/diff-voyager/issues/206)
- [ ] 🟡 RuleCard → [#207](https://github.com/gander-tools/diff-voyager/issues/207)
- [ ] 🔵 RuleConditionBuilder → [#208](https://github.com/gander-tools/diff-voyager/issues/208)

#### 5.5 Phase 6: Polish and Accessibility

**Parent Issue**: [#184 - feat(frontend): Polish and Accessibility](https://github.com/gander-tools/diff-voyager/issues/184)

- [ ] 🔵 Accessibility improvements → [#209](https://github.com/gander-tools/diff-voyager/issues/209)
- [ ] 🔵 E2E tests with Playwright → [#210](https://github.com/gander-tools/diff-voyager/issues/210)
- [ ] 🟡 Performance optimizations → [#211](https://github.com/gander-tools/diff-voyager/issues/211)
- [ ] 🟡 Error handling and boundaries → [#212](https://github.com/gander-tools/diff-voyager/issues/212)
- [ ] 🟡 Loading states and skeleton loaders → [#213](https://github.com/gander-tools/diff-voyager/issues/213)

**Acceptance Criteria**:
- All core views functional
- Diff review workflow complete
- Responsive and accessible UI
- WCAG 2.1 AA compliance
- E2E tests for critical flows

See [CLAUDE.md](../../CLAUDE.md) for implementation details and development guidelines.

## Long-term Goals (Post-MVP)

### 6. CI/CD Integration (Priority: Low)

**Target**: Months 5-6

- [ ] GitHub Actions workflow
  - Trigger scan on PR
  - Comment diff summary on PR
  - Fail PR if critical diffs detected

- [ ] GitLab CI integration
- [ ] Jenkins plugin (if demand exists)

**Benefits**:
- Automated regression detection
- Prevent SEO regressions in production
- Continuous visual testing

### 7. Advanced Features (Priority: Low)

**Target**: Months 6-12

#### 7.1 SEO Tool Integration

- [ ] Lighthouse integration
  - SEO score tracking
  - Performance score tracking
  - Accessibility score tracking

- [ ] Screaming Frog integration
  - Crawl comparison
  - Broken link detection

#### 7.2 Advanced Visual Diff

- [ ] Structural comparison (DOM diff)
- [ ] Perceptual diff (beyond pixel matching)
- [ ] Layout shift detection
- [ ] Animation and transition handling

#### 7.3 Performance Profiling

- [ ] Waterfall chart visualization
- [ ] Resource timing analysis
- [ ] Core Web Vitals tracking
- [ ] Historical trend charts

#### 7.4 Notifications

- [ ] Email notifications
  - Run completion
  - Critical diffs detected
  - Daily/weekly summaries

- [ ] Slack integration
- [ ] Webhook support

### 8. Scale & Multi-user (Priority: Low)

**Target**: Months 12+

- [ ] User authentication
- [ ] Project sharing and permissions
- [ ] Team collaboration features
- [ ] PostgreSQL migration (for larger datasets)
- [ ] Distributed queue (BullMQ + Redis)
- [ ] Horizontal scaling

**Out of Scope for Solo Developer Tool**:
- Multi-tenant SaaS
- Online dashboard
- Paid plans

## Feature Requests

Community feature requests are tracked in GitHub Issues with the `enhancement` label.

### Top Requested Features

1. **Docker deployment** - Simplified installation (#15)
2. **Playwright test integration** - Use Diff Voyager in existing test suites (#23)
3. **Scheduled scans** - Periodic comparison runs (#31)
4. **API webhooks** - Trigger external actions on events (#42)
5. **Custom comparators** - Plugin system for domain-specific comparisons (#57)

## Non-Goals

The following are explicitly **not planned**:

- Multi-tenant SaaS platform
- User accounts and billing
- Cloud storage integration
- Mobile app
- Browser extension
- Advanced authentication (OAuth, SAML)
- Real-time collaboration
- AI-powered diff analysis

## Success Metrics

### MVP Success Criteria

- [ ] Complete framework migration without SEO regressions
- [ ] Identify critical regressions in 1-2 comparison runs
- [ ] Review all diffs in single focus session (< 1 hour)
- [ ] Stable operation on 100-500 page websites

### Post-MVP Success Criteria

- [ ] GitHub stars: 100+
- [ ] Weekly active projects: 50+
- [ ] Average crawl size: 200+ pages
- [ ] Community contributions: 10+ PRs
- [ ] Documentation completeness: 90%+

## Timeline Overview

```
Month 1-2:  Complete Phase 6 & 7 (Backend MVP)
Month 3-4:  Frontend MVP Development
Month 5:    Beta Testing & Bug Fixes
Month 6:    Public Release (v1.0)
Month 6-12: Advanced Features & Integrations
Month 12+:  Scale & Multi-user (if demand exists)
```

## See Also

- [CLAUDE.md](../../CLAUDE.md) - Development guide and implementation details
- [Architecture Overview](../architecture/overview.md) - System design
- [API Endpoints](../api/endpoints.md) - Complete API specification
- [GitHub Milestones](https://github.com/gander-tools/diff-voyager/milestones) - Tracked work
