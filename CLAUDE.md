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
- [Roadmap](docs/development/roadmap.md) - Current status, completed work, and planned features
- [GitHub Metadata](docs/development/github.md) - Labels, milestones, and issue conventions
- [Test Documentation](docs/development/tests.md) - Comprehensive test structure (read-only)

**API Reference**:
- [Endpoints](docs/api/endpoints.md)
- [Types](docs/api/types.md)

## 📋 Quick Navigation

**Daily Development:**
- [Development Workflow](#development-workflow) - TDD approach
- [Git Workflow](#git-workflow) - Commit format, branches
- [Initial Setup](#initial-setup) - Essential commands

**Context-Specific Guides** (load on demand):
- 🔐 **File system/API/auth** → [Security Guidelines](docs/guides/security.md)
- 🌐 **Adding API endpoints** → [@ts-rest Guide](docs/guides/ts-rest.md)
- 🗄️ **Database queries** → [Drizzle ORM Guide](docs/guides/drizzle-orm.md)
- 🎨 **Frontend work** → [Frontend Development](docs/guides/frontend-dev.md)
- 🌍 **UI strings/translation** → [i18n Guide](docs/guides/i18n.md)
- 🏗️ **Planning features** → [Issue Management](docs/guides/issue-management.md)
- 🖥️ **Running servers** → [Server Commands](docs/guides/running-servers.md)
- 🧪 **Backend development** → [Backend Guide](docs/guides/backend-dev.md)
- ⚠️ **Preventing regressions** → [Common Regression Points](docs/guides/common-regressions.md)

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

See [Domain Model](docs/architecture/domain-model.md) for detailed information about Project, Baseline, Run, Page, PageSnapshot, Diff, and Rule/MuteRule entities.

## Security Guidelines

**CRITICAL:** When working with file system operations, API endpoints, or authentication, refer to [Security Guidelines](docs/guides/security.md) for mandatory security rules.

**Quick Checklist:**
- [ ] Rate limiting applied (file system/expensive operations)
- [ ] Path traversal prevention (file paths)
- [ ] Input validation present
- [ ] Error handling doesn't leak information
- [ ] Tests cover security scenarios

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
npm run dev:backend   # Start backend (port 3000)
npm run dev:frontend  # Start frontend
```

The server will be available at `http://localhost:3000`.
- **Swagger UI**: `http://localhost:3000/docs`
- **Endpoints**: See [@ts-rest Guide](docs/guides/ts-rest.md#available-endpoints)

For advanced server options (port, data dir, log levels) and API testing examples, see [Running Servers](docs/guides/running-servers.md).

### Backend Development

```bash
cd packages/backend
npm test        # Run all tests
npm run build   # Build TypeScript
npm run dev     # Start dev server
```

For detailed test commands, test structure, and backend development patterns, see [Backend Development Guide](docs/guides/backend-dev.md).

### Frontend Development

```bash
cd packages/frontend
npm run dev   # Start dev server
npm test      # Run tests
```

**Guides:**
- **Vue 3 component errors?** → [Common Issues](docs/guides/frontend-dev.md#common-frontend-issues)
- **Creating forms?** → [Form Validation](docs/guides/frontend-dev.md#form-validation-with-vee-validate)
- **Adding UI strings?** → [i18n Guide](docs/guides/i18n.md)
- **Updating screenshots?** → [Screenshot Guide](docs/guides/frontend-dev.md#screenshot-updates)

### Shared Types
```bash
cd packages/shared
npm install
npm run build            # Build types
npm test                 # Validate types
```

## @ts-rest Type-Safe API Contract

**Status**: ✅ Implemented (January 2026)

Diff Voyager uses [@ts-rest](https://ts-rest.com/) for type-safe API communication.

**When adding new API endpoints**, refer to the [@ts-rest Guide](docs/guides/ts-rest.md) for:
- API Contract Structure
- Backend Implementation (@ts-rest/fastify)
- Frontend Client (@ts-rest/core)
- Testing patterns

**Quick reference:**
- Contract: `packages/shared/src/api-contract.ts`
- Backend routes: `packages/backend/src/api/routes-ts-rest.ts`
- Frontend client: `packages/frontend/src/services/api/client.ts`

## Drizzle ORM

**Status**: ✅ Migration Complete (January 2026)

All repositories use Drizzle ORM for type-safe database queries.

**When working with database queries**, refer to the [Drizzle ORM Guide](docs/guides/drizzle-orm.md) for:
- Repository Pattern with Drizzle
- Schema Definition
- JSON Columns
- Common query patterns

**Quick reference:**
- Schemas: `packages/backend/src/drizzle/schema/`
- Repositories: `packages/backend/src/repositories/*-repository.ts`

## Testing Strategy

**Test Documentation**: See [Test Documentation](docs/development/tests.md) for comprehensive overview of all tests (read-only, updated manually or on explicit request).

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

**When planning new features or creating issue hierarchies**, refer to the [Issue Management Guide](docs/guides/issue-management.md) for:
- Issue Hierarchy Structure (4 levels)
- Execution Rules
- Creating Issues for New Feature (checklist)
- Dependency tracking
