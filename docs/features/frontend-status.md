# Frontend Implementation Status

**Last Updated**: 2026-01-12
**Current Phase**: Phase 1 & 2 Complete ✅
**Next Phase**: Phase 3 (Run Management Views) → [#179](https://github.com/gander-tools/diff-voyager/issues/179)

---

## Overview

The Diff Voyager frontend is a Vue 3 single-page application that provides a user interface for managing website comparison projects, reviewing differences, and tracking migration progress.

**Current Status**: Foundation and project management complete (Phase 1 & 2). Users can now create, view, edit, and delete projects through a fully functional UI with multi-step wizard, pagination, and comprehensive project details.

---

## What's Currently Visible in the UI

When you visit http://localhost:5173 with the backend running, here's what you'll see:

### Main Layout

![Main Layout - Dashboard](../screenshots/01-dashboard.png)

The application uses a responsive layout with:
- **Header** (top bar): Language switcher, theme switcher
- **Sidebar** (left): Navigation menu with active route highlighting
- **Breadcrumb** (below header): Dynamic path display
- **Main Content** (center): Current view rendered by Vue Router

### Header (Top Bar)

**Right Side Controls**:
- **Language Switcher**: Dropdown with flag icons
  - 🇬🇧 English
  - 🇵🇱 Polski (Polish)
  - Click to change language instantly
  - Selection saved to localStorage

- **Theme Switcher**: Dropdown with theme options
  - ☀️ Light Theme
  - 🌙 Dark Theme
  - 🔄 Auto (follows system preference)
  - Selection saved to localStorage

### Sidebar (Left)

**Navigation Menu**:
1. **📊 Dashboard** (/)
   - Active when on homepage
   - Shows green highlight when selected

2. **📁 Projects** (/projects)
   - Dropdown arrow (expandable in future)
   - Submenu items:
     - All Projects
     - Create New

3. **📝 Rules** (/rules)
   - Mute rules management
   - Submenu items:
     - All Rules
     - Create New

4. **⚙️ Settings** (/settings)
   - Application settings

**Sidebar Features**:
- Collapsible: Click hamburger icon to collapse/expand
- Collapsed: Shows only icons (64px width)
- Expanded: Shows icons + labels (240px width)
- Active route highlighting with green accent
- Hover effects on menu items

### Breadcrumb Navigation

**Dynamic Path Display**:
- Shows current location in app hierarchy
- Example: `Home > Projects > Project Detail`
- Updates automatically based on current route
- Each segment is clickable (except last)

### Main Content Area

Now displays **fully functional project management views**:

#### Dashboard (/) ✅

![Dashboard View](../screenshots/01-dashboard.png)

**Features**:
- Welcome message: "Diff Voyager - Website version comparison tool"
- Quick Actions: "New Project" and "All Projects" buttons
- Statistics Cards:
  - Total Projects
  - Active Projects
  - Completed Projects
  - Recent Activity
- Recent Projects List:
  - Project cards with name, URL, status, created date
  - Delete action with confirmation
  - Empty state when no projects exist

#### Projects (/projects) ✅

![Projects List](../screenshots/02-projects-list.png)

**Features**:
- Page header with title and "New Project" button
- 3-column responsive grid layout
- ProjectCard components showing:
  - Project name and URL
  - Status badge (color-coded)
  - Creation date
  - Quick actions (View Details, Delete)
- Pagination controls: 12 projects per page
- Empty state: "No projects yet. Create your first project!"

#### Create Project (/projects/new) ✅

![Project Creation Wizard - Step 1](../screenshots/03-project-create.png)

**Multi-step wizard** (3 steps):

**Step 1: Basic Information**
- Project Name (required)
- Website URL (required)
- Description (optional)

**Step 2: Crawl Settings**
- Enable crawling toggle
- Max pages limit
- Crawl depth
- URL patterns to include/exclude

**Step 3: Run Profile**
- Viewport dimensions (width x height)
- Collect HAR files toggle
- Visual diff threshold percentage
- Wait after load (milliseconds)

**Features**:
- Real-time validation with vee-validate + Zod
- Error messages below inputs
- Step progress indicator
- Back/Next/Cancel buttons
- Form state persisted across steps

#### Project Detail (/projects/:id) ✅

![Project Detail View](../screenshots/04-project-detail.png)

**Sections**:

1. **Header**:
   - Back button
   - Project name (title)
   - Project URL (subtitle)
   - Status badge

2. **Actions**:
   - "New Run" button (primary)
   - "Delete Project" button (danger)

3. **Description**:
   - Project description text
   - Editable (future enhancement)

4. **Statistics Grid** (4 cards):
   - Total Pages
   - Compared Pages (pages with diffs)
   - Pages with Errors
   - Pending Pages (not yet processed)

5. **Configuration**:
   - Crawl Settings: Enabled/Disabled, Max Pages
   - Viewport: Width x Height (e.g., 1920x1080)
   - Visual Diff Threshold: Percentage (e.g., 1%)
   - HAR Collection: Enabled/Disabled

#### Rules (/rules) ⏳

![Rules List View](../screenshots/08-rules-list.png)

**Status**: Phase 5 Planned

Placeholder view showing "RulesListView - To be implemented in Phase 5"

---

#### Settings (/settings) ⏳

![Settings View](../screenshots/10-settings.png)

**Status**: Phase 5 Planned

Placeholder view showing "SettingsView - To be implemented in Phase 5"

---

#### 404 Not Found (any invalid route)

![404 Not Found](../screenshots/11-not-found.png)

**Features**:
- Large "404" heading
- "Page Not Found" message
- Helpful description: "The page you're looking for doesn't exist."
- Action buttons:
  - "Go Back" (browser history)
  - "Go Home" (navigate to dashboard)
- Theme-aware styling (light/dark mode)

---

## Interactive Features Working Now

### 1. Theme Switching

**How to Test**:
1. Click the theme dropdown in top-right corner
2. Select "Light", "Dark", or "Auto"
3. UI instantly updates with new theme
4. Refresh page - theme persists

**What Changes**:
- Background colors (light gray → dark gray)
- Text colors (dark → light)
- Component colors (adjusted for contrast)
- Naive UI components automatically adapt

### 2. Language Switching

**How to Test**:
1. Click the language dropdown (shows current: EN or PL)
2. Select different language
3. All UI text updates instantly:
   - Navigation menu labels
   - Placeholder text
   - Button labels
   - Error messages (if triggered)

**Supported Languages**:
- English (default)
- Polish (Polski)

**What Translates**:
- Navigation: Dashboard, Projects, Rules, Settings
- Common: Actions, pagination, validation messages
- Errors: 404 text, error alerts
- Placeholders: "To be implemented in Phase X"

### 3. Sidebar Collapse

**How to Test**:
1. Click hamburger icon (☰) in sidebar header
2. Sidebar collapses to icons-only mode (64px)
3. Click again to expand back to full width (240px)
4. State saved to localStorage

**Behavior**:
- Collapsed: Only icons visible
- Expanded: Icons + text labels
- Hover tooltips when collapsed
- Smooth CSS transition

### 4. Route Navigation

**How to Test**:
1. Click any menu item in sidebar
2. URL changes (e.g., `/` → `/projects`)
3. Breadcrumb updates automatically
4. Active menu item highlighted in green
5. Main content updates to new view

**Routes Available**:
- `/` - Dashboard
- `/projects` - Project list
- `/projects/new` - Create project
- `/projects/:projectId` - Project detail
- `/projects/:projectId/runs/new` - Create run
- `/runs/:runId` - Run detail
- `/pages/:pageId` - Page detail
- `/rules` - Rules list
- `/rules/new` - Create rule
- `/settings` - Settings
- `/*` - 404 Not Found

### 5. Browser Back/Forward

**How to Test**:
1. Navigate through several views
2. Click browser back button
3. Returns to previous view correctly
4. Click forward button
5. Moves forward in history

**What Works**:
- Full browser history support
- Breadcrumb updates on back/forward
- Active menu item updates
- No page refresh (SPA behavior)

---

## Technical Implementation Details

### Technology Stack

| Component | Technology | Version | Status |
|-----------|------------|---------|--------|
| Framework | Vue 3 | 3.5.x | ✅ Configured |
| Build Tool | Vite | 6.x beta | ✅ Working |
| UI Library | Naive UI | 2.43.x | ✅ Integrated |
| Router | Vue Router | 4.6.x | ✅ 11 routes |
| State | Pinia | 3.0.x | ✅ 7 stores |
| i18n | vue-i18n | 11.2.x | ✅ EN + PL |
| HTTP Client | ofetch | 1.5.x | ✅ Configured |
| Icons | @vicons/tabler | Latest | ✅ Working |
| Language | TypeScript | 5.9.x | ✅ Strict mode |

### File Structure

```
packages/frontend/
├── src/
│   ├── main.ts                      # ✅ App entry point
│   ├── App.vue                      # ✅ Root component with providers
│   ├── router/
│   │   └── index.ts                 # ✅ 11 routes configured
│   ├── stores/                      # ✅ 7 Pinia stores
│   │   ├── ui.ts                    # Theme, language, sidebar state
│   │   ├── projects.ts              # Project CRUD
│   │   ├── runs.ts                  # Run management + polling
│   │   ├── pages.ts                 # Page state
│   │   ├── diffs.ts                 # Diff actions
│   │   ├── rules.ts                 # Mute rules
│   │   └── tasks.ts                 # Task queue polling
│   ├── services/api/                # ✅ API client layer
│   │   ├── client.ts                # ofetch with retry logic
│   │   ├── projects.ts              # Project endpoints
│   │   ├── runs.ts                  # Run endpoints
│   │   ├── pages.ts                 # Page endpoints
│   │   ├── artifacts.ts             # Artifact endpoints
│   │   └── tasks.ts                 # Task polling
│   ├── i18n/                        # ✅ Internationalization
│   │   ├── index.ts                 # i18n config
│   │   └── locales/
│   │       ├── en.json              # English (300+ keys)
│   │       └── pl.json              # Polish (300+ keys)
│   ├── components/
│   │   ├── layouts/                 # ✅ Layout components
│   │   │   ├── DefaultLayout.vue    # Main app layout
│   │   │   ├── AppHeader.vue        # Top bar with switches
│   │   │   ├── AppSidebar.vue       # Left sidebar menu
│   │   │   └── AppBreadcrumb.vue    # Breadcrumb nav
│   │   └── common/                  # ✅ Common components
│   │       ├── LoadingSpinner.vue   # Loading indicator
│   │       ├── ErrorAlert.vue       # Error message display
│   │       ├── EmptyState.vue       # Empty list placeholder
│   │       ├── ConfirmDialog.vue    # Confirmation modal
│   │       └── Pagination.vue       # Pagination controls
│   ├── components/
│   │   ├── ProjectForm.vue          # ✅ Multi-step wizard (Phase 2)
│   │   ├── ProjectCard.vue          # ✅ Reusable card (Phase 2)
│   │   ├── ProjectStatusBadge.vue   # ✅ Status badge (Phase 2)
│   │   └── ProjectStatistics.vue    # ✅ Stats grid (Phase 2)
│   └── views/                       # Phase 2 Complete ✅
│       ├── DashboardView.vue        # ✅ Phase 2
│       ├── ProjectListView.vue      # ✅ Phase 2
│       ├── ProjectCreateView.vue    # ✅ Phase 2
│       ├── ProjectDetailView.vue    # ✅ Phase 2
│       ├── RunCreateView.vue        # ⏳ Phase 3
│       ├── RunDetailView.vue        # ⏳ Phase 3
│       ├── PageDetailView.vue       # ⏳ Phase 4
│       ├── RulesListView.vue        # ⏳ Phase 5
│       ├── RuleCreateView.vue       # ⏳ Phase 5
│       ├── SettingsView.vue         # ⏳ Phase 5
│       └── NotFoundView.vue         # ✅ Complete
└── tests/unit/                      # ✅ 167 tests passing
    ├── setup.spec.ts                # Setup verification
    ├── App.spec.ts                  # Root component
    ├── router/
    │   └── router.spec.ts           # Route configuration (10 tests)
    ├── stores/
    │   ├── ui.spec.ts               # UI store (6 tests)
    │   └── projects.spec.ts         # Projects store (5 tests)
    ├── services/api/
    │   ├── client.spec.ts           # API client (12 tests)
    │   └── projects.spec.ts         # Projects API (5 tests)
    ├── i18n/
    │   └── i18n.spec.ts             # i18n system (13 tests)
    └── components/
        ├── common/
        │   ├── ErrorAlert.spec.ts   # Error alert (4 tests)
        │   └── LoadingSpinner.spec.ts # Spinner (3 tests)
        └── layouts/
            └── DefaultLayout.spec.ts # Layout (2 tests)
```

### Pinia Stores (State Management)

All stores implemented and ready for views:

**1. UI Store** (`stores/ui.ts`) ✅
- Current theme (light/dark/auto)
- Current language (en/pl)
- Sidebar collapsed state
- Theme persistence
- Auto theme detection

**2. Projects Store** (`stores/projects.ts`) ✅
- Project list with pagination
- Current project details
- Create/update/delete actions
- Loading and error states
- API integration ready

**3. Runs Store** (`stores/runs.ts`) ✅
- Run list with filtering
- Current run details
- Create run action
- Status polling (start/stop)
- Page list for run

**4. Pages Store** (`stores/pages.ts`) ✅
- Page details
- Page diff retrieval
- Latest snapshot data
- Artifact URLs

**5. Diffs Store** (`stores/diffs.ts`) ✅
- Diff filtering
- Accept/mute actions
- Diff type filtering
- Status management

**6. Rules Store** (`stores/rules.ts`) ✅
- Mute rules CRUD
- Rule filtering
- Apply rules logic
- Global/project scope

**7. Tasks Store** (`stores/tasks.ts`) ✅
- Task status polling
- Progress tracking
- Task queue management
- Auto-refresh logic

### API Client Layer

Complete typed API layer ready for use:

**Client Configuration** (`services/api/client.ts`) ✅
- Base ofetch client with retry logic
- Exponential backoff on rate limits
- Custom error classes (ApiError, RateLimitError)
- Request/response interceptors

**Endpoints Implemented**:
- ✅ Projects API (`projects.ts`) - createScan, listProjects, getProject
- ✅ Runs API (`runs.ts`) - createRun, listRuns, getRun, listRunPages
- ✅ Pages API (`pages.ts`) - getPage, getPageDiff
- ✅ Artifacts API (`artifacts.ts`) - getArtifactUrl, getScreenshot, getDiffImage, getHarFile, getHtml
- ✅ Tasks API (`tasks.ts`) - getTask, pollTask (with auto-polling)

All requests use shared TypeScript types from `@gander-tools/diff-voyager-shared`.

---

## Test Coverage

**Total Tests**: 167 passing ✅

**Phase 1 Tests** (63):
- Setup verification: 2 tests
- Router configuration: 10 tests
- UI store: 6 tests
- Projects store (old): 5 tests
- API client (with retry logic): 12 tests
- Projects API: 5 tests
- i18n system: 13 tests
- ErrorAlert component: 4 tests
- LoadingSpinner component: 3 tests
- DefaultLayout component: 2 tests
- App component: 1 test

**Phase 2 Tests** (104):
- Backend DELETE endpoint: 4 tests
- Validation schemas: 32 tests
- ProjectsStore (full CRUD): 17 tests
- DashboardView: 8 tests
- ProjectListView: 6 tests
- ProjectForm: 6 tests
- ProjectCreateView: 5 tests
- ProjectStatusBadge: 8 tests
- ProjectStatistics: 7 tests
- ProjectCard: 10 tests
- ProjectDetailView: 10 tests

**Testing Tools**:
- Vitest for unit tests
- Vue Test Utils for component testing
- MSW (Mock Service Worker) for API mocking
- jsdom for browser environment

**Code Quality**:
- ✅ All Biome lint checks passing
- ✅ All Biome format checks passing
- ✅ TypeScript strict mode enabled
- ✅ No console errors or warnings

---

## What's NOT Working Yet

### Run Management

**Partially implemented (Phase 3)** → [#179](https://github.com/gander-tools/diff-voyager/issues/179):
- ✅ Run list view → [#185](https://github.com/gander-tools/diff-voyager/issues/185)
- ✅ Run creation form → [#186](https://github.com/gander-tools/diff-voyager/issues/186)
- ✅ RunCard component → [#188](https://github.com/gander-tools/diff-voyager/issues/188)
- ✅ RunForm component → [#189](https://github.com/gander-tools/diff-voyager/issues/189)
- ✅ RunStatusBadge component → [#190](https://github.com/gander-tools/diff-voyager/issues/190)
- ⏳ Run detail view with page list → [#187](https://github.com/gander-tools/diff-voyager/issues/187)
- ⏳ RunProgress component → [#191](https://github.com/gander-tools/diff-voyager/issues/191)
- ⏳ RunStatistics component → [#192](https://github.com/gander-tools/diff-voyager/issues/192)

### Diff Visualization

**Not implemented (Phase 4)** → [#180](https://github.com/gander-tools/diff-voyager/issues/180):
- Page detail view → [#193](https://github.com/gander-tools/diff-voyager/issues/193)
- Page components → [#194](https://github.com/gander-tools/diff-voyager/issues/194)-[#196](https://github.com/gander-tools/diff-voyager/issues/196)
- Visual diff viewer → [#200](https://github.com/gander-tools/diff-voyager/issues/200)
- SEO comparison display → [#199](https://github.com/gander-tools/diff-voyager/issues/199)
- Performance metrics charts → [#201](https://github.com/gander-tools/diff-voyager/issues/201)
- Diff summary and actions → [#197](https://github.com/gander-tools/diff-voyager/issues/197), [#202](https://github.com/gander-tools/diff-voyager/issues/202)

### Rules & Settings

**Not implemented (Phase 5)** → [#183](https://github.com/gander-tools/diff-voyager/issues/183):
- Rules list view → [#203](https://github.com/gander-tools/diff-voyager/issues/203)
- Rule creation form → [#204](https://github.com/gander-tools/diff-voyager/issues/204)
- Settings management → [#205](https://github.com/gander-tools/diff-voyager/issues/205)
- Rule components → [#206](https://github.com/gander-tools/diff-voyager/issues/206)-[#208](https://github.com/gander-tools/diff-voyager/issues/208)

### Polish & Accessibility

**Not implemented (Phase 6)** → [#184](https://github.com/gander-tools/diff-voyager/issues/184):
- Accessibility improvements → [#209](https://github.com/gander-tools/diff-voyager/issues/209)
- E2E tests → [#210](https://github.com/gander-tools/diff-voyager/issues/210)
- Performance optimizations → [#211](https://github.com/gander-tools/diff-voyager/issues/211)
- Error handling → [#212](https://github.com/gander-tools/diff-voyager/issues/212)
- Loading states → [#213](https://github.com/gander-tools/diff-voyager/issues/213)

---

## Phase 1 Achievements

**What Was Delivered** (PR #108):

**7 Implementation Commits**:
1. `521b76d` - Setup dependencies and configuration
2. `45e0438` - Typed API client with error handling
3. `cded883` - i18n with English and Polish
4. `e1d4a0f` - Pinia stores for state management
5. `0da41a2` - Layout components with responsive design
6. `2133207` - Common UI components
7. `9dc0c7d` - Vue Router with all 11 routes
8. `1a42e95` - Code formatting and linting fixes

**Test Coverage**: 63 tests, all passing with TDD methodology

**Code Quality**:
- Biome linting: 0 errors
- Biome formatting: 0 issues
- TypeScript: Strict mode, 0 errors

**Developer Experience**:
- Hot module reload (HMR) working
- Fast test execution (< 1 second)
- Type-safe API calls
- Autocomplete for i18n keys

---

## Phase 2 Achievements

**What Was Delivered** (PR #122):

**14 Implementation Commits**:
1. Backend DELETE endpoint tests
2. Backend DELETE endpoint API contract
3. Backend DELETE endpoint implementation
4. Zod validation schemas
5. ProjectsStore with full CRUD
6. DashboardView implementation
7. ProjectListView implementation
8. ProjectForm multi-step wizard
9. ProjectCreateView implementation
10. ProjectStatusBadge component
11. ProjectStatistics component
12. ProjectCard component
13. ProjectDetailView implementation
14. Views refactored to use ProjectCard

**Test Coverage**: 62 new tests (167 total), all passing with TDD methodology

**Components Created**:
- 4 new views (Dashboard, ProjectList, ProjectCreate, ProjectDetail)
- 4 new components (ProjectForm, ProjectCard, ProjectStatusBadge, ProjectStatistics)
- 1 validation utility (validators.ts with Zod schemas)

**Features Implemented**:
- Full CRUD for projects (create, read, update, delete)
- Multi-step project creation wizard (3 steps)
- Dashboard with statistics and recent projects
- Project list with pagination (12 per page, 3-column grid)
- Project detail view with comprehensive information
- Delete confirmation with cascade deletion
- Form validation with real-time error messages
- Reusable UI components

**Code Quality**:
- Biome linting: 0 errors, 5 acceptable warnings
- Biome formatting: 100% compliant
- TypeScript: Strict mode, 0 errors
- TDD methodology: All tests written before implementation

---

## Post-Phase 2 Improvements

### vee-validate Integration (PR #124)

**What Changed**: Refactored form validation from manual imperative logic to declarative schema-driven validation using vee-validate + Zod.

**Technical Changes**:
1. Added dependencies:
   - `vee-validate@^4.15.1` - Vue 3 form validation library
   - `@vee-validate/zod@^4.15.1` - Zod schema integration
2. Downgraded `zod` from v4 to v3 for ecosystem compatibility (required by both `@ts-rest/core` and `@vee-validate/zod`)
3. Refactored `ProjectForm.vue`:
   - Replaced manual `errors` ref and `validateStep1()` with `useForm()` hook
   - Used `defineField()` for reactive form fields
   - Leveraged `handleSubmit()` for type-safe submission
4. Updated validation schemas in `validators.ts`:
   - Changed error messages from i18n keys to direct text
   - Ensured compatibility with vee-validate

**Benefits**:
- **Cleaner code**: -21 lines while adding functionality
- **Type safety**: Full TypeScript inference from Zod schemas
- **Better UX**: Built-in validation on blur/change/submit
- **Maintainable**: No manual error state management
- **DRY**: Single source of truth for validation

**Testing**:
- All 167 frontend tests passing
- Updated tests to handle async validation with proper awaits
- See `packages/frontend/src/components/ProjectForm.vue` for complete example

**Documentation**:
- CLAUDE.md updated with vee-validate usage guide
- technology-stack.md updated with Form Validation section
- Example code and best practices documented

**Impact**: This establishes the standard approach for all future forms in the application.

---

## Next Steps (Phase 3)

**Parent Issue**: [#179 - feat(frontend): implement Run Management views](https://github.com/gander-tools/diff-voyager/issues/179)

**Immediate Next Priorities**:

1. **Run List View** → [#185](https://github.com/gander-tools/diff-voyager/issues/185) - Display runs for a project with filtering
2. **Run Create View** → [#186](https://github.com/gander-tools/diff-voyager/issues/186) - Form to create comparison runs
3. **Run Detail View** → [#187](https://github.com/gander-tools/diff-voyager/issues/187) - Show run status, statistics, and page list
4. **Run Components** → [#188](https://github.com/gander-tools/diff-voyager/issues/188)-[#192](https://github.com/gander-tools/diff-voyager/issues/192):
   - RunCard, RunForm, RunStatusBadge, RunProgress, RunStatistics

**Expected Outcomes**:
- Users can create comparison runs
- Users can view run progress in real-time
- Users can see list of pages in a run
- Full run management workflow working

**Milestone**: [#5 - Frontend Phase 3: Run Management](https://github.com/gander-tools/diff-voyager/milestone/5) - Due Mar 31, 2026

---

## Development Commands

### Run Frontend Dev Server
```bash
npm run dev:frontend
```

### Run Tests
```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### Linting & Formatting
```bash
npm run lint          # Check code style
npm run format        # Format code
```

### Type Checking
```bash
npm run type-check    # TypeScript validation
```

### Build for Production
```bash
npm run build         # Production build
npm run preview       # Preview production build
```

---

## Related Documentation

- [Frontend Implementation Plan](frontend-plan.md) - Complete 6-phase plan
- [Implementation Status](../development/implementation-status.md) - Overall project status
- [Getting Started](../guides/getting-started.md) - How to run the app
- [API Overview](../api/overview.md) - Backend API reference

---

## Questions?

**How do I test the UI?**
- Start backend: `npm run dev:backend`
- Start frontend: `npm run dev:frontend`
- Visit: http://localhost:5173

**Can I create projects now?**
- Yes! Full project management is working
- Dashboard, list, create, and detail views complete
- Multi-step wizard with validation
- CRUD operations fully functional

**Can I change the theme/language?**
- Yes! Both are fully working
- Click dropdowns in top-right header
- Changes persist across page refreshes

**When will I be able to create runs?**
- Phase 3 (next)
- Run management views
- Expected: Week 5-6 of frontend development
