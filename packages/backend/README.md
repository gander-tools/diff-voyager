# @gander-tools/diff-voyager-backend

Backend crawler and API for Diff Voyager - a local website version comparison tool.

## Overview

This package provides the core crawling engine and local HTTP API for Diff Voyager:
- Website crawling using Crawlee and Playwright
- Page snapshot collection (HTML, screenshots, HAR files)
- SEO metadata extraction
- Comparison logic for baselines vs. runs
- Local API server for frontend communication

## Features

- **Crawling**: Automated website traversal with configurable scope
- **Data Collection**: HTML, HTTP headers, screenshots, performance metrics
- **Diff Generation**: Visual, HTML/SEO, and performance comparisons
- **Persistent Storage**: SQLite-based queue and artifact storage
- **Resume Capability**: Continue interrupted crawls

## Requirements

- Node.js v22 or v24
- npm v10 or v11

## Installation

For development:

```bash
# From the repository root
cd packages/backend

# Install dependencies
npm install

# Install Playwright browsers (required for crawling)
npx playwright install chromium
```

For production:

```bash
npm install @gander-tools/diff-voyager-backend
```

## Development

### Running the Development Server

Start the backend API server in development mode with hot-reload:

```bash
npm run dev
```

The API will be available at `http://localhost:3001` by default.

### Building

Build the TypeScript source to JavaScript:

```bash
npm run build
```

Built files will be output to the `dist/` directory.

### Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode (recommended during development):

```bash
npm run test:watch
```

Test structure:
- `tests/unit/` - Unit tests for domain logic, repositories
- `tests/integration/` - Integration tests for API endpoints and crawler
- `tests/helpers/` - Test utilities and factories
- `tests/fixtures/` - Test data and HTML fixtures

### Linting and Formatting

Check code with Biome:

```bash
npm run lint
```

Format code with Biome:

```bash
npm run format
```

## Usage

```typescript
import { createCrawler } from '@gander-tools/diff-voyager-backend';

// Start crawling
const crawler = createCrawler({
  baseUrl: 'http://localhost:3000',
  // ... configuration
});

await crawler.run();
```

## License

GPL-3.0 - See LICENSE file in the repository root.
