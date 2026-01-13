# Technology Stack

## Overview

Diff Voyager uses modern TypeScript-based tools optimized for local development and testing workflows.

## Core Technologies

### Runtime & Language

| Technology | Version | Purpose | Package |
|-----------|---------|---------|---------|
| **Node.js** | 22.x / 24.x | JavaScript runtime | All |
| **TypeScript** | 5.7.x | Type-safe JavaScript | All |

**Why Node.js LTS versions?**
- Stable APIs and long-term support
- Excellent ecosystem for web scraping and automation
- Native TypeScript support with `tsx`

**Why TypeScript?**
- Compile-time type checking prevents runtime errors
- Shared types between backend and frontend
- Better IDE autocomplete and refactoring

### Backend Stack

#### Web Framework

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Fastify** | 5.x | HTTP API server |
| **@fastify/rate-limit** | 10.x | Rate limiting middleware |
| **@fastify/swagger** | 9.x | OpenAPI spec generation |
| **@fastify/swagger-ui** | 5.x | Interactive API documentation |

**Why Fastify?**
- Fastest Node.js web framework
- Built-in schema validation
- Excellent TypeScript support
- Plugin architecture for middleware

#### Database & ORM

| Technology | Version | Purpose |
|-----------|---------|---------|
| **SQLite** | - | Embedded SQL database |
| **better-sqlite3** | 12.x | Synchronous SQLite driver |
| **Drizzle ORM** | 0.45.x | Type-safe SQL query builder |
| **drizzle-kit** | 0.31.x | Schema migrations |

**Why SQLite?**
- Zero configuration (single file)
- No separate database server
- ACID transactions
- Sufficient for hundreds of pages
- Easy backup (copy file)

**Why Drizzle ORM?**
- Zero runtime overhead (thin abstraction)
- Full TypeScript type inference
- Automatic prepared statements (SQL injection prevention)
- JSON column support with type safety
- Better DX than raw SQL

**Migration from raw SQL:**
- All repositories migrated to Drizzle (100% complete)
- Improved type safety and security
- See [Roadmap](../development/roadmap.md) for migration details

#### Browser Automation

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Playwright** | 1.49.x | Headless browser control |
| **Crawlee** | 3.12.x | Web crawling framework |

**Why Playwright?**
- Supports Chromium, Firefox, WebKit
- Full-page screenshots
- HAR file generation
- Modern async API
- Excellent documentation

**Why Crawlee?**
- Built on Playwright
- Request queue management
- URL discovery and filtering
- Retry logic and error handling
- Crawl progress tracking

#### Image Comparison

| Technology | Version | Purpose |
|-----------|---------|---------|
| **pixelmatch** | 7.x | Pixel-by-pixel image diff |
| **pngjs** | 7.x | PNG encoding/decoding |

**Why pixelmatch?**
- Fast and lightweight
- Configurable threshold
- Generates visual diff images
- No external dependencies

### Frontend Stack

#### Framework & Build Tools

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Vue 3** | Latest | Reactive UI framework |
| **Vite** | Latest | Fast build tool |
| **TypeScript** | 5.7.x | Type safety |

**Why Vue 3?**
- Composition API for better code organization
- Excellent TypeScript support
- Reactive state management
- Small bundle size

**Why Vite?**
- Instant dev server startup
- Lightning-fast HMR
- Optimized production builds
- Native ES modules

#### UI Libraries

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Naive UI** | 2.43.x | Vue 3 component library |
| **@vicons/tabler** | 0.13.x | Icon library (Tabler icons) |

**Why Naive UI?**
- Comprehensive component library for Vue 3
- Built-in TypeScript support
- Consistent design system
- Good documentation

#### State & Routing

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Pinia** | 3.x | State management |
| **Vue Router** | 4.x | Client-side routing |

**Why Pinia?**
- Official Vue state management (replaces Vuex)
- Excellent TypeScript support
- Composition API integration
- Lightweight and modular

#### Form Validation

| Technology | Version | Purpose |
|-----------|---------|---------|
| **vee-validate** | 4.15.x | Vue 3 form validation |
| **@vee-validate/zod** | 4.15.x | Zod integration for vee-validate |
| **Zod** | 3.25.x | Schema validation |

**Why vee-validate + Zod?**
- Declarative validation (no manual error handling)
- Single source of truth (Zod schemas)
- Type-safe with full TypeScript inference
- Built-in async validation support
- Seamless Vue 3 Composition API integration

**Important**: Zod v3 required for compatibility with both `@ts-rest/core` and `@vee-validate/zod`

#### Type-Safe API Communication

| Technology | Version | Purpose |
|-----------|---------|---------|
| **@ts-rest/core** | 3.52.x | Type-safe API client/server |
| **ofetch** | 1.x | Modern fetch wrapper |

**Why @ts-rest?**
- Single source of truth for API contract
- Compile-time type safety between frontend and backend
- Automatic route generation
- Runtime validation with Zod schemas
- Full IDE autocomplete for API calls

See [CLAUDE.md](../../CLAUDE.md) for @ts-rest usage examples

**Status**: ✅ Frontend Phase 2 complete (January 2026)

### Shared Package

#### Type System

| Technology | Version | Purpose |
|-----------|---------|---------|
| **TypeScript** | 5.7.x | Shared type definitions |

**Shared Types**:
- Domain models (Project, Run, Page, Snapshot, Diff)
- API request/response interfaces
- Configuration types
- Constants

**Benefits**:
- Single source of truth for types
- Prevents API contract drift
- Compile-time validation across packages

### Testing Stack

#### Test Framework

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Vitest** | 4.x | Unit and integration testing |
| **@vitest/coverage-v8** | 4.x | Code coverage reporting |
| **Playwright Test** | 1.49.x | E2E testing (frontend) |

**Why Vitest?**
- Native Vite integration
- Fast test execution
- Jest-compatible API
- Excellent TypeScript support
- Built-in coverage

#### Test Utilities

| Technology | Version | Purpose |
|-----------|---------|---------|
| **supertest** | 7.x | HTTP API testing |
| **tmp** | 0.2.x | Temporary file/directory creation |

**Test Structure**:
```
packages/backend/tests/
├── unit/                    # Pure logic tests
│   ├── domain/             # Comparators, normalizers
│   ├── storage/            # Repository tests
│   └── queue/              # Task queue tests
├── integration/            # Component integration
│   ├── api/                # API endpoint tests
│   └── services/           # Service orchestration
└── helpers/                # Test utilities
    ├── mock-server.ts      # HTTP mock server
    ├── test-db.ts          # In-memory SQLite
    └── factories.ts        # Test data factories
```

### Code Quality

#### Linting & Formatting

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Biome** | 2.3.x | Fast linter and formatter |

**Why Biome?**
- Replaces ESLint + Prettier
- 100x faster than ESLint
- Single tool for linting and formatting
- Zero configuration needed
- Compatible with VSCode

**Configuration**: `biome.json` in project root

### Development Tools

#### Build & Watch

| Technology | Version | Purpose |
|-----------|---------|---------|
| **tsc** | 5.7.x | TypeScript compiler |
| **tsx** | 4.x | TypeScript execution with watch mode |

#### Version Management

| Technology | Purpose |
|-----------|---------|
| **npm workspaces** | Monorepo package management |
| **Node.js engines** | Enforce Node 22.x / 24.x |

## Planned Technologies

### Future Enhancements

| Technology | Purpose | Status |
|-----------|---------|--------|
| **Redis** | Distributed task queue (BullMQ) | Post-MVP |
| **PostgreSQL** | Scale beyond SQLite limits | Post-MVP |
| **Docker** | Containerized deployment | Post-MVP |
| **Lighthouse** | SEO and performance scoring | Post-MVP |

## Version Strategy

### Version Constraints

- **Major versions only** in documentation (e.g., "Node.js 22" not "22.10.5")
- **package.json** contains exact constraints:
  - `^5.7.0` - Allow patch and minor updates
  - `~5.7.0` - Allow patch updates only
  - `5.7.3` - Pin exact version (rare)

### Upgrade Policy

- **LTS versions** for Node.js (even-numbered major versions)
- **Latest stable** for libraries
- **Security patches** applied within 1 week
- **Major version upgrades** require testing and documentation update

## Dependency Management

### Update Process

```bash
# Check for outdated packages
npm outdated

# Update within current constraints
npm update

# Upgrade to new major versions (manual review required)
npm install package@latest
```

### Lock Files

- **package-lock.json** - All packages
- **Committed to git** - Ensures reproducible builds

## Performance Considerations

### Backend Performance

| Area | Optimization |
|------|-------------|
| Database | SQLite WAL mode, indexes on foreign keys |
| Browser | Browser instance pooling (single Playwright instance) |
| API | Fastify (fastest Node.js framework) |
| Task Queue | SQLite-based (no network overhead) |
| ORM | Drizzle (zero runtime overhead) |

### Frontend Performance

| Area | Optimization |
|------|-------------|
| Build | Vite (esbuild under the hood) |
| Bundle | Code splitting, tree shaking |
| Runtime | Vue 3 (faster than Vue 2) |

**Status**: Frontend not yet implemented

## Security Considerations

### Dependency Security

- **npm audit** - Regular security audits
- **Renovate Bot** - Automated dependency updates
- **No eval()** - Avoid dynamic code execution
- **Drizzle ORM** - Automatic SQL injection prevention

### Runtime Security

- **Rate limiting** - Prevent API abuse
- **Input validation** - JSON schema validation
- **Path traversal prevention** - Symlink validation
- **CORS** - Restrict cross-origin requests

## Development Environment

### Required Software

| Software | Min Version | Purpose |
|----------|-------------|---------|
| Node.js | 22.0.0 | Runtime |
| npm | 10.0.0 | Package manager |
| Git | 2.x | Version control |

### Optional Software

| Software | Purpose |
|----------|---------|
| VSCode | Recommended IDE |
| Biome VSCode Extension | Auto-format on save |
| SQLite Browser | Database inspection |

### System Requirements

- **OS**: Linux, macOS, or Windows with WSL2
- **RAM**: 4 GB minimum, 8 GB recommended
- **Disk**: 2 GB for dependencies + project data
- **Network**: Required for initial setup and crawling

## See Also

- [Architecture Overview](overview.md) - System design
- [Domain Model](domain-model.md) - Entity relationships
- [Getting Started](../guides/getting-started.md) - Installation guide
