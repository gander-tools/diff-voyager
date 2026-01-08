# @gander-tools/diff-voyager-shared

Shared TypeScript types and utilities for Diff Voyager - a local website version comparison tool.

## Overview

This package contains shared domain models, TypeScript types, and enums used across the Diff Voyager monorepo:
- Backend (crawler and API)
- Frontend (Vue.js UI)

## Installation

```bash
npm install @gander-tools/diff-voyager-shared
```

## Usage

```typescript
import type { Project, Run, PageSnapshot, Diff } from '@gander-tools/diff-voyager-shared';
import { RunStatus, DiffType, DiffSeverity } from '@gander-tools/diff-voyager-shared';
```

## Available Types

### Domain Models

- **Project** - Migration effort configuration with baseline and comparison runs
- **ProjectConfig** - Project settings (crawl, viewport, thresholds)
- **Baseline** - Immutable reference snapshot of a project
- **Run** - A comparison crawl against the baseline
- **RunConfig** - Run settings and options
- **RunStatistics** - Metrics about a run

### Page Types

- **Page** - Normalized page identifier within a project
- **PageSnapshot** - Complete capture of a page (HTML, headers, SEO, performance)
- **SeoData** - SEO metadata (title, meta description, canonical, robots, H1/H2)
- **PerformanceData** - Performance metrics (load time, request count, size)
- **ArtifactReferences** - Paths to stored artifacts (screenshots, HAR)

### Diff Types

- **Diff** - Comparison result between baseline and run
- **Change** - Individual change detected in a diff
- **ChangeDetails** - Detailed information about a change
- **DiffSummary** - Summary statistics for a diff

### Configuration Types

- **CrawlConfig** - Crawl settings (scope, limits, concurrency)
- **ScopeRules** - URL scope rules for crawling
- **ViewportConfig** - Screenshot viewport settings
- **ThresholdConfig** - Diff detection thresholds
- **IgnoreFilters** - Filters for ignoring content

### Rule Types

- **MuteRule** - Rule for ignoring specific differences
- **RuleCondition** - Condition that triggers a mute rule

### API Types

- **CreateScanRequest** - Request to create a new scan
- **CreateScanResponse** - Response from scan creation
- **ProjectResponse** - Project details response
- **RunResponse** - Run details response
- (See `api-requests.ts` and `api-responses.ts` for complete list)

## Available Enums

- **RunStatus** - `NEW`, `IN_PROGRESS`, `COMPLETED`, `INTERRUPTED`, `FAILED`
- **PageStatus** - `PENDING`, `CAPTURING`, `CAPTURED`, `ERROR`
- **DiffType** - `HTML`, `SEO`, `VISUAL`, `HEADERS`, `PERFORMANCE`
- **DiffSeverity** - `CRITICAL`, `WARNING`, `INFO`
- **DiffStatus** - `NEW`, `ACCEPTED`, `MUTED`
- **RunProfile** - `FULL`, `SEO_ONLY`, `VISUAL_ONLY`, `PERFORMANCE_ONLY`
- **RuleScope** - `GLOBAL`, `PROJECT`

## Development

### Building

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Testing

```bash
npm test
```

### Linting and Formatting

```bash
# Check code
npm run lint

# Format code
npm run format
```

## Requirements

- Node.js v22 or v24
- npm v10 or v11

## License

GPL-3.0 - See [LICENSE](./LICENSE) file.
