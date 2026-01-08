# @gander-tools/diff-voyager-backend

Backend crawler and API for Diff Voyager - a local website version comparison tool.

## Overview

This package provides the core crawling engine and local HTTP API for Diff Voyager:
- Website crawling using Crawlee and Playwright
- Page snapshot collection (HTML, screenshots, HAR files)
- SEO metadata extraction (title, meta description, canonical, robots, H1/H2)
- Comparison logic for baselines vs. runs (visual, SEO, headers, performance)
- Local API server for frontend communication
- SQLite-based persistent storage with Drizzle ORM

## Features

- **Crawling**: Automated website traversal with configurable scope using Crawlee
- **Browser Automation**: Playwright-based page capture with browser pooling
- **Data Collection**: HTML, HTTP headers, screenshots, performance metrics, HAR files
- **SEO Extraction**: Title, meta description, canonical URL, robots directives, H1/H2 headings
- **Comparison Engine**: Visual (pixelmatch), SEO, headers, and performance comparators
- **Persistent Storage**: SQLite database with repositories for projects, runs, pages, snapshots
- **Task Queue**: Background processing with retry logic and graceful shutdown
- **Resume Capability**: Continue interrupted crawls

## Requirements

- Node.js v22 or v24
- npm v10 or v11

## Installation

### Development Setup

```bash
# From the repository root
cd packages/backend

# Install dependencies
npm install

# Install Playwright browsers (required for crawling)
npx playwright install chromium
```

### Production

```bash
npm install @gander-tools/diff-voyager-backend
```

## Running the API Server

Start the backend API server:

```bash
# Development mode with hot-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000` by default.

### Configuration

Environment variables:
- `PORT` - Server port (default: 3000)
- `DATA_DIR` - Directory for database and artifacts (default: ./data)

```bash
PORT=3001 DATA_DIR=./my-data npm run dev
```

## API Endpoints

### Scans
- `POST /api/v1/scans` - Create a new scan (single page or crawl)

### Projects
- `GET /api/v1/projects` - List all projects with pagination
- `GET /api/v1/projects/:id` - Get project details with pages
- `GET /api/v1/projects/:id/runs` - List runs for a project
- `POST /api/v1/projects/:id/runs` - Create a comparison run

### Runs
- `GET /api/v1/runs/:id` - Run details with statistics
- `GET /api/v1/runs/:id/pages` - List pages in run with filtering

### Pages
- `GET /api/v1/pages/:id` - Page details with latest snapshot
- `GET /api/v1/pages/:id/diff` - Detailed diff comparison

### Artifacts
- `GET /api/v1/artifacts/:pageId/*` - Retrieve artifacts (screenshot, HTML, HAR)

### Tasks
- `GET /api/v1/tasks/:id` - Task status and progress

### System
- `GET /health` - Health check
- `GET /docs` - Swagger UI (interactive API documentation)

## Usage Examples

### Create a Sync Scan

```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "sync": true,
    "name": "My Project",
    "viewport": {"width": 1920, "height": 1080},
    "collectHar": false,
    "waitAfterLoad": 1000
  }'
```

### Create an Async Scan

```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Multi-page Crawl

```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "sync": true,
    "crawl": true
  }'
```

### Get Project Details

```bash
curl http://localhost:3000/api/v1/projects/{projectId}
```

## Development

### Building

```bash
npm run build
```

Built files will be output to the `dist/` directory.

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

Test structure:
- `tests/unit/` - Unit tests for domain logic, repositories
- `tests/integration/` - Integration tests for API endpoints and crawler
- `tests/helpers/` - Test utilities and factories
- `tests/fixtures/` - Test data and HTML fixtures

### Linting and Formatting

```bash
# Check code
npm run lint

# Format code
npm run format
```

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify with Swagger UI
- **Crawler**: Crawlee + Playwright
- **Database**: SQLite with better-sqlite3, migrating to Drizzle ORM
- **Visual Diff**: Pixelmatch for pixel-by-pixel comparison
- **Testing**: Vitest

## License

GPL-3.0 - See [LICENSE](./LICENSE) file.
