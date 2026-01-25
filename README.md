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
├── frontend/  # Vue 3 UI (Vite + Naive UI) - Phase 4 Complete
└── shared/    # Shared TypeScript types
```

See [Documentation](docs/README.md) for detailed design.

## Technology Stack

**Backend**:
- **Runtime**: Node.js, TypeScript
- **Web Framework**: Fastify
- **Database**: SQLite with Drizzle ORM
- **Crawler**: Crawlee, Playwright
- **Testing**: Vitest
- **Diff Engine**: Pixelmatch

**Frontend** (Phase 4 Complete):
- **Framework**: Vue 3, TypeScript
- **UI Library**: Naive UI
- **State**: Pinia
- **Routing**: Vue Router
- **Validation**: vee-validate + Zod
- **Build**: Vite

See [Documentation](docs/README.md) for detailed information.

## Requirements

- **Node.js**: v22 or v24
- **Operating System**: Linux, macOS, or Windows with WSL2

## Quick Start

```bash
# Install
git clone https://github.com/gander-tools/diff-voyager.git
cd diff-voyager
npm install && npm run setup
npx playwright install

# Run backend API
npm run dev:backend

# In another terminal, run frontend UI
npm run dev:frontend
```

**Access the Application**:
- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs (Swagger UI)

**Try the API**:
```bash
# Create first scan
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "sync": true}' | jq
```

See **[Documentation](docs/README.md)** for detailed installation, configuration, and usage instructions.

## Documentation

Complete documentation is available in **[docs/README.md](docs/README.md)**.

### Additional Resources
- **[CLAUDE.md](CLAUDE.md)** - AI-assisted development guide
- **[PRD](.claude/PRD.md)** - Product Requirements Document

## Development

All commands run from the **root directory** of the monorepo.

### Quick Start (Per Package)

**Backend**:
```bash
npm run dev:backend          # Start dev server with hot reload
npm run build:backend        # Build TypeScript
npm run test:backend         # Run tests
```

**Frontend**:
```bash
npm run dev:frontend         # Start dev server
npm run build:frontend       # Build for production
npm run test:frontend        # Run tests
```

**Shared**:
```bash
npm run build:shared         # Build TypeScript types
npm run test:shared          # Run tests
```

### Running Tests

```bash
# All packages
npm test                        # Run all tests
npm run test:coverage           # Run all tests with coverage

# Specific packages
npm run test:backend            # Backend tests only
npm run test:frontend           # Frontend tests only
npm run test:shared             # Shared tests only

# With coverage
npm run test:coverage:backend   # Backend with coverage
npm run test:coverage:frontend  # Frontend with coverage
npm run test:coverage:shared    # Shared with coverage
```

### Building

```bash
# All packages (builds in order: shared → backend → frontend)
npm run build

# Specific packages
npm run build:shared            # Build shared types only
npm run build:backend           # Build backend only
npm run build:frontend          # Build frontend only
```

### Code Quality

```bash
# Check and fix (recommended workflow)
npm run check                   # Check code quality (lint + format)
npm run check:fix               # Auto-fix safe issues
npm run check:fix:unsafe        # Auto-fix all issues (including unsafe changes)

# Individual checks
npm run lint                    # Lint only
npm run lint:fix                # Lint with auto-fix
npm run format                  # Check formatting
npm run format:fix              # Format code
```

### Database Migrations

Diff Voyager uses **Drizzle ORM** with SQLite for type-safe database operations.

**Schema Location**: `packages/backend/src/storage/drizzle/schema/`

**Generate a migration** (after modifying schema files):
```bash
cd packages/backend
npx drizzle-kit generate
```

This creates SQL migration files in `src/storage/drizzle/migrations/`.

**Apply migrations** (run automatically on backend startup):
Migrations are applied automatically when the backend starts. The database schema is kept in sync with your code.

**Migration Configuration**: See `packages/backend/drizzle.config.ts` for Drizzle configuration.

**Learn More**: See [Documentation](docs/README.md) for schema patterns and query examples.

## How It Works

1. **Create baseline** - Crawl your site before changes
2. **Make changes** - Upgrade framework, update dependencies
3. **Run comparison** - Crawl again and compare against baseline
4. **Review diffs** - Examine visual, SEO, and performance differences
5. **Fix and iterate** - Address issues until acceptable

**Core entities**: Project, Baseline, Run, Page Snapshot, Diff, Mute Rules

See [Documentation](docs/README.md) for detailed entity descriptions and relationships.

## Contributing

1. Read the [PRD](.claude/PRD.md) to understand requirements
2. Follow TDD and commit guidelines (see [Documentation](docs/README.md))
3. Use shared TypeScript types from `@gander-tools/diff-voyager-shared`
4. Keep changes focused and avoid over-engineering
5. Update documentation as needed

## License

GNU General Public License v3.0 (GPL-3.0)

See [LICENSE](LICENSE) for details.

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/gander-tools/diff-voyager).

**Get Help**:
- [Documentation](docs/README.md) - Complete documentation index
- [GitHub Issues](https://github.com/gander-tools/diff-voyager/issues) - Report bugs or request features
- [GitHub Discussions](https://github.com/gander-tools/diff-voyager/discussions) - Ask questions and share ideas
