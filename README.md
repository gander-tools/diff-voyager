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

# Install dependencies
npm install
npm run setup
```

### Usage

```bash
# Start backend API
npm run dev:backend

# In another terminal, start frontend
npm run dev:frontend
```

Visit `http://localhost:5173` to access the UI.

**API Documentation**: The backend exposes Swagger UI at `http://localhost:3000/docs` for interactive API documentation and testing.

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

### Phase 0: Foundation Setup (90% ✅)
- [x] Test infrastructure (Vitest, MockServer, test helpers)
- [x] HTML fixtures for SEO testing
- [x] Shared TypeScript types (API requests/responses)
- [ ] Build automation for shared package

### Phase 1: Storage Layer (80% ✅)
- [x] SQLite database schema with migrations
- [x] ProjectRepository (create, findById, update)
- [x] RunRepository (create, findById, updateStatus)
- [x] PageRepository (create, findByUrl, findOrCreate)
- [x] SnapshotRepository (create, findByPageAndRun)
- [ ] DiffRepository (comparison results storage)
- [ ] ArtifactStorage helper (file operations abstraction)

### Phase 2: Domain Logic (20% 🟡)
- [x] URL Normalizer (path normalization, query handling, tracking parameter removal)
- [ ] SEO Extractor & Comparator (title, meta, canonical, robots, headings)
- [ ] Visual Comparator (pixelmatch integration, diff image generation)
- [ ] Header Comparator (HTTP header differences)
- [ ] Performance Comparator (load time, request count, size deltas)
- [ ] Full Page Comparator (orchestration of all comparators)

### Phase 3: Crawler (50% 🟡)
- [x] Playwright browser setup
- [x] Page capture (HTML, headers, status, redirects)
- [x] Screenshot capture with configurable viewport
- [x] SEO data extraction
- [x] Performance metrics collection
- [x] HAR file capture (configured)
- [ ] Crawlee integration for multi-page discovery
- [ ] Link discovery and following
- [ ] Domain boundary checking
- [ ] Max pages limit and concurrency control
- [ ] URL filtering patterns (include/exclude)

### Phase 4: Task Queue (0% 🔴)
- [ ] Task queue core (enqueue, dequeue, complete, fail)
- [ ] Page task queue (batch operations, progress tracking)
- [ ] Task processor (background processing loop)
- [ ] Retry logic and error recovery
- [ ] Graceful shutdown

### Phase 5: API Layer (70% ✅)
- [x] Fastify app with Swagger UI (`/docs`)
- [x] Request validation and error handling
- [x] Rate limiting and security headers
- [x] POST /api/v1/scans (create scan with sync/async mode)
- [x] GET /api/v1/projects/:projectId (project details with pages)
- [x] GET /api/v1/artifacts/:pageId/* (screenshots, HTML, HAR, diffs)
- [x] GET /health (health check)
- [ ] GET /api/v1/tasks/:taskId (task status and progress)
- [ ] POST /api/v1/projects/:id/runs (create comparison run)
- [ ] GET /api/v1/runs/:runId (run details)
- [ ] GET /api/v1/runs/:runId/pages (pages list with filtering)
- [ ] GET /api/v1/pages/:pageId/diff (detailed diff view)

### Phase 6: Integration & Workflows (30% 🟡)
- [x] ScanProcessor (orchestrates project → run → capture → storage)
- [x] Single page baseline capture (sync mode)
- [x] Artifact persistence (screenshots, HTML, performance data)
- [ ] Baseline vs run comparison workflow
- [ ] Diff generation and storage
- [ ] Multi-page crawl workflow
- [ ] Async task processing integration

### Phase 7: Polish & Production Ready (40% 🟡)
- [x] Rate limiting on all API endpoints
- [x] Path traversal prevention with symlink protection
- [x] Input validation and error sanitization
- [x] Swagger/OpenAPI documentation
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

### Current Status: **Single Page Capture Working** ✅

The system can currently:
- ✅ Capture single pages with full artifacts
- ✅ Extract SEO metadata and performance metrics
- ✅ Store baselines in SQLite
- ✅ Serve artifacts via REST API
- ✅ Provide interactive API documentation

Not yet available:
- ❌ Multi-page site crawling
- ❌ Baseline vs run comparison
- ❌ Visual/SEO diff generation
- ❌ Background task processing
- ❌ Frontend UI

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
