# Vue 3 UI Implementation Plan

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Internationalization (i18n)](#4-internationalization-i18n)
5. [State Management (Pinia Stores)](#5-state-management-pinia-stores)
6. [API Integration Layer](#6-api-integration-layer)
7. [Form Validation (Zod)](#7-form-validation-zod)
8. [Routing Architecture](#8-routing-architecture)
9. [Page Specifications](#9-page-specifications)
10. [Shared Components](#10-shared-components)
11. [UI/UX Guidelines](#11-uiux-guidelines)
12. [Implementation Phases](#12-implementation-phases)

---

## 1. Overview

This document outlines the implementation plan for the Diff Voyager Vue 3 frontend application. The interface enables solo developers to manage website comparison projects, review visual/SEO/performance differences, and track migration progress.

### Key Principles

- **SPA Architecture**: Single Page Application with Vue Router
- **Reactive Data Flow**: All data managed through Pinia stores
- **API-First**: All backend communication via centralized API layer
- **Internationalization**: All UI strings loaded from translation files (vue-i18n)
- **Type Safety**: Zod schemas for form validation, TypeScript throughout
- **Component Library**: Naive UI Admin for consistent design system

---

## 2. Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | Vue.js | 3.x | Core UI framework |
| State Management | Pinia | 2.x | Centralized reactive state |
| Routing | Vue Router | 4.x | SPA navigation |
| UI Components | Naive UI | 2.x | Component library (Admin theme) |
| Internationalization | vue-i18n | 9.x | Translation management |
| Form Validation | Zod | 3.x | Schema-based validation |
| HTTP Client | ofetch / ky | latest | API requests |
| Build Tool | Vite (bun) | 5.x | Development & build |
| Language | TypeScript | 5.x | Type safety |

### Package Dependencies

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "pinia": "^2.2.0",
    "naive-ui": "^2.38.0",
    "vue-i18n": "^9.14.0",
    "zod": "^3.23.0",
    "@vueuse/core": "^10.9.0",
    "ofetch": "^1.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "@vitejs/plugin-vue": "^5.0.0"
  }
}
```

---

## 3. Project Structure

```
packages/frontend/src/
├── main.ts                     # Application entry point
├── App.vue                     # Root component
├── api/                        # API layer
│   ├── client.ts              # HTTP client configuration
│   ├── endpoints.ts           # API endpoint definitions
│   └── types.ts               # API request/response types
├── components/                 # Reusable components
│   ├── common/                # Generic components
│   │   ├── AppHeader.vue
│   │   ├── AppSidebar.vue
│   │   ├── AppBreadcrumb.vue
│   │   ├── LoadingSpinner.vue
│   │   ├── ErrorAlert.vue
│   │   ├── EmptyState.vue
│   │   ├── ConfirmDialog.vue
│   │   └── Pagination.vue
│   ├── project/               # Project-related components
│   │   ├── ProjectCard.vue
│   │   ├── ProjectForm.vue
│   │   ├── ProjectStatusBadge.vue
│   │   └── ProjectStatistics.vue
│   ├── run/                   # Run-related components
│   │   ├── RunCard.vue
│   │   ├── RunForm.vue
│   │   ├── RunStatusBadge.vue
│   │   ├── RunProgress.vue
│   │   └── RunStatistics.vue
│   ├── page/                  # Page-related components
│   │   ├── PageList.vue
│   │   ├── PageStatusBadge.vue
│   │   └── PageFilters.vue
│   ├── diff/                  # Diff-related components
│   │   ├── DiffSummary.vue
│   │   ├── DiffBadge.vue
│   │   ├── SeoDiffView.vue
│   │   ├── VisualDiffView.vue
│   │   ├── PerformanceDiffView.vue
│   │   └── DiffActions.vue
│   └── rules/                 # Rules-related components
│       ├── RuleForm.vue
│       ├── RuleCard.vue
│       └── RuleConditionBuilder.vue
├── composables/               # Composition API utilities
│   ├── useApi.ts             # API call wrapper
│   ├── useNotification.ts    # Toast notifications
│   ├── usePagination.ts      # Pagination logic
│   └── useConfirm.ts         # Confirmation dialogs
├── i18n/                      # Internationalization
│   ├── index.ts              # i18n configuration
│   └── locales/
│       ├── en.json           # English translations
│       └── [future locales]
├── layouts/                   # Layout components
│   ├── DefaultLayout.vue     # Main app layout
│   └── AuthLayout.vue        # Future: auth layout
├── router/                    # Vue Router configuration
│   ├── index.ts              # Router instance
│   ├── routes.ts             # Route definitions
│   └── guards.ts             # Navigation guards
├── stores/                    # Pinia stores
│   ├── index.ts              # Store exports
│   ├── projects.ts           # Projects store
│   ├── runs.ts               # Runs store
│   ├── pages.ts              # Pages store
│   ├── diffs.ts              # Diffs store
│   ├── rules.ts              # Mute rules store
│   ├── tasks.ts              # Background tasks store
│   └── ui.ts                 # UI state store
├── types/                     # TypeScript types
│   ├── index.ts              # Type exports
│   └── forms.ts              # Form-specific types
├── utils/                     # Utility functions
│   ├── formatters.ts         # Date/number formatters
│   ├── validators.ts         # Zod schemas
│   └── constants.ts          # UI constants
└── views/                     # Page views
    ├── DashboardView.vue
    ├── projects/
    │   ├── ProjectListView.vue
    │   ├── ProjectDetailView.vue
    │   └── ProjectCreateView.vue
    ├── runs/
    │   ├── RunDetailView.vue
    │   └── RunCreateView.vue
    ├── pages/
    │   └── PageDetailView.vue
    ├── rules/
    │   ├── RulesListView.vue
    │   └── RuleCreateView.vue
    ├── settings/
    │   └── SettingsView.vue
    └── NotFoundView.vue
```

---

## 4. Internationalization (i18n)

### Configuration

All user-facing strings MUST be loaded through vue-i18n. No hardcoded text in components.

```typescript
// src/i18n/index.ts
import { createI18n } from 'vue-i18n';
import en from './locales/en.json';

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en }
});
```

### Translation File Structure

```
src/i18n/locales/
└── en.json                    # Primary language file
```

### Translation Key Naming Convention

Keys follow a hierarchical structure: `{domain}.{section}.{element}`

```json
// src/i18n/locales/en.json
{
  "common": {
    "actions": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit",
      "create": "Create",
      "refresh": "Refresh",
      "export": "Export",
      "retry": "Retry",
      "confirm": "Confirm",
      "close": "Close",
      "back": "Back",
      "next": "Next",
      "viewDetails": "View Details"
    },
    "status": {
      "loading": "Loading...",
      "saving": "Saving...",
      "error": "An error occurred",
      "success": "Success",
      "noData": "No data available"
    },
    "labels": {
      "name": "Name",
      "description": "Description",
      "url": "URL",
      "status": "Status",
      "createdAt": "Created",
      "updatedAt": "Updated",
      "actions": "Actions"
    },
    "validation": {
      "required": "This field is required",
      "invalidUrl": "Please enter a valid URL",
      "minLength": "Minimum {min} characters required",
      "maxLength": "Maximum {max} characters allowed"
    },
    "pagination": {
      "showing": "Showing {from} to {to} of {total}",
      "itemsPerPage": "Items per page",
      "page": "Page {current} of {total}"
    },
    "confirmation": {
      "title": "Confirm Action",
      "deleteTitle": "Confirm Deletion",
      "deleteMessage": "Are you sure you want to delete this item? This action cannot be undone."
    }
  },
  "nav": {
    "dashboard": "Dashboard",
    "projects": "Projects",
    "rules": "Mute Rules",
    "settings": "Settings",
    "help": "Help"
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome to Diff Voyager",
    "subtitle": "Website version comparison tool for framework migrations",
    "quickActions": {
      "title": "Quick Actions",
      "newProject": "New Project",
      "viewProjects": "View All Projects"
    },
    "recentProjects": {
      "title": "Recent Projects",
      "empty": "No projects yet. Create your first project to get started."
    },
    "statistics": {
      "title": "Overview",
      "totalProjects": "Total Projects",
      "activeRuns": "Active Runs",
      "totalPages": "Pages Scanned",
      "criticalDiffs": "Critical Differences"
    }
  },
  "projects": {
    "list": {
      "title": "Projects",
      "subtitle": "Manage your website comparison projects",
      "createButton": "New Project",
      "empty": "No projects found",
      "emptyDescription": "Create a project to start comparing website versions"
    },
    "detail": {
      "title": "Project Details",
      "tabs": {
        "overview": "Overview",
        "runs": "Comparison Runs",
        "pages": "Pages",
        "settings": "Settings"
      },
      "overview": {
        "baseUrl": "Base URL",
        "baseline": "Baseline",
        "lastRun": "Last Run",
        "totalPages": "Total Pages"
      },
      "actions": {
        "newRun": "New Comparison Run",
        "exportProject": "Export Project",
        "deleteProject": "Delete Project"
      }
    },
    "create": {
      "title": "Create New Project",
      "subtitle": "Set up a new website comparison project",
      "steps": {
        "basic": "Basic Info",
        "crawl": "Crawl Settings",
        "profile": "Run Profile"
      }
    },
    "form": {
      "name": {
        "label": "Project Name",
        "placeholder": "My Website Migration",
        "hint": "A descriptive name for this project"
      },
      "url": {
        "label": "Website URL",
        "placeholder": "https://example.com",
        "hint": "The base URL of the website to compare"
      },
      "description": {
        "label": "Description",
        "placeholder": "Framework upgrade from Vue 2 to Vue 3",
        "hint": "Optional description of the migration"
      },
      "crawl": {
        "label": "Enable Crawling",
        "hint": "Automatically discover pages by following links"
      },
      "viewport": {
        "label": "Viewport Size",
        "width": "Width",
        "height": "Height",
        "presets": {
          "desktop": "Desktop (1920x1080)",
          "laptop": "Laptop (1366x768)",
          "tablet": "Tablet (768x1024)",
          "custom": "Custom"
        }
      },
      "collectHar": {
        "label": "Collect HAR Files",
        "hint": "Record network activity for performance analysis"
      },
      "maxPages": {
        "label": "Maximum Pages",
        "hint": "Limit the number of pages to crawl (0 = unlimited)"
      },
      "visualThreshold": {
        "label": "Visual Diff Threshold",
        "hint": "Percentage of pixel difference to flag as changed (0.01 = 1%)"
      }
    },
    "status": {
      "new": "New",
      "inProgress": "In Progress",
      "completed": "Completed",
      "interrupted": "Interrupted"
    }
  },
  "runs": {
    "list": {
      "title": "Comparison Runs",
      "empty": "No runs yet",
      "emptyDescription": "Start a comparison run to analyze differences",
      "baseline": "Baseline",
      "comparison": "Comparison #{number}"
    },
    "detail": {
      "title": "Run Details",
      "tabs": {
        "summary": "Summary",
        "pages": "Pages",
        "diffs": "Differences"
      },
      "summary": {
        "status": "Status",
        "duration": "Duration",
        "pagesProcessed": "Pages Processed",
        "pagesWithChanges": "Pages with Changes",
        "criticalChanges": "Critical Changes"
      },
      "filters": {
        "all": "All Pages",
        "changed": "Changed",
        "unchanged": "Unchanged",
        "errors": "Errors"
      }
    },
    "create": {
      "title": "New Comparison Run",
      "subtitle": "Run a comparison against the baseline",
      "startButton": "Start Comparison"
    },
    "status": {
      "pending": "Pending",
      "processing": "Processing",
      "completed": "Completed",
      "failed": "Failed"
    },
    "progress": {
      "scanning": "Scanning pages...",
      "comparing": "Comparing against baseline...",
      "generating": "Generating diff reports..."
    }
  },
  "pages": {
    "list": {
      "title": "Pages",
      "columns": {
        "url": "URL",
        "status": "Status",
        "httpStatus": "HTTP",
        "changes": "Changes"
      }
    },
    "detail": {
      "title": "Page Details",
      "tabs": {
        "seo": "SEO & Content",
        "visual": "Visual Diff",
        "performance": "Performance",
        "headers": "HTTP Headers"
      },
      "artifacts": {
        "screenshot": "View Screenshot",
        "html": "View HTML",
        "har": "Download HAR"
      }
    },
    "status": {
      "pending": "Pending",
      "inProgress": "In Progress",
      "completed": "Completed",
      "partial": "Partial",
      "error": "Error"
    }
  },
  "diffs": {
    "summary": {
      "title": "Difference Summary",
      "totalChanges": "Total Changes",
      "byType": "By Type",
      "bySeverity": "By Severity"
    },
    "types": {
      "seo": "SEO",
      "visual": "Visual",
      "content": "Content",
      "performance": "Performance",
      "httpStatus": "HTTP Status",
      "headers": "Headers"
    },
    "severity": {
      "critical": "Critical",
      "warning": "Warning",
      "info": "Info"
    },
    "status": {
      "new": "New",
      "accepted": "Accepted",
      "muted": "Muted"
    },
    "actions": {
      "accept": "Accept",
      "mute": "Mute",
      "createRule": "Create Mute Rule",
      "showMuted": "Show Muted",
      "hideMuted": "Hide Muted"
    },
    "seo": {
      "title": "SEO Changes",
      "fields": {
        "title": "Page Title",
        "metaDescription": "Meta Description",
        "canonical": "Canonical URL",
        "robots": "Robots",
        "h1": "H1 Heading",
        "h2": "H2 Headings",
        "lang": "Language"
      },
      "baseline": "Baseline",
      "current": "Current"
    },
    "visual": {
      "title": "Visual Comparison",
      "pixelDiff": "{count} pixels different ({percentage}%)",
      "thresholdExceeded": "Threshold exceeded",
      "withinThreshold": "Within threshold",
      "viewMode": {
        "sideBySide": "Side by Side",
        "overlay": "Overlay",
        "diff": "Diff Only",
        "slider": "Slider"
      },
      "labels": {
        "baseline": "Baseline",
        "current": "Current",
        "diff": "Difference"
      }
    },
    "performance": {
      "title": "Performance Changes",
      "metrics": {
        "loadTime": "Load Time",
        "requestCount": "Request Count",
        "totalSize": "Total Size"
      },
      "change": "{direction} {percentage}%",
      "improved": "Improved",
      "degraded": "Degraded"
    }
  },
  "rules": {
    "list": {
      "title": "Mute Rules",
      "subtitle": "Manage rules for ignoring specific differences",
      "createButton": "New Rule",
      "empty": "No mute rules defined",
      "emptyDescription": "Create rules to automatically mute known differences"
    },
    "detail": {
      "title": "Rule Details",
      "conditions": "Conditions",
      "scope": "Scope",
      "active": "Active"
    },
    "create": {
      "title": "Create Mute Rule",
      "subtitle": "Define conditions for muting differences"
    },
    "form": {
      "name": {
        "label": "Rule Name",
        "placeholder": "Ignore dynamic timestamps"
      },
      "description": {
        "label": "Description",
        "placeholder": "Mutes timestamp differences in footer"
      },
      "scope": {
        "label": "Scope",
        "global": "Global (all projects)",
        "project": "This project only"
      },
      "active": {
        "label": "Active",
        "hint": "Inactive rules are not applied"
      },
      "conditions": {
        "title": "Conditions",
        "add": "Add Condition",
        "diffType": "Difference Type",
        "cssSelector": "CSS Selector",
        "xpathSelector": "XPath Selector",
        "fieldPattern": "Field Pattern",
        "headerName": "Header Name",
        "valuePattern": "Value Pattern"
      }
    },
    "scope": {
      "global": "Global",
      "project": "Project"
    }
  },
  "settings": {
    "title": "Settings",
    "sections": {
      "general": "General",
      "defaults": "Default Values",
      "appearance": "Appearance"
    },
    "general": {
      "language": {
        "label": "Language",
        "hint": "Interface language"
      },
      "dataDirectory": {
        "label": "Data Directory",
        "hint": "Where project data is stored"
      }
    },
    "defaults": {
      "viewport": {
        "label": "Default Viewport",
        "hint": "Default screenshot dimensions"
      },
      "visualThreshold": {
        "label": "Visual Diff Threshold",
        "hint": "Default threshold for visual differences"
      },
      "maxPages": {
        "label": "Maximum Pages",
        "hint": "Default crawl limit"
      }
    },
    "appearance": {
      "theme": {
        "label": "Theme",
        "light": "Light",
        "dark": "Dark",
        "system": "System"
      },
      "compactMode": {
        "label": "Compact Mode",
        "hint": "Reduce spacing and padding"
      }
    }
  },
  "errors": {
    "generic": "Something went wrong. Please try again.",
    "network": "Network error. Please check your connection.",
    "notFound": "The requested resource was not found.",
    "validation": "Please check your input and try again.",
    "api": {
      "projectNotFound": "Project not found",
      "runNotFound": "Run not found",
      "pageNotFound": "Page not found",
      "artifactNotFound": "Artifact not found"
    }
  },
  "notifications": {
    "projectCreated": "Project created successfully",
    "projectDeleted": "Project deleted",
    "runStarted": "Comparison run started",
    "runCompleted": "Comparison run completed",
    "ruleCreated": "Mute rule created",
    "ruleDeleted": "Mute rule deleted",
    "diffAccepted": "Difference accepted",
    "diffMuted": "Difference muted",
    "exportStarted": "Export started",
    "exportCompleted": "Export completed"
  }
}
```

### Usage in Components

```vue
<template>
  <n-button type="primary">{{ t('common.actions.save') }}</n-button>
  <p>{{ t('projects.form.name.hint') }}</p>
  <span>{{ t('common.pagination.showing', { from: 1, to: 10, total: 100 }) }}</span>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>
```

---

## 5. State Management (Pinia Stores)

All application data flows through Pinia stores. Components NEVER call API directly.

### Store Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Vue Components                        │
│    (read state via computed, trigger actions via methods)    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Pinia Stores                          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│  │ projects  │ │   runs    │ │   pages   │ │   diffs   │   │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘   │
│        │             │             │             │          │
│  ┌─────┴─────┐ ┌─────┴─────┐                               │
│  │   rules   │ │    ui     │                               │
│  └───────────┘ └───────────┘                               │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                             │
│                   (ofetch HTTP client)                       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend API                              │
│                  (localhost:3000)                            │
└─────────────────────────────────────────────────────────────┘
```

### Store Definitions

#### Projects Store

```typescript
// src/stores/projects.ts
interface ProjectsState {
  items: Map<string, Project>;
  list: string[];  // IDs for ordered list
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  currentId: string | null;
}

// Actions
- fetchProjects(params?: { limit, offset }): Promise<void>
- fetchProjectById(id: string): Promise<void>
- createProject(data: CreateProjectInput): Promise<Project>
- deleteProject(id: string): Promise<void>
- updateProjectStatus(id: string, status: RunStatus): void

// Getters
- projectList: Project[]
- currentProject: Project | null
- getById(id: string): Project | undefined
- isLoading: boolean
- hasError: boolean
```

#### Runs Store

```typescript
// src/stores/runs.ts
interface RunsState {
  items: Map<string, Run>;
  byProject: Map<string, string[]>;  // projectId -> runIds
  pagination: Map<string, PaginationState>;
  loading: boolean;
  error: string | null;
  currentId: string | null;
}

// Actions
- fetchRunsByProject(projectId: string, params?: PaginationParams): Promise<void>
- fetchRunById(id: string): Promise<void>
- createRun(projectId: string, data: CreateRunInput): Promise<Run>
- pollRunStatus(id: string): Promise<void>

// Getters
- getRunsByProject(projectId: string): Run[]
- currentRun: Run | null
- getById(id: string): Run | undefined
- baselineRun(projectId: string): Run | undefined
```

#### Pages Store

```typescript
// src/stores/pages.ts
interface PagesState {
  items: Map<string, Page>;
  byRun: Map<string, string[]>;  // runId -> pageIds
  byProject: Map<string, string[]>;  // projectId -> pageIds
  pagination: Map<string, PaginationState>;
  filters: PageFilters;
  loading: boolean;
  error: string | null;
  currentId: string | null;
}

// Actions
- fetchPagesByProject(projectId: string, params?: PaginationParams): Promise<void>
- fetchPagesByRun(runId: string, params?: PaginationParams): Promise<void>
- fetchPageById(id: string): Promise<void>
- setFilters(filters: Partial<PageFilters>): void
- retryPage(id: string): Promise<void>

// Getters
- getPagesByProject(projectId: string): Page[]
- getPagesByRun(runId: string): Page[]
- currentPage: Page | null
- filteredPages(runId: string): Page[]
```

#### Diffs Store

```typescript
// src/stores/diffs.ts
interface DiffsState {
  items: Map<string, Diff>;
  byPage: Map<string, string>;  // pageId -> diffId
  loading: boolean;
  error: string | null;
  showMuted: boolean;
}

// Actions
- fetchDiffByPage(pageId: string): Promise<void>
- acceptDiff(diffId: string, changeId: string): Promise<void>
- muteDiff(diffId: string, changeId: string): Promise<void>
- toggleShowMuted(): void

// Getters
- getDiffByPage(pageId: string): Diff | undefined
- visibleChanges(diffId: string): Change[]
- changesByType(diffId: string): Record<DiffType, Change[]>
- changeBySeverity(diffId: string): Record<DiffSeverity, Change[]>
```

#### Rules Store

```typescript
// src/stores/rules.ts
interface RulesState {
  items: Map<string, MuteRule>;
  list: string[];
  byProject: Map<string, string[]>;
  loading: boolean;
  error: string | null;
}

// Actions
- fetchRules(projectId?: string): Promise<void>
- fetchRuleById(id: string): Promise<void>
- createRule(data: CreateRuleInput): Promise<MuteRule>
- updateRule(id: string, data: UpdateRuleInput): Promise<void>
- deleteRule(id: string): Promise<void>
- toggleRuleActive(id: string): Promise<void>

// Getters
- globalRules: MuteRule[]
- getRulesByProject(projectId: string): MuteRule[]
- activeRules: MuteRule[]
```

#### UI Store

```typescript
// src/stores/ui.ts
interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  locale: string;
  notifications: Notification[];
}

// Actions
- toggleSidebar(): void
- setTheme(theme: 'light' | 'dark' | 'system'): void
- setCompactMode(value: boolean): void
- setLocale(locale: string): void
- addNotification(notification: Notification): void
- removeNotification(id: string): void

// Getters
- effectiveTheme: 'light' | 'dark'
- hasNotifications: boolean
```

#### Tasks Store

```typescript
// src/stores/tasks.ts
interface TasksState {
  items: Map<string, Task>;
  activePolling: Set<string>;
  loading: boolean;
  error: string | null;
}

// Actions
- fetchTask(id: string): Promise<void>
- startPolling(id: string): void
- stopPolling(id: string): void

// Getters
- getTask(id: string): Task | undefined
- isTaskComplete(id: string): boolean
- pendingTasks: Task[]
```

---

## 6. API Integration Layer

### HTTP Client Configuration

```typescript
// src/api/client.ts
import { ofetch } from 'ofetch';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export const apiClient = ofetch.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: {
    'Content-Type': 'application/json'
  },
  retry: 1,
  retryDelay: 500,
  onRequestError({ error }) {
    // Handle request errors
    console.error('API Request Error:', error);
  },
  onResponseError({ response }) {
    // Handle response errors
    const status = response.status;
    if (status === 404) {
      throw new NotFoundError(response._data?.message);
    }
    if (status >= 500) {
      throw new ServerError(response._data?.message);
    }
  }
});
```

### API Endpoints

```typescript
// src/api/endpoints.ts
export const api = {
  // Projects
  projects: {
    list: (params?: PaginationParams) =>
      apiClient('/projects', { params }),
    get: (id: string, params?: { includePages?: boolean }) =>
      apiClient(`/projects/${id}`, { params }),
    getRuns: (id: string, params?: PaginationParams) =>
      apiClient(`/projects/${id}/runs`, { params }),
    createRun: (id: string, data: CreateRunInput) =>
      apiClient(`/projects/${id}/runs`, { method: 'POST', body: data })
  },

  // Scans (create project)
  scans: {
    create: (data: CreateScanInput) =>
      apiClient('/scans', { method: 'POST', body: data })
  },

  // Runs
  runs: {
    get: (id: string) =>
      apiClient(`/runs/${id}`),
    getPages: (id: string, params?: PaginationParams) =>
      apiClient(`/runs/${id}/pages`, { params })
  },

  // Pages
  pages: {
    get: (id: string) =>
      apiClient(`/pages/${id}`),
    getDiff: (id: string) =>
      apiClient(`/pages/${id}/diff`)
  },

  // Artifacts (returns URLs, not data)
  artifacts: {
    screenshotUrl: (pageId: string) =>
      `${API_BASE}/api/v1/artifacts/${pageId}/screenshot`,
    baselineScreenshotUrl: (pageId: string) =>
      `${API_BASE}/api/v1/artifacts/${pageId}/baseline-screenshot`,
    diffUrl: (pageId: string) =>
      `${API_BASE}/api/v1/artifacts/${pageId}/diff`,
    harUrl: (pageId: string) =>
      `${API_BASE}/api/v1/artifacts/${pageId}/har`,
    htmlUrl: (pageId: string) =>
      `${API_BASE}/api/v1/artifacts/${pageId}/html`
  },

  // Tasks
  tasks: {
    get: (id: string) =>
      apiClient(`/tasks/${id}`)
  },

  // Health
  health: () =>
    apiClient('/health', { baseURL: API_BASE })
};
```

### API Response Types

```typescript
// src/api/types.ts
// Re-export from @diff-voyager/shared
export type {
  ProjectDetailsResponse,
  ProjectSummaryResponse,
  RunResponse,
  PageResponse,
  DiffResponse,
  PaginationResponse
} from '@diff-voyager/shared';

// Additional frontend-specific types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}
```

---

## 7. Form Validation (Zod)

### Validation Schemas

```typescript
// src/utils/validators.ts
import { z } from 'zod';

// Common schemas
export const urlSchema = z
  .string()
  .url({ message: 'validation.invalidUrl' })
  .refine(url => url.startsWith('http'), {
    message: 'validation.urlMustBeHttp'
  });

export const viewportSchema = z.object({
  width: z.number().min(320).max(3840),
  height: z.number().min(240).max(2160)
});

// Project form schema
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'validation.required')
    .max(100, 'validation.maxLength'),
  url: urlSchema,
  description: z.string().max(500).optional(),
  crawl: z.boolean().default(false),
  viewport: viewportSchema.default({ width: 1920, height: 1080 }),
  collectHar: z.boolean().default(false),
  waitAfterLoad: z.number().min(0).max(30000).default(1000),
  visualDiffThreshold: z.number().min(0).max(1).default(0.01),
  maxPages: z.number().min(0).max(10000).optional()
});

// Run form schema
export const createRunSchema = z.object({
  url: urlSchema,
  viewport: viewportSchema.optional(),
  collectHar: z.boolean().default(false),
  waitAfterLoad: z.number().min(0).max(30000).optional()
});

// Mute rule form schema
export const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  scope: z.enum(['global', 'project']),
  projectId: z.string().uuid().optional(),
  active: z.boolean().default(true),
  conditions: z.array(z.object({
    diffType: z.enum(['seo', 'visual', 'content', 'performance', 'http_status', 'headers']),
    cssSelector: z.string().optional(),
    xpathSelector: z.string().optional(),
    fieldPattern: z.string().optional(),
    headerName: z.string().optional(),
    valuePattern: z.string().optional()
  })).min(1)
});

// Type exports
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateRunInput = z.infer<typeof createRunSchema>;
export type CreateRuleInput = z.infer<typeof createRuleSchema>;
```

### Validation Composable

```typescript
// src/composables/useValidation.ts
import { ref, computed } from 'vue';
import type { ZodSchema, ZodError } from 'zod';
import { useI18n } from 'vue-i18n';

export function useValidation<T>(schema: ZodSchema<T>) {
  const { t } = useI18n();
  const errors = ref<Record<string, string>>({});
  const isValid = computed(() => Object.keys(errors.value).length === 0);

  function validate(data: unknown): data is T {
    try {
      schema.parse(data);
      errors.value = {};
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        errors.value = error.issues.reduce((acc, issue) => {
          const path = issue.path.join('.');
          acc[path] = t(issue.message, issue);
          return acc;
        }, {} as Record<string, string>);
      }
      return false;
    }
  }

  function getError(field: string): string | undefined {
    return errors.value[field];
  }

  function clearErrors() {
    errors.value = {};
  }

  return {
    errors,
    isValid,
    validate,
    getError,
    clearErrors
  };
}
```

### Integration with Naive UI Forms

```vue
<template>
  <n-form ref="formRef" :model="formData" :rules="formRules">
    <n-form-item :label="t('projects.form.name.label')" path="name">
      <n-input v-model:value="formData.name" :placeholder="t('projects.form.name.placeholder')" />
    </n-form-item>
    <!-- More form items -->
    <n-button type="primary" @click="handleSubmit">
      {{ t('common.actions.save') }}
    </n-button>
  </n-form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { createProjectSchema } from '@/utils/validators';
import { useValidation } from '@/composables/useValidation';

const { t } = useI18n();
const { validate, getError } = useValidation(createProjectSchema);

const formData = ref({
  name: '',
  url: '',
  // ...
});

// Convert Zod schema to Naive UI rules
const formRules = {
  name: {
    required: true,
    trigger: 'blur',
    validator: (rule, value) => {
      if (!value) return new Error(t('common.validation.required'));
      return true;
    }
  },
  url: {
    required: true,
    trigger: 'blur',
    validator: (rule, value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return new Error(t('common.validation.invalidUrl'));
      }
    }
  }
};

async function handleSubmit() {
  if (validate(formData.value)) {
    // Submit form
  }
}
</script>
```

---

## 8. Routing Architecture

### Route Configuration

```typescript
// src/router/routes.ts
import type { RouteRecordRaw } from 'vue-router';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: {
          title: 'nav.dashboard',
          breadcrumb: [{ label: 'nav.dashboard' }]
        }
      },

      // Projects
      {
        path: 'projects',
        name: 'projects',
        component: () => import('@/views/projects/ProjectListView.vue'),
        meta: {
          title: 'projects.list.title',
          breadcrumb: [
            { label: 'nav.dashboard', to: '/' },
            { label: 'nav.projects' }
          ]
        }
      },
      {
        path: 'projects/new',
        name: 'project-create',
        component: () => import('@/views/projects/ProjectCreateView.vue'),
        meta: {
          title: 'projects.create.title',
          breadcrumb: [
            { label: 'nav.dashboard', to: '/' },
            { label: 'nav.projects', to: '/projects' },
            { label: 'projects.create.title' }
          ]
        }
      },
      {
        path: 'projects/:projectId',
        name: 'project-detail',
        component: () => import('@/views/projects/ProjectDetailView.vue'),
        props: true,
        meta: {
          title: 'projects.detail.title',
          breadcrumb: [
            { label: 'nav.dashboard', to: '/' },
            { label: 'nav.projects', to: '/projects' },
            { label: 'projects.detail.title', dynamic: true }
          ]
        }
      },

      // Runs
      {
        path: 'projects/:projectId/runs/new',
        name: 'run-create',
        component: () => import('@/views/runs/RunCreateView.vue'),
        props: true,
        meta: {
          title: 'runs.create.title',
          breadcrumb: [
            { label: 'nav.dashboard', to: '/' },
            { label: 'nav.projects', to: '/projects' },
            { label: 'projects.detail.title', dynamic: true, toParam: 'projectId' },
            { label: 'runs.create.title' }
          ]
        }
      },
      {
        path: 'runs/:runId',
        name: 'run-detail',
        component: () => import('@/views/runs/RunDetailView.vue'),
        props: true,
        meta: {
          title: 'runs.detail.title',
          breadcrumb: [
            { label: 'nav.dashboard', to: '/' },
            { label: 'nav.projects', to: '/projects' },
            { label: 'projects.detail.title', dynamic: true },
            { label: 'runs.detail.title', dynamic: true }
          ]
        }
      },

      // Pages
      {
        path: 'pages/:pageId',
        name: 'page-detail',
        component: () => import('@/views/pages/PageDetailView.vue'),
        props: true,
        meta: {
          title: 'pages.detail.title',
          breadcrumb: [
            { label: 'nav.dashboard', to: '/' },
            { label: 'pages.detail.title', dynamic: true }
          ]
        }
      },

      // Rules
      {
        path: 'rules',
        name: 'rules',
        component: () => import('@/views/rules/RulesListView.vue'),
        meta: {
          title: 'rules.list.title',
          breadcrumb: [
            { label: 'nav.dashboard', to: '/' },
            { label: 'nav.rules' }
          ]
        }
      },
      {
        path: 'rules/new',
        name: 'rule-create',
        component: () => import('@/views/rules/RuleCreateView.vue'),
        meta: {
          title: 'rules.create.title',
          breadcrumb: [
            { label: 'nav.dashboard', to: '/' },
            { label: 'nav.rules', to: '/rules' },
            { label: 'rules.create.title' }
          ]
        }
      },

      // Settings
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/settings/SettingsView.vue'),
        meta: {
          title: 'settings.title',
          breadcrumb: [
            { label: 'nav.dashboard', to: '/' },
            { label: 'nav.settings' }
          ]
        }
      }
    ]
  },

  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue')
  }
];
```

### Router Instance

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { routes } from './routes';
import { useUIStore } from '@/stores/ui';
import { i18n } from '@/i18n';

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  }
});

// Update document title on navigation
router.afterEach((to) => {
  const title = to.meta.title as string | undefined;
  if (title) {
    document.title = `${i18n.global.t(title)} - Diff Voyager`;
  }
});
```

### Route Map Diagram

```
/                                    → DashboardView
├── /projects                        → ProjectListView
│   ├── /projects/new               → ProjectCreateView
│   └── /projects/:projectId        → ProjectDetailView
│       └── /projects/:projectId/runs/new → RunCreateView
├── /runs/:runId                    → RunDetailView
├── /pages/:pageId                  → PageDetailView
├── /rules                          → RulesListView
│   └── /rules/new                  → RuleCreateView
├── /settings                       → SettingsView
└── /*                              → NotFoundView
```

---

## 9. Page Specifications

### 9.1 Dashboard View

**Route:** `/`
**Component:** `DashboardView.vue`

#### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ [Header: Diff Voyager]                           [Settings]  │
├──────────────────────────────────────────────────────────────┤
│ [Sidebar]  │                                                 │
│            │  Welcome to Diff Voyager                        │
│ Dashboard  │  Website version comparison tool                │
│ Projects   │                                                 │
│ Rules      │  ┌─────────────┐ ┌─────────────┐               │
│ Settings   │  │ Quick       │ │ Statistics  │               │
│            │  │ Actions     │ │ Overview    │               │
│            │  │             │ │             │               │
│            │  │ [New Proj]  │ │ Projects: 5 │               │
│            │  │ [View All]  │ │ Runs: 12    │               │
│            │  └─────────────┘ └─────────────┘               │
│            │                                                 │
│            │  Recent Projects                                │
│            │  ┌──────────────────────────────────────────┐  │
│            │  │ Project Card  │ Project Card  │ ...      │  │
│            │  └──────────────────────────────────────────┘  │
└────────────┴─────────────────────────────────────────────────┘
```

#### Data Requirements

| Data | Source | Store | API Endpoint |
|------|--------|-------|--------------|
| Recent projects | API | `projectsStore` | `GET /projects?limit=5` |
| Statistics | API (aggregated) | `projectsStore` | `GET /projects` (count from pagination) |

#### Components Used

- `AppHeader`, `AppSidebar` (layout)
- `ProjectCard` (for recent projects)
- `EmptyState` (when no projects)
- `n-statistic` (Naive UI statistics)
- `n-card`, `n-grid`, `n-button`

#### i18n Keys

- `dashboard.title`, `dashboard.welcome`, `dashboard.subtitle`
- `dashboard.quickActions.*`, `dashboard.recentProjects.*`, `dashboard.statistics.*`

---

### 9.2 Project List View

**Route:** `/projects`
**Component:** `ProjectListView.vue`

#### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Breadcrumb: Dashboard > Projects                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Projects                                    [+ New Project]  │
│ Manage your website comparison projects                      │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Search: [____________]    Sort: [Newest ▼]             │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │  │
│ │ │ ProjectCard │ │ ProjectCard │ │ ProjectCard │       │  │
│ │ │             │ │             │ │             │       │  │
│ │ │ Name        │ │ Name        │ │ Name        │       │  │
│ │ │ URL         │ │ URL         │ │ URL         │       │  │
│ │ │ Status      │ │ Status      │ │ Status      │       │  │
│ │ │ Last run    │ │ Last run    │ │ Last run    │       │  │
│ │ └─────────────┘ └─────────────┘ └─────────────┘       │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ [Pagination: < 1 2 3 ... 10 >]                              │
└──────────────────────────────────────────────────────────────┘
```

#### Data Requirements

| Data | Source | Store | API Endpoint |
|------|--------|-------|--------------|
| Projects list | API | `projectsStore.items` | `GET /projects` |
| Pagination | API | `projectsStore.pagination` | `GET /projects?limit=12&offset=0` |

#### User Actions

| Action | Handler | Store Action | API Call |
|--------|---------|--------------|----------|
| View project | Router navigation | - | - |
| Create project | Router to `/projects/new` | - | - |
| Delete project | Confirm dialog → delete | `projectsStore.deleteProject()` | `DELETE /projects/:id` |
| Search | Filter local | `projectsStore.setFilter()` | - |
| Paginate | Fetch page | `projectsStore.fetchProjects()` | `GET /projects?offset=X` |

#### Components Used

- `AppBreadcrumb`
- `ProjectCard`
- `Pagination`
- `EmptyState`
- `ConfirmDialog`
- `n-input`, `n-select`, `n-button`, `n-grid`

---

### 9.3 Project Create View

**Route:** `/projects/new`
**Component:** `ProjectCreateView.vue`

#### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Breadcrumb: Dashboard > Projects > New Project               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Create New Project                                           │
│ Set up a new website comparison project                      │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Step 1: Basic Info  |  Step 2: Crawl  |  Step 3: Profile│  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │                                                        │  │
│ │ Project Name *                                         │  │
│ │ [________________________________]                     │  │
│ │ A descriptive name for this project                    │  │
│ │                                                        │  │
│ │ Website URL *                                          │  │
│ │ [________________________________]                     │  │
│ │ The base URL of the website to compare                 │  │
│ │                                                        │  │
│ │ Description                                            │  │
│ │ [________________________________]                     │  │
│ │ Optional description of the migration                  │  │
│ │                                                        │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│                               [Cancel]  [Next →]             │
└──────────────────────────────────────────────────────────────┘
```

#### Form Steps

**Step 1: Basic Info**
- Project name (required)
- Website URL (required)
- Description (optional)

**Step 2: Crawl Settings**
- Enable crawling (toggle)
- Maximum pages (number)
- Include patterns (array)
- Exclude patterns (array)

**Step 3: Run Profile**
- Viewport size (preset or custom)
- Collect HAR files (toggle)
- Wait after load (ms)
- Visual diff threshold (slider)

#### Data Requirements

| Data | Source | Store | API Endpoint |
|------|--------|-------|--------------|
| Form submission | Form | - | `POST /scans` |

#### Validation Schema

```typescript
createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  description: z.string().max(500).optional(),
  crawl: z.boolean().default(false),
  viewport: viewportSchema,
  collectHar: z.boolean().default(false),
  waitAfterLoad: z.number().min(0).max(30000).default(1000),
  visualDiffThreshold: z.number().min(0).max(1).default(0.01),
  maxPages: z.number().min(0).optional()
});
```

#### Components Used

- `ProjectForm`
- `n-steps`, `n-form`, `n-form-item`
- `n-input`, `n-input-number`, `n-switch`, `n-slider`
- `n-button`

---

### 9.4 Project Detail View

**Route:** `/projects/:projectId`
**Component:** `ProjectDetailView.vue`

#### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Breadcrumb: Dashboard > Projects > Project Name              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Project: My Website Migration                                │
│ https://example.com                             [Actions ▼]  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │  Overview  |  Comparison Runs  |  Pages  |  Settings   │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ [TAB: Overview]                                              │
│ ┌──────────────────────┐ ┌──────────────────────┐           │
│ │ Project Info         │ │ Statistics           │           │
│ │                      │ │                      │           │
│ │ Base URL: ...        │ │ Total Pages: 150     │           │
│ │ Created: ...         │ │ Total Runs: 5        │           │
│ │ Last Run: ...        │ │ Critical Diffs: 12   │           │
│ │ Status: Completed    │ │ Accepted: 8          │           │
│ └──────────────────────┘ └──────────────────────┘           │
│                                                              │
│ Baseline                                                     │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Run #1 (Baseline) - Completed - 2024-01-15 - 150 pages │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

#### Tabs

| Tab | Content | Components |
|-----|---------|------------|
| Overview | Project info, statistics, baseline info | `ProjectStatistics`, `RunCard` |
| Comparison Runs | List of runs with status and stats | `RunCard` (list), `RunStatusBadge` |
| Pages | All pages in project | `PageList`, `PageFilters` |
| Settings | Project configuration (read-only) | `n-descriptions` |

#### Data Requirements

| Data | Source | Store | API Endpoint |
|------|--------|-------|--------------|
| Project details | API | `projectsStore` | `GET /projects/:id` |
| Project runs | API | `runsStore` | `GET /projects/:id/runs` |
| Project pages | API | `pagesStore` | `GET /projects/:id` (with pages) |

#### User Actions

| Action | Handler | Store Action | API Call |
|--------|---------|--------------|----------|
| New comparison run | Router to create run | - | - |
| View run details | Router to run | - | - |
| Export project | Trigger export | `projectsStore.exportProject()` | `POST /projects/:id/export` |
| Delete project | Confirm + delete | `projectsStore.deleteProject()` | `DELETE /projects/:id` |

---

### 9.5 Run Detail View

**Route:** `/runs/:runId`
**Component:** `RunDetailView.vue`

#### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Breadcrumb: Dashboard > Projects > Project > Run #2          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Comparison Run #2                      [In Progress ●]       │
│ Started: 2024-01-16 14:30                                    │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │  Summary  |  Pages  |  Differences                     │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ [TAB: Summary]                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Progress                                               │  │
│ │ ████████████░░░░░░░░░░░░░░░░░░░░  45/150 pages        │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ Total Pages │ │ Changed     │ │ Critical    │            │
│ │     150     │ │     23      │ │     5       │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                              │
│ Changes by Type                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ SEO: 12  |  Visual: 8  |  Performance: 3               │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

#### Tabs

| Tab | Content | Components |
|-----|---------|------------|
| Summary | Run progress, statistics, config | `RunProgress`, `RunStatistics`, `DiffSummary` |
| Pages | List of pages with diff status | `PageList`, `PageFilters`, `PageStatusBadge` |
| Differences | Aggregated diff view by type | `DiffSummary`, `DiffBadge` |

#### Data Requirements

| Data | Source | Store | API Endpoint |
|------|--------|-------|--------------|
| Run details | API | `runsStore` | `GET /runs/:id` |
| Run pages | API | `pagesStore` | `GET /runs/:id/pages` |
| Run status (polling) | API | `runsStore` | `GET /runs/:id` (poll if in_progress) |

#### Real-time Updates

When run status is `in_progress` or `pending`:
- Poll `GET /runs/:runId` every 3 seconds
- Update progress bar and statistics
- Stop polling when status becomes `completed` or `failed`

---

### 9.6 Page Detail View

**Route:** `/pages/:pageId`
**Component:** `PageDetailView.vue`

#### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Breadcrumb: ... > Page: /about                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Page: /about                                   [HTTP 200]    │
│ https://example.com/about                                    │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ SEO & Content | Visual Diff | Performance | Headers    │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ [TAB: SEO & Content]                                         │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ SEO Changes                                    [Accept]│  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ Title                                        [Critical]│  │
│ │ Baseline: "About Us | Example"                         │  │
│ │ Current:  "About | Example"                            │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ Meta Description                             [Warning] │  │
│ │ Baseline: "Learn about our company..."                 │  │
│ │ Current:  "About our company..."                       │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ H1                                           [Info]    │  │
│ │ Baseline: ["About Us"]                                 │  │
│ │ Current:  ["About Us", "Our Story"]                    │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ [TAB: Visual Diff]                                           │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ View: [Side by Side ▼]  [Zoom: 100% ▼]                │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ ┌─────────────────┐  ┌─────────────────┐              │  │
│ │ │                 │  │                 │              │  │
│ │ │    Baseline     │  │     Current     │              │  │
│ │ │   Screenshot    │  │   Screenshot    │              │  │
│ │ │                 │  │                 │              │  │
│ │ └─────────────────┘  └─────────────────┘              │  │
│ │                                                        │  │
│ │ 1,234 pixels different (0.5%)  [Within threshold]      │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

#### Tabs

| Tab | Content | Components |
|-----|---------|------------|
| SEO & Content | SEO field changes with severity | `SeoDiffView`, `DiffBadge`, `DiffActions` |
| Visual Diff | Screenshot comparison | `VisualDiffView` |
| Performance | Metrics comparison | `PerformanceDiffView` |
| Headers | HTTP header changes | `n-table` with diff highlighting |

#### Data Requirements

| Data | Source | Store | API Endpoint |
|------|--------|-------|--------------|
| Page details | API | `pagesStore` | `GET /pages/:id` |
| Page diff | API | `diffsStore` | `GET /pages/:id/diff` |
| Screenshots | API (URLs) | `api.artifacts` | `GET /artifacts/:id/screenshot` |
| HAR file | API (download) | `api.artifacts` | `GET /artifacts/:id/har` |

#### User Actions

| Action | Handler | Store Action | API Call |
|--------|---------|--------------|----------|
| Accept change | Click accept | `diffsStore.acceptDiff()` | `POST /diffs/:id/accept` |
| Mute change | Click mute | `diffsStore.muteDiff()` | `POST /diffs/:id/mute` |
| Create rule | Open dialog | Navigate to rule create | - |
| View screenshot | Lightbox | - | Direct URL |
| Download HAR | Download link | - | Direct URL |
| Toggle view mode | Select | Local state | - |

---

### 9.7 Rules List View

**Route:** `/rules`
**Component:** `RulesListView.vue`

#### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Breadcrumb: Dashboard > Mute Rules                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Mute Rules                                     [+ New Rule]  │
│ Manage rules for ignoring specific differences               │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Filter: [All ▼]  Scope: [All ▼]  Status: [All ▼]      │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Rule Name              | Scope   | Type    | Status   │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ Ignore timestamps      | Global  | Content | Active   │  │
│ │ Skip analytics scripts | Project | Visual  | Active   │  │
│ │ Mute footer changes    | Project | Visual  | Inactive │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ [Pagination]                                                 │
└──────────────────────────────────────────────────────────────┘
```

#### Data Requirements

| Data | Source | Store | API Endpoint |
|------|--------|-------|--------------|
| Rules list | API | `rulesStore` | `GET /rules` |
| Filter state | Local | `rulesStore.filters` | - |

---

### 9.8 Rule Create View

**Route:** `/rules/new`
**Component:** `RuleCreateView.vue`

#### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Breadcrumb: Dashboard > Mute Rules > New Rule                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Create Mute Rule                                             │
│ Define conditions for muting differences                     │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Rule Name *                                            │  │
│ │ [________________________________]                     │  │
│ │                                                        │  │
│ │ Description                                            │  │
│ │ [________________________________]                     │  │
│ │                                                        │  │
│ │ Scope                                                  │  │
│ │ ( ) Global (all projects)                              │  │
│ │ ( ) This project only  [Select project ▼]             │  │
│ │                                                        │  │
│ │ Active  [✓]                                           │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ Conditions                                     [+ Add]       │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ #1  Diff Type: [SEO ▼]                                │  │
│ │     Field Pattern: [title]                             │  │
│ │     Value Pattern: [.*timestamp.*]                     │  │
│ │                                           [Remove]     │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│                               [Cancel]  [Create Rule]        │
└──────────────────────────────────────────────────────────────┘
```

#### Validation Schema

```typescript
createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  scope: z.enum(['global', 'project']),
  projectId: z.string().uuid().optional(),
  active: z.boolean().default(true),
  conditions: z.array(ruleConditionSchema).min(1)
});
```

---

### 9.9 Settings View

**Route:** `/settings`
**Component:** `SettingsView.vue`

#### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Breadcrumb: Dashboard > Settings                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Settings                                                     │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ General  |  Default Values  |  Appearance              │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ [TAB: General]                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Language                                               │  │
│ │ [English ▼]                                           │  │
│ │                                                        │  │
│ │ Data Directory                                         │  │
│ │ /home/user/.diff-voyager                               │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ [TAB: Appearance]                                            │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Theme                                                  │  │
│ │ ( ) Light  ( ) Dark  (•) System                       │  │
│ │                                                        │  │
│ │ Compact Mode  [ ]                                      │  │
│ │ Reduce spacing and padding                             │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│                                         [Save Settings]      │
└──────────────────────────────────────────────────────────────┘
```

#### Data Requirements

| Data | Source | Store | API Endpoint |
|------|--------|-------|--------------|
| Current settings | Local storage | `uiStore` | - |

---

## 10. Shared Components

### Common Components

| Component | Purpose | Props | Emits |
|-----------|---------|-------|-------|
| `AppHeader` | Top navigation bar | - | - |
| `AppSidebar` | Side navigation menu | `collapsed` | `toggle` |
| `AppBreadcrumb` | Breadcrumb navigation | `items` | - |
| `LoadingSpinner` | Loading indicator | `size`, `text` | - |
| `ErrorAlert` | Error display | `message`, `type` | `retry`, `dismiss` |
| `EmptyState` | Empty data placeholder | `icon`, `title`, `description` | `action` |
| `ConfirmDialog` | Confirmation modal | `title`, `message`, `type` | `confirm`, `cancel` |
| `Pagination` | Page navigation | `total`, `page`, `pageSize` | `update:page` |

### Project Components

| Component | Purpose | Props | Emits |
|-----------|---------|-------|-------|
| `ProjectCard` | Project summary card | `project` | `click`, `delete` |
| `ProjectForm` | Create/edit form | `modelValue`, `loading` | `submit` |
| `ProjectStatusBadge` | Status indicator | `status` | - |
| `ProjectStatistics` | Stats display | `statistics` | - |

### Run Components

| Component | Purpose | Props | Emits |
|-----------|---------|-------|-------|
| `RunCard` | Run summary card | `run`, `isBaseline` | `click` |
| `RunForm` | Create run form | `projectId` | `submit` |
| `RunStatusBadge` | Status indicator | `status` | - |
| `RunProgress` | Progress bar | `completed`, `total` | - |
| `RunStatistics` | Stats display | `statistics` | - |

### Page Components

| Component | Purpose | Props | Emits |
|-----------|---------|-------|-------|
| `PageList` | Paginated page list | `pages`, `loading` | `select` |
| `PageStatusBadge` | Status indicator | `status`, `httpStatus` | - |
| `PageFilters` | Filter controls | `modelValue` | `update:modelValue` |

### Diff Components

| Component | Purpose | Props | Emits |
|-----------|---------|-------|-------|
| `DiffSummary` | Summary statistics | `summary` | - |
| `DiffBadge` | Severity badge | `severity`, `type` | - |
| `SeoDiffView` | SEO changes display | `changes` | `accept`, `mute` |
| `VisualDiffView` | Screenshot comparison | `baseline`, `current`, `diff` | - |
| `PerformanceDiffView` | Metrics comparison | `changes` | - |
| `DiffActions` | Accept/mute buttons | `status` | `accept`, `mute`, `createRule` |

### Rules Components

| Component | Purpose | Props | Emits |
|-----------|---------|-------|-------|
| `RuleForm` | Create/edit form | `modelValue` | `submit` |
| `RuleCard` | Rule summary | `rule` | `edit`, `delete`, `toggle` |
| `RuleConditionBuilder` | Condition editor | `modelValue` | `update:modelValue` |

---

## 11. UI/UX Guidelines

### Design System

#### Colors (Naive UI Theme)

```typescript
// Semantic colors mapped to Naive UI theme
const themeOverrides = {
  common: {
    primaryColor: '#18a058',        // Success/primary actions
    primaryColorHover: '#36ad6a',
    infoColor: '#2080f0',           // Information
    successColor: '#18a058',        // Success states
    warningColor: '#f0a020',        // Warnings
    errorColor: '#d03050'           // Errors/critical
  }
};
```

#### Status Colors

| Status | Color | Usage |
|--------|-------|-------|
| `new` / `pending` | Gray | Neutral state |
| `in_progress` | Blue | Processing |
| `completed` | Green | Success |
| `error` / `failed` | Red | Error |
| `interrupted` | Orange | Warning |

#### Severity Colors

| Severity | Color | Icon |
|----------|-------|------|
| `critical` | Red | `exclamation-circle` |
| `warning` | Orange | `warning` |
| `info` | Blue | `info-circle` |

### Responsive Breakpoints

```scss
$breakpoints: (
  'sm': 640px,   // Mobile
  'md': 768px,   // Tablet
  'lg': 1024px,  // Laptop
  'xl': 1280px,  // Desktop
  '2xl': 1536px  // Large desktop
);
```

### Loading States

1. **Initial load**: Full-page spinner with message
2. **Data refresh**: Inline spinner in component
3. **Action pending**: Button loading state
4. **Background process**: Progress bar or toast

### Error Handling

1. **Network errors**: Toast notification with retry option
2. **Validation errors**: Inline form field errors
3. **404 errors**: Redirect to NotFoundView
4. **Server errors**: Error alert with support info

### Accessibility

- All interactive elements have focus states
- ARIA labels for icons and badges
- Keyboard navigation support
- Color contrast meets WCAG AA standards
- Screen reader friendly status messages

---

## 12. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Set up project infrastructure and core components

**Tasks**:
1. Configure Vite, Vue 3, TypeScript
2. Install and configure dependencies (Naive UI, Pinia, Vue Router, vue-i18n, Zod)
3. Set up project structure (folders, files)
4. Create i18n configuration and English locale file
5. Implement API client layer
6. Create base Pinia stores (projects, ui)
7. Build layout components (DefaultLayout, AppHeader, AppSidebar)
8. Build common components (LoadingSpinner, ErrorAlert, EmptyState, Pagination)

**Deliverables**:
- Working dev server with layout
- i18n configured with all translation keys
- API client connecting to backend
- Basic navigation working

### Phase 2: Project Management (Week 3-4)

**Goal**: Implement project CRUD functionality

**Tasks**:
1. Implement `projectsStore` with all actions
2. Build DashboardView with statistics and recent projects
3. Build ProjectListView with search and pagination
4. Build ProjectCreateView with multi-step form
5. Build ProjectDetailView with tabs
6. Create ProjectCard, ProjectForm, ProjectStatusBadge components
7. Implement form validation with Zod
8. Add confirmation dialogs for destructive actions

**Deliverables**:
- Full project management workflow
- Form validation working
- All project-related i18n keys used

### Phase 3: Run Management (Week 5-6)

**Goal**: Implement comparison run functionality

**Tasks**:
1. Implement `runsStore` and `tasksStore`
2. Build RunCreateView with form
3. Build RunDetailView with tabs and progress
4. Implement real-time polling for run status
5. Create RunCard, RunProgress, RunStatistics components
6. Build pages list in run context
7. Implement page filtering and sorting

**Deliverables**:
- Create and monitor runs
- Real-time progress updates
- Page list with filters

### Phase 4: Diff Review (Week 7-8)

**Goal**: Implement diff viewing and actions

**Tasks**:
1. Implement `diffsStore` and `pagesStore`
2. Build PageDetailView with all tabs
3. Create SeoDiffView component
4. Create VisualDiffView with view modes (side-by-side, overlay, slider)
5. Create PerformanceDiffView component
6. Implement diff accept/mute actions
7. Build DiffSummary, DiffBadge, DiffActions components
8. Handle artifact loading (screenshots, HAR)

**Deliverables**:
- Full diff review workflow
- Visual comparison with multiple view modes
- Accept/mute functionality

### Phase 5: Rules & Settings (Week 9)

**Goal**: Implement mute rules and settings

**Tasks**:
1. Implement `rulesStore`
2. Build RulesListView with filters
3. Build RuleCreateView with condition builder
4. Create RuleConditionBuilder component
5. Build SettingsView with all tabs
6. Implement theme switching
7. Persist settings to localStorage

**Deliverables**:
- Mute rules management
- Settings persistence
- Theme support

### Phase 6: Polish & Testing (Week 10)

**Goal**: Finalize and test

**Tasks**:
1. Add error boundaries
2. Implement loading skeletons
3. Add keyboard shortcuts
4. Accessibility audit and fixes
5. Performance optimization
6. E2E testing with Playwright
7. Cross-browser testing
8. Documentation updates

**Deliverables**:
- Production-ready UI
- Test coverage
- Documentation

---

## Appendix A: API Endpoint Reference

| Method | Endpoint | Description | Used In |
|--------|----------|-------------|---------|
| `GET` | `/projects` | List projects | ProjectListView, DashboardView |
| `GET` | `/projects/:id` | Get project details | ProjectDetailView |
| `GET` | `/projects/:id/runs` | List project runs | ProjectDetailView |
| `POST` | `/projects/:id/runs` | Create new run | RunCreateView |
| `POST` | `/scans` | Create project (scan) | ProjectCreateView |
| `GET` | `/runs/:id` | Get run details | RunDetailView |
| `GET` | `/runs/:id/pages` | List run pages | RunDetailView |
| `GET` | `/pages/:id` | Get page details | PageDetailView |
| `GET` | `/pages/:id/diff` | Get page diff | PageDetailView |
| `GET` | `/artifacts/:id/screenshot` | Get screenshot | PageDetailView |
| `GET` | `/artifacts/:id/baseline-screenshot` | Get baseline screenshot | PageDetailView |
| `GET` | `/artifacts/:id/diff` | Get visual diff | PageDetailView |
| `GET` | `/artifacts/:id/har` | Get HAR file | PageDetailView |
| `GET` | `/artifacts/:id/html` | Get HTML | PageDetailView |
| `GET` | `/tasks/:id` | Get task status | RunDetailView (polling) |
| `GET` | `/health` | Health check | App init |

---

## Appendix B: Store-to-View Mapping

| View | Primary Store | Secondary Stores |
|------|---------------|------------------|
| DashboardView | `projectsStore` | `uiStore` |
| ProjectListView | `projectsStore` | `uiStore` |
| ProjectCreateView | `projectsStore` | - |
| ProjectDetailView | `projectsStore` | `runsStore`, `pagesStore` |
| RunCreateView | `runsStore` | `projectsStore` |
| RunDetailView | `runsStore` | `pagesStore`, `tasksStore` |
| PageDetailView | `pagesStore` | `diffsStore` |
| RulesListView | `rulesStore` | - |
| RuleCreateView | `rulesStore` | `projectsStore` |
| SettingsView | `uiStore` | - |

---

## Appendix C: i18n Key Categories

| Category | Key Pattern | Example |
|----------|-------------|---------|
| Common actions | `common.actions.*` | `common.actions.save` |
| Common status | `common.status.*` | `common.status.loading` |
| Common labels | `common.labels.*` | `common.labels.name` |
| Validation | `common.validation.*` | `common.validation.required` |
| Navigation | `nav.*` | `nav.dashboard` |
| Dashboard | `dashboard.*` | `dashboard.title` |
| Projects | `projects.*` | `projects.list.title` |
| Runs | `runs.*` | `runs.detail.title` |
| Pages | `pages.*` | `pages.status.completed` |
| Diffs | `diffs.*` | `diffs.severity.critical` |
| Rules | `rules.*` | `rules.form.name.label` |
| Settings | `settings.*` | `settings.appearance.theme.dark` |
| Errors | `errors.*` | `errors.network` |
| Notifications | `notifications.*` | `notifications.projectCreated` |
