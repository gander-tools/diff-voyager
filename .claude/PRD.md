# PRD – Local Website Version Comparison Tool (Crawler + Visual/SEO Diff)

## 1. Context and Goals

The tool serves a solo developer who is upgrading a framework and dependencies in an existing frontend project and needs comprehensive, automated verification that after the changes, the website maintains visual correctness, content integrity, SEO compliance, and basic performance metrics.

Primary scenario: create a project, perform a full crawl to establish a "baseline" of the current version, make code changes (framework upgrade, refactor), run a comparison against the new version, analyze differences, and iteratively apply fixes until reaching an acceptable state.

## 2. Scope

### 2.1. In Scope (MVP)

- Local tool, run manually on the developer's computer.
- Support for multiple projects, each project = one migration / one pair of "website + baseline".
- One baseline per project, created from a full crawl of the existing site.
- Unlimited comparison runs ("baseline vs run X": n1, n2, n3…).
- Full audit of HTML content and HTTP headers for each page.
- Collection of basic SEO metrics and HTTP statuses (title, meta description, canonical, robots, H1, status, redirects).
- Full-page screenshots for baseline and runs.
- Pixel-by-pixel visual diff (baseline vs run) with diff image generation (SVG/bitmap) on demand.
- Performance data collection in HAR format (per page, per run) plus aggregates (load time, request count, total size).
- Configurable crawl scope (full audit within domain) and simple run profiles (e.g., "visual+SEO" vs "visual+SEO+performance").
- Persistent asynchronous queue with atomic operations for crawling and page processing.
- Handling of partial failures at page/run level with ability to resume run and reprocess failed/incomplete pages.
- Run state management (new, in progress, interrupted, completed) with manual interrupt and resume capability.
- Manual result review in UI (no CI, no notifications).
- Code review of differences: marking differences as "accepted" and defining muting rules for specific difference types / elements (e.g., CSS/XPath selectors).
- Export of full project results (HTML, screenshots, diffs, HAR, manifest JSON) as directory structure / archive.

### 2.2. Out of Scope for MVP

- Online dashboard (SaaS, internet access).
- Multi-tenant, user accounts, shared projects.
- CI/CD integration (GitHub Actions, GitLab CI, etc.).
- Email/Slack/other notifications.
- Advanced authorization modes (MVP: no authentication).
- Advanced visual algorithms (MVP: pixel-by-pixel with simple tolerance threshold).
- Advanced SEO analysis beyond basic meta-data.
- Integration with external SEO/monitoring tools – allowed as future work but without requirements in this PRD.

### 2.3. Future Work (Development Directions – No Requirements in This PRD)

- Integration with SEO and analytics tools.
- CI/CD integrations.
- Notifications and webhooks.
- Advanced performance profiling (e.g., integration with external dashboards).
- More sophisticated layout change and dynamic content detection.

## 3. Domain Model (Conceptual)

Entities (target: defined as shared TypeScript types, shared between backend and frontend):

- **Project**
  - Id, name, description
  - Crawl configuration (base URL, domain scope rules, page/time limits)
  - Run profile configuration (which artifacts to collect)
  - Ignore filters (CSS/XPath, headers, fields to anonymize)
  - Collection of Runs

- **Baseline**
  - Created automatically as the first full run of a project
  - Reference to set of pages (Page) and their artifacts
  - Immutable within the project (change requires new project)

- **Run**
  - Run id, timestamp, status (new, in progress, interrupted, completed)
  - Reference to Project and Baseline
  - Configuration used for this run (profile, viewport, data scope)
  - Statistics (page count, error count, critical difference count)
  - Collection of pages (PageRunEntry) and their diffs

- **Page**
  - Normalized page identifier within project (URL after normalization: path + selected query)
  - Normalization rules (ignored parameters, trailing slash)
  - Related entries in Baseline and individual Runs

- **PageSnapshot** (per run, per page)
  - Raw HTML or processed DOM (with hash)
  - HTTP response headers
  - HTTP status and any redirects
  - SEO data (title, meta description, canonical, robots, H1…)
  - Paths/references to artifacts: full-page screenshot, diff image (if generated), HAR file, other media/metadata
  - Performance metadata (load time, request count, total size)

- **Diff** (Baseline vs Run for a given page)
  - Result of HTML/SEO comparison (list of changes)
  - Result of visual comparison (number and percentage of differing pixels, threshold exceeded/not)
  - Result of HAR comparison (changes in aggregates, significant resource changes)
  - Types of differences (SEO, layout/visual, content, performance)
  - Business status of difference: new, accepted, muted by rule
  - Reference to rules (Rule/Mute) affecting the assessment

- **Rule / MuteRule**
  - Rules for ignoring/muting: CSS/XPath selectors, headers, field/key patterns (e.g., timestamp, session id)
  - Scope (global / per project)
  - Activity status
  - Association with difference types (SEO, visual, HAR, etc.)

## 4. Functional Requirements (Checklists)

### 4.1. Main Solo Developer Flow – Baseline → Migration → Run → Fixes → Rerun

- Ability to create a new project, provide base URL and basic settings.
- Run full crawl to establish baseline.
- Save all project pages (Page) and their snapshots (HTML, SEO, screenshot, HAR if enabled in profile).
- After code changes (outside the tool) – run comparison run.
- For each run – compare against baseline at all pages.
- Display list of pages with differences, highlighting critical ones.
- Detailed page view with tabs: HTML/SEO diff, visual diff, HAR/performance.
- Ability to fix code, run next comparison, until significant differences disappear or are accepted.

### 4.2. Projects and Configuration

- Create, edit, delete projects.
- Configure base URL, scope rules (domain, subdomains, exclusions).
- Define ignored element filters (CSS/XPath, headers, fields).
- Configure run profiles (e.g., "visual+SEO", "full with HAR").
- Configure limits: max page count, max run time (optional).

### 4.3. Crawl and Queue

- Full crawl within defined scope (no URL duplication after normalization).
- Persistent asynchronous request queue, enabling run resume after interruption.
- Atomic operations: each URL processed in a way that allows safe interruption and resumption.
- Manual run interrupt capability from UI/CLI.
- Auto-retry for pages with errors (with attempt limit).
- Manual page retry from detail view.

### 4.4. Data Collection (Per Page)

- Retrieve HTML and HTTP headers.
- Record HTTP status and any redirects.
- Extract basic SEO data (title, meta description, canonical, robots, H1).
- Capture full-page screenshot in configured viewport (desktop).
- (If profile allows) – save HAR and extract metrics (load time, request count, total size).
- Save artifacts in directory structure per project manifest.

### 4.5. Comparison and Diff

- Map pages between baseline and run based on normalized URL.
- HTML/SEO comparison:
  - Detect changes in key tags (title, meta description, canonical, robots, H1).
  - Detect significant text content changes (at least at presence/absence or change level).
- Visual comparison:
  - Pixel-by-pixel diff with percentage change calculated.
  - Global threshold for entire tool and per-project threshold.
  - Mark whether difference exceeds threshold.
  - Generate diff image only for pages with significant differences or on demand.
- HAR/performance comparison:
  - Aggregates (load time, request count, total size) baseline vs run.
  - Detect significant changes (e.g., load time increase beyond threshold, substantial request count increase).

### 4.6. Diff Review, Acceptance, and Muting

- Page list view with differences for a run, filterable by difference type (SEO, visual, performance).
- Detailed page view with list of detected differences.
- Ability to mark specific difference as "accepted".
- Ability to undo acceptance (toggle) with audit log of decisions.
- Ability to create mute rule from specific difference (e.g., "mute this CSS selector" or "ignore this metric in future").
- Central mute rule list view for project (review and edit).
- Muted differences hidden by default with option to show on demand.

### 4.7. Reporting and Export

- Run summary:
  - Page count, unchanged pages, pages with differences, error count.
  - Count of critical differences (after rules and muting).
- Project summary:
  - List of runs with dates and brief statistics.
  - Simple trend of critical difference count and accepted differences over time.
- Project export:
  - JSON manifest describing projects, runs, pages, diffs, artifacts.
  - Directory structure containing HTML, screenshots, diffs, HAR and other files.
  - "Full" mode (with all artifacts).

## 5. Non-Functional Requirements

- Tool operates locally on a typical developer laptop.
- No requirement for permanent internet connectivity (beyond the target website being crawled).
- Performance:
  - Full audit of average-sized website (hundreds of pages) should be executable in reasonable time (parameters to be refined in tests).
  - Ability to regulate limits (pages, time) to avoid overwhelming the machine.
- Disk usage:
  - Artifacts (HTML, screenshot, diff, HAR) generate significant volume – run profile configuration allows limiting data types collected.
- Stability:
  - Run may be interrupted by user or failure – tool must enable resumption and repair of missing/error data.
- Security:
  - No handling of critical user data – however, ability to anonymize selected fields (e.g., tokens, session IDs) in HTML/HAR through rules.

## 6. Architecture (High-Level)

### 6.1. Backend

- Node/Deno ecosystem with TypeScript as default language.
- Crawler and browser automation based on Crawlee + Playwright libraries (or equivalents).
- Persistent queue and storage of requests/results (local disk, simple file formats/SQLite – to be specified in technical document).
- Domain layer with models Project, Run, Page, PageSnapshot, Diff, Rule/Mute (TypeScript types).
- API (local HTTP or IPC) exposing data to frontend (JSON).
- Shared TypeScript types package shared between backend and frontend.

### 6.2. Frontend

- Vue.js 3 + TypeScript.
- Built with bun.
- Separate frontend project (separate repo or directory), communicating with backend via local API.
- Basic views:
  - Project list.
  - Project view (runs list).
  - Run view (pages and differences list).
  - Page view (tabs: HTML/SEO, visual, performance).
  - Mute/ignore rules view.

### 6.3. Deployment

- MVP: separate scripts run locally (backend + frontend dev server / build).
- Eventually: separate Docker containers for backend and frontend (out-of-scope for MVP, but planned).

## 7. Testing Strategy (TDD)

- Development conducted in TDD mode.
- Unit tests:
  - Domain models (Project, Run, Page, Diff, Rule).
  - HTML/SEO comparison logic.
  - Visual difference calculation logic (at data level, not bitmap itself).
  - HAR/performance metric comparison logic.
  - Mute rule and difference acceptance logic (statuses, priorities).
- Integration tests:
  - Mini test server serving controlled HTML/CSS/resources.
  - Crawler traversing test pages and saving results.
  - Comparison run on modified test server version.
  - Verification of diff generation and statuses.
- End-to-end tests:
  - Run full flow: create project, baseline, run after changes, review differences in UI.
- Data contract validation:
  - Shared TypeScript types between backend and frontend.
  - Tests/validators checking JSON structures returned by backend match domain types.

## 8. UX / UI

Minimal requirements:

- Simple, transparent interface reflecting the main solo developer flow.
- Clear status indicators for runs (e.g., color/icon: in progress, completed, interrupted).
- Clear indicators for page statuses (OK, partial, error).
- Page list with differences filterable by difference type.
- Visual diff view: toggle between baseline, run, and diff with zoom capability.
- Clear presentation of SEO and performance differences (value changes, highlight).
- Filter panel:
  - Show/hide muted differences.
  - Show only critical differences.

## 9. Risks and Limitations

- **Dynamic content** (dates, counters, ads) may generate many false differences – mitigation: CSS/XPath filters, mute rules, tolerance thresholds.
- **Large website size** (thousands of pages) may cause long runs and large data volume – mitigation: page/time limits, run profiles with restricted artifact types.
- **No CI and multi-user** – tool doesn't support team workflow by nature, optimized for solo developer.
- **Simple visual diff algorithm** (pixel-by-pixel) – not all perceptually small changes classified well; possible false alarms on minor rendering differences.
- **No advanced authorization** – MVP doesn't support projects requiring complex login.

## 10. Success Criteria (From Solo Developer's Perspective)

- Ability to conduct full framework migration using the tool without losing key SEO elements (title, meta, canonical, H1) and visible layout/content regressions on critical pages.
- Ability to identify critical regressions across entire website (HTTP statuses, missing content, major visual changes, significant performance drops) in one or two comparison runs.
- Transparent report allowing solo developer to review critical differences in one "focus session" without drowning in noise from insignificant changes.
- Stable operation on local developer machine at typical project sizes.

## 11. Implementation Status

**Last Updated**: 2026-01-08

### MVP Backend: Phase 5 Complete ✅

The backend implementation is substantially complete with all core functionality operational:

**Completed Phases**:
- ✅ Phase 0: Test infrastructure and foundation
- ✅ Phase 1: Storage layer (100% migrated to Drizzle ORM)
- ✅ Phase 2: Domain logic and comparators (SEO, visual, header, performance)
- ✅ Phase 3: Crawler infrastructure (Playwright + Crawlee)
- ✅ Phase 4: Task queue (SQLite-based async processing)
- ✅ Phase 5: API layer (13 endpoints fully implemented)

**In Progress**:
- 🟡 Phase 6: Integration workflows (50% - diff workflow integration pending)
- 🟡 Phase 7: Production polish (50% - optimization pending)

**Not Started**:
- ❌ Frontend UI (Vue 3 implementation planned)

### Current Capabilities

**Functional**:
- Single page scanning (sync and async modes)
- Multi-page crawling with Crawlee
- Full artifact capture (HTML, screenshots, SEO, performance, HAR)
- URL normalization and duplicate detection
- Complete REST API with Swagger documentation
- All comparison algorithms implemented (SEO, visual, header, performance)
- SQLite-based task queue with retry logic
- Browser pooling for efficient page capture
- Secure file access with rate limiting

**Pending Integration**:
- Automatic diff generation during comparison runs
- Diff acceptance and muting workflow
- Frontend UI for diff review

### Architecture Evolution

**Database**: Successfully migrated from raw SQL to Drizzle ORM (January 2026)
- All 6 repositories migrated (100% complete)
- Benefits: Type safety, automatic prepared statements, JSON column support
- See [docs/guides/drizzle-migration.md](../docs/guides/drizzle-migration.md)

**Queue System**: Hybrid sync/async processing
- Synchronous mode for quick scans
- SQLite-based queue for large crawls
- No external dependencies (no Redis required)

### Documentation Structure

Complete documentation reorganization (January 2026):
- **[docs/README.md](../docs/README.md)** - Documentation index
- **[docs/architecture/](../docs/architecture/)** - System design and domain model
- **[docs/development/](../docs/development/)** - Implementation status, roadmap, changelog
- **[docs/api/](../docs/api/)** - API reference
- **[docs/guides/](../docs/guides/)** - Getting started, development workflow, testing
- **[docs/features/](../docs/features/)** - Feature-specific documentation

### Next Steps

See [docs/development/roadmap.md](../docs/development/roadmap.md) for detailed roadmap:

1. Fix skipped tests (snapshot data retrieval, HAR URL handling)
2. Integrate diff workflow (automatic generation during runs)
3. Complete Phase 6 integration testing
4. Begin frontend UI development (Vue 3)

### Reference

For detailed information:
- [Implementation Status](../docs/development/implementation-status.md) - Phase completion status, test coverage, and major milestones
- [Roadmap](../docs/development/roadmap.md) - Next steps and planned features
- [Architecture](../docs/architecture/overview.md) - System design and components

