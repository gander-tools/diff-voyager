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

**API Reference**:
- [Endpoints](docs/api/endpoints.md)
- [Types](docs/api/types.md)

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
npm install
npm run dev              # Start dev server
npm test                 # Run tests
```

#### Common Frontend Issues

**Vue 3 Component Resolution Errors**

If you see console errors like:
```
[Vue warn]: Failed to resolve component: NButton
[Vue warn]: Failed to resolve component: DefaultLayout
```

**Root Cause**: Vue 3 requires explicit imports for all components. Components cannot be used in templates without importing them first.

**Solution**: Add explicit imports at the top of the `<script setup>` section:

```typescript
// For Naive UI components
import { NButton, NCard, NLayout } from 'naive-ui';

// For custom components
import DefaultLayout from './components/layouts/DefaultLayout.vue';

// For router components
import { RouterView } from 'vue-router';
```

**Note on @vicons/tabler**: Ensure the package is installed:
```bash
npm install @vicons/tabler
```

Available icon names can be found in `node_modules/@vicons/tabler/es/`. Common icons:
- `Dashboard`, `Settings`, `Filter`
- `Folder` (note: `FolderOpen` does not exist)
- `Globe`, `Moon`, `Sun`
- `PlaylistAdd`, `Playlist`

Import icons with exact PascalCase names:
```typescript
import { Dashboard, Filter, Folder } from '@vicons/tabler';
```

#### Internationalization (i18n)

**CRITICAL RULE: NO HARDCODED STRINGS**

All user-facing text MUST use translation keys via `t()` function.

**When adding UI strings or translating**, refer to the [i18n Guide](docs/guides/i18n.md).

**Quick reference:**
- Translation files: `packages/frontend/src/i18n/locales/{en,pl}.json`
- Usage: `const { t } = useI18n();` then `{{ t('key.path') }}` in templates

#### Form Validation with vee-validate

**Status**: ✅ Implemented (January 2026)

Diff Voyager uses [vee-validate](https://vee-validate.logaretm.com/) with Zod schemas for declarative form validation in Vue 3.

**Dependencies:**
- `vee-validate@^4.15.1` - Vue 3 form validation library
- `@vee-validate/zod@^4.15.1` - Zod schema integration
- `zod@^3.25.76` - Schema validation (compatible with @ts-rest and vee-validate)

**Why vee-validate + Zod?**

- **Declarative validation**: Define validation rules in Zod schemas, not imperative code
- **Type-safe**: Full TypeScript inference from schemas
- **DRY principle**: Single source of truth for validation and types
- **Better UX**: Built-in support for validation on blur/change/submit
- **Clean code**: No manual error state management

**Example Usage:**

```typescript
// 1. Define Zod schema in validators.ts
export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required'),
  url: z.string().url('Invalid URL format'),
  // ... more fields
});

// 2. Use in Vue component
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';

const { handleSubmit, errors, defineField, validate } = useForm({
  validationSchema: toTypedSchema(createProjectSchema),
  initialValues: { name: '', url: '' },
});

// 3. Define form fields
const [name] = defineField('name');
const [url] = defineField('url');

// 4. Handle submission
const onSubmit = handleSubmit((values) => {
  // values is fully typed from schema
  emit('submit', values);
});
```

**Key Features:**

- **Nested fields**: Use dot notation for nested validation (`viewport.width`)
- **Async validation**: Built-in support for async rules
- **Multi-step forms**: Validate specific fields using `validate()`
- **Integration with Naive UI**: Works seamlessly with NForm components

**Important Notes:**

- vee-validate requires `zod@^3.x` (not v4) for compatibility
- All form validation should use vee-validate for consistency
- Error messages should be defined in Zod schemas, not in components
- Test async validation with proper awaits: `await wrapper.vm.$nextTick()`

See `packages/frontend/src/components/ProjectForm.vue` for a complete multi-step form example.

#### Screenshot Updates

**Status**: ✅ Automated screenshot generation available

Diff Voyager automatically generates documentation screenshots for all UI views.

**When to Update Screenshots**:
- After implementing new views or pages
- After making visual changes to existing views
- After UI/UX improvements
- Before committing frontend changes

**How to Update**:
```bash
# Ensure backend is not running (script will start it automatically)
npm run screenshots
```

**What Happens**:
1. Script starts backend server automatically
2. Script starts frontend dev server
3. Creates test project via API
4. Captures 11 screenshots (1024x768) using Playwright
5. Saves to `docs/screenshots/*.png`
6. Stops both servers

**Screenshot Files**:
- `01-dashboard.png` - Main dashboard
- `02-projects-list.png` - Project list with pagination
- `03-project-create.png` - Multi-step project creation
- `04-project-detail.png` - Project detail view
- `05-run-create.png` - Run creation form
- `06-run-detail.png` - Run detail and results
- `07-page-detail.png` - Page comparison details
- `08-rules-list.png` - Mute rules list
- `09-rule-create.png` - Rule creation form
- `10-settings.png` - Application settings
- `11-not-found.png` - 404 page

**Important Notes**:
- Screenshots are **version controlled** in git (included in commits)
- Used in documentation: `roadmap.md`, `CLAUDE.md`
- Viewport: 1024x768 (configurable in script)
- See `docs/screenshots/README.md` for complete index

**Troubleshooting**:
- If script fails, ensure no servers are running on ports 3000 or 5173
- Check Playwright installation: `npx playwright install`
- Backend must be buildable: `npm run build:backend`

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

## Issue Management and Dependency Tracking

**Policy:** All feature implementation must follow structured issue hierarchy with explicit dependency tracking.

### Issue Hierarchy Structure

Every major feature (Phase) should have:

1. **Parent Issue** - Epic that **implements the integrated feature** using sub-issue components
   - **Creates/implements** the complete feature by integrating sub-issue components
   - Contains tasklist with links to all sub-issues
   - Groups sub-issues by implementation level
   - Tracks overall acceptance criteria
   - Description explicitly states "by integrating components from sub-issues..."

**Parent Issue Description Format:**

Parent issue descriptions must clearly state they **implement/create** the integrated feature:
- ✅ **Good:** "Implement complete Run Management UI **by integrating components from sub-issues (#185-#192, #235, #236) into a complete hierarchical workflow** for creating and monitoring comparison runs."
- ❌ **Bad:** "Implement complete Run Management UI for creating and monitoring comparison runs." (doesn't mention integration work)

The description should make it clear the parent issue:
1. **Creates/implements** something (the integrated feature)
2. **Uses components** from sub-issues
3. **Integrates** them into a complete workflow

2. **Sub-Issues** - Organized in 4 levels based on dependencies

#### Level 1: Atomic Components (No Dependencies)

- Building blocks that don't depend on other issues
- Can be implemented in parallel
- Typically `size/small` or `size/medium`
- Examples: RunCard, RunForm, RunStatusBadge

**Issue Body Format:**
```markdown
## Description
[Component description]

## Level
**Level 1: Atomic Component** (no dependencies)

## Implementation
[Technical details]
```

#### Level 2: Composite Views (Depend on Level 1)

- Views that use atomic components
- Can be implemented in parallel once their dependencies are ready
- Typically `size/medium` or `size/large`
- Must document dependencies in issue body and comments

**Issue Body Format:**
```markdown
## Description
[View description]

## Level
**Level 2: Composite View**

## Dependencies
Depends on:
- #X (ComponentName) - description
- #Y (ComponentName) - description

## Implementation
[Technical details - how components are used]
```

**Required Comment:**
```markdown
**Dependencies:** Depends on #X (ComponentName), #Y (ComponentName)
```

#### Level 3: Integration (Depends on All Views)

- Single issue that connects everything together
- Routing, navigation, store integration, API wiring
- Depends on ALL Level 1 + Level 2 issues
- Typically `size/medium`

**Issue Body Format:**
```markdown
## Description
Integrate all [FeatureName] components and views into complete workflow.

## Level
**Level 3: Integration** (depends on all components and views)

## Integration Tasks
- [ ] Add routes to Vue Router
- [ ] Wire up store (Pinia) with CRUD actions
- [ ] Add navigation links in parent views
- [ ] Connect API services
- [ ] Add breadcrumbs and navigation

## Dependencies
Depends on:
- Level 1: #A, #B, #C (all components)
- Level 2: #X, #Y, #Z (all views)

Blocks: #[PARENT] (parent issue)
```

#### Level 4: Testing (Depends on Integration)

- E2E tests for complete feature flow
- Depends on Integration issue being complete
- Blocks parent issue from being closed
- Typically `size/medium`

**Issue Body Format:**
```markdown
## Description
Add end-to-end tests for [FeatureName] workflow.

## Level
**Level 4: Testing** (depends on integration)

## Test Scenarios
- [ ] Happy path: [flow description]
- [ ] Error handling: [scenarios]
- [ ] Edge cases: [scenarios]

## Dependencies
Depends on: #[INTEGRATION_ISSUE] (Integration)
Blocks: #[PARENT] (parent issue - cannot close without E2E tests)
```

### Example: Run Management (Phase 3)

**Levels:**
- Level 1: 5 atomic components (RunCard, RunForm, RunStatusBadge, RunProgress, RunStatistics)
- Level 2: 3 composite views (RunListView, RunCreateView, RunDetailView)
- Level 3: 1 integration (Routing + Store + Navigation)
- Level 4: 1 E2E testing

**Dependency Matrix:**
```
Issue      | Level | Depends On
-----------|-------|------------------
#188       | 1     | - (atomic)
#189       | 1     | - (atomic)
#190       | 1     | - (atomic)
#191       | 1     | - (atomic)
#192       | 1     | - (atomic)
#185       | 2     | #188
#186       | 2     | #189
#187       | 2     | #190, #191, #192
#235       | 3     | #185, #186, #187 (+ all L1)
#236       | 4     | #235
#179       | Epic  | #236 (+ all others)
```

### Execution Rules

1. **Cannot start Level N until all dependencies from Level N-1 are CLOSED**
2. **Within a level, issues can be worked on in parallel** (if dependencies met)
3. **Parent issue implements integration and stays OPEN until ALL sub-issues (including E2E) are CLOSED** - Parent issue represents the work of integrating all sub-issue components into complete feature
4. **Always add dependency comments to issues** for GitHub tracking

### Creating Issues for New Feature

**Checklist:**
- [ ] Create parent issue with tasklist grouped by levels
- [ ] Create all Level 1 issues (atomic components)
- [ ] Create all Level 2 issues (composite views) with dependencies documented
- [ ] Create Level 3 issue (integration) depending on all Level 1 + 2
- [ ] Create Level 4 issue (E2E tests) depending on integration
- [ ] Add dependency comments to ALL issues except Level 1
- [ ] Assign to milestone
- [ ] Add appropriate labels (size, priority, scope)

### Benefits

- ✅ Clear execution order prevents premature implementation
- ✅ Parallel work possible within levels
- ✅ Dependencies visible in GitHub
- ✅ Parent issue tracks progress across levels
- ✅ Easy to identify what's blocking vs. what's ready
