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
- **Bun**: Latest version (for frontend development)
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

- **Backend**: Node.js 22, TypeScript, Crawlee, Playwright, Fastify
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

## Roadmap

### MVP (In Progress)
- [x] Project initialization and structure
- [ ] Domain model implementation
- [ ] Crawler with Crawlee + Playwright
- [ ] Screenshot and visual diff engine
- [ ] SEO metadata extraction
- [ ] HAR file capture and performance metrics
- [ ] Local API with Fastify
- [ ] Vue 3 UI with project and run management
- [ ] Diff review and acceptance workflow
- [ ] Mute rules and filters
- [ ] Export functionality

### Future Enhancements
- CI/CD integration (GitHub Actions, GitLab CI)
- SEO tool integration
- Advanced visual diff algorithms
- Multi-user support
- Docker deployment
- Email/Slack notifications

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/gander-tools/diff-voyager).
