# DiffVoyager - Claude Code Development Guide

## Project Overview

DiffVoyager is a local website version comparison tool designed for solo developers upgrading frameworks and dependencies. It verifies that code changes maintain visual correctness, content integrity, SEO compliance, and performance metrics.

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
- Node.js v22 with TypeScript
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
npm install              # Install root dependencies
npm run setup            # Setup all packages
```

### Backend Development
```bash
cd packages/backend
npm install
npm run dev              # Start in development mode
npm test                 # Run tests
npm run test:watch       # Watch mode
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

When working on DiffVoyager:

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
