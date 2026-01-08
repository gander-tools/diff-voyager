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
├── frontend/  # Vue 3 UI (Vite + Naive UI) - Phase 1 Complete
└── shared/    # Shared TypeScript types
```

See [Architecture Overview](docs/architecture/overview.md) for detailed design.

## Technology Stack

**Backend**:
- **Runtime**: Node.js, TypeScript
- **Web Framework**: Fastify
- **Database**: SQLite with Drizzle ORM
- **Crawler**: Crawlee, Playwright
- **Testing**: Vitest
- **Diff Engine**: Pixelmatch

**Frontend** (Phase 1 Complete):
- **Framework**: Vue 3, TypeScript
- **UI Library**: Naive UI
- **State**: Pinia
- **Routing**: Vue Router
- **i18n**: vue-i18n (EN + PL)
- **Build**: Vite

See [Technology Stack](docs/architecture/technology-stack.md) for detailed information.

## Requirements

- **Node.js**: v22 or v24
- **Bun**: Latest (for frontend development)
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
cd packages/frontend
npm run dev
```

**Access the Application**:
- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs (Swagger UI)

**Current Frontend Status** (Phase 1 Complete):
- ✅ Responsive layout with theme switching (light/dark/auto)
- ✅ Language switching (English/Polish)
- ✅ Navigation menu with 11 routes
- ⏳ Views showing placeholders (Phase 2: Project management coming next)

**Try the API**:
```bash
# Create first scan
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "sync": true}' | jq
```

See **[Getting Started Guide](docs/guides/getting-started.md)** for detailed installation, configuration, and usage instructions.

## Documentation

### Getting Started
- **[Getting Started](docs/guides/getting-started.md)** - Installation, setup, and first scan
- **[Development Workflow](docs/guides/development-workflow.md)** - TDD approach, commit guidelines, and best practices
- **[Testing Strategy](docs/guides/testing-strategy.md)** - Test structure and coverage

### Architecture & Design
- **[Architecture Overview](docs/architecture/overview.md)** - System design and monorepo structure
- **[Domain Model](docs/architecture/domain-model.md)** - Core entities and relationships
- **[Technology Stack](docs/architecture/technology-stack.md)** - Technologies used across all packages

### Development Status
- **[Implementation Status](docs/development/implementation-status.md)** - Current phase completion, capabilities, and major milestones
- **[Roadmap](docs/development/roadmap.md)** - Planned features and next steps

### API Reference
- **[API Overview](docs/api/overview.md)** - API scenarios and design decisions
- **[API Endpoints](docs/api/endpoints.md)** - Complete REST API specification
- **[Types and Schemas](docs/api/types.md)** - TypeScript interfaces and request/response types

### Features
- **[Crawler](docs/features/README.md#crawler)** - Page capture, browser management, and site crawling
- **[Comparators](docs/features/README.md#comparators)** - SEO, visual, header, and performance comparison
- **[Task Queue](docs/features/README.md#task-queue)** - Asynchronous task processing
- **[Frontend Plan](docs/features/frontend-plan.md)** - Vue 3 UI implementation plan
- **[Frontend Status](docs/features/frontend-status.md)** - Current UI implementation status and what's visible

### Additional Resources
- **[CLAUDE.md](CLAUDE.md)** - AI-assisted development guide
- **[PRD](.claude/PRD.md)** - Product Requirements Document

## Development

### Running Tests

```bash
# All tests
npm test

# Backend tests only
npm run test:backend

# With coverage
npm run test:coverage:backend

# Watch mode (auto-rerun on changes)
cd packages/backend && npm run test:watch
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build:backend
npm run build:shared
```

### Code Quality

```bash
# Check code style
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code
npm run format:fix
```

## How It Works

1. **Create baseline** - Crawl your site before changes
2. **Make changes** - Upgrade framework, update dependencies
3. **Run comparison** - Crawl again and compare against baseline
4. **Review diffs** - Examine visual, SEO, and performance differences
5. **Fix and iterate** - Address issues until acceptable

**Core entities**: Project, Baseline, Run, Page Snapshot, Diff, Mute Rules

See [Domain Model](docs/architecture/domain-model.md) for detailed entity descriptions and relationships.

## Contributing

1. Read the [PRD](.claude/PRD.md) to understand requirements
2. Follow [Development Workflow](docs/guides/development-workflow.md) - TDD and commit guidelines
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
