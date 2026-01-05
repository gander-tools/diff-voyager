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

## Installation

```bash
npm install @gander-tools/diff-voyager-backend
```

## Requirements

- Node.js v22 or v24
- npm v10 or v11

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
