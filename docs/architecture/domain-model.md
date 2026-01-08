# Domain Model

## Overview

The Diff Voyager domain model consists of core entities representing projects, crawl runs, pages, snapshots, and comparisons. All entities are defined as shared TypeScript types in `packages/shared/src/types/`.

## Entity Relationship Diagram

```
┌─────────────┐
│   Project   │ (1)
└──────┬──────┘
       │
       │ (1:n)
       ↓
┌─────────────┐         ┌─────────────┐
│     Run     │←────────│  Baseline   │ (first run)
└──────┬──────┘         └─────────────┘
       │
       │ (1:n)
       ↓
┌─────────────┐         ┌─────────────┐
│    Page     │────────→│ PageSnapshot│ (n:m via Run)
└──────┬──────┘         └──────┬──────┘
       │                       │
       │ (1:n)                 │ (1:1)
       ↓                       ↓
┌─────────────┐         ┌─────────────┐
│    Diff     │         │  Artifacts  │ (HTML, Screenshot, HAR)
└─────────────┘         └─────────────┘
```

## Core Entities

### Project

Represents a migration effort with configuration for crawling and comparison.

**Properties:**
- `id`: Unique identifier (UUID v4)
- `name`: Human-readable project name
- `baseUrl`: Root URL for crawling
- `config`: Configuration object
  - `crawl`: Enable multi-page crawling (boolean)
  - `viewport`: Browser viewport size
  - `visualDiffThreshold`: Pixel diff tolerance (0.0-1.0)
  - `maxPages`: Maximum pages to crawl (optional)
  - `includePatterns`: URL patterns to include (optional)
  - `excludePatterns`: URL patterns to exclude (optional)
- `createdAt`: Project creation timestamp
- `updatedAt`: Last modification timestamp

**Database**: `projects` table via `ProjectRepository`

**Relationships**:
- **Has many** Runs (1:n)
- **Has many** Pages (1:n)

### Baseline

The first run of a project, serving as the reference point for all comparisons.

**Special Characteristics:**
- Automatically created on first scan
- Marked with `isBaseline: true` in Run table
- Immutable within project lifecycle
- All comparison runs compare against baseline

**Note**: Baseline is not a separate entity but a Run with `isBaseline=true`

### Run

A crawl execution (baseline or comparison) with captured snapshots.

**Properties:**
- `id`: Unique identifier (UUID v4)
- `projectId`: Reference to Project
- `isBaseline`: Whether this is the baseline run (boolean)
- `status`: Run state (`NEW`, `IN_PROGRESS`, `INTERRUPTED`, `COMPLETED`)
- `config`: Run-specific configuration
  - `viewport`: Browser viewport size
  - `captureScreenshots`: Enable screenshot capture
  - `captureHar`: Enable HAR file collection
- `statistics`: Aggregated metrics (JSON)
  - `totalPages`: Total pages processed
  - `successfulPages`: Successfully captured pages
  - `failedPages`: Pages with errors
  - `totalDiffs`: Total differences detected
- `createdAt`: Run start timestamp
- `startedAt`: Processing start timestamp (nullable)
- `completedAt`: Processing completion timestamp (nullable)

**Database**: `runs` table via `RunRepository`

**Relationships**:
- **Belongs to** Project (n:1)
- **Has many** PageSnapshots (1:n)

**State Transitions**:
```
NEW → IN_PROGRESS → COMPLETED
               ↓
          INTERRUPTED → IN_PROGRESS (resume)
```

### Page

Normalized page identifier within a project.

**Properties:**
- `id`: Unique identifier (UUID v4)
- `projectId`: Reference to Project
- `normalizedUrl`: Canonical URL (after normalization)
- `originalUrl`: Original discovered URL
- `createdAt`: Page creation timestamp

**Database**: `pages` table via `PageRepository`

**URL Normalization Rules**:
1. Convert to lowercase
2. Remove trailing slashes
3. Sort query parameters
4. Remove tracking parameters (utm_*, fbclid, etc.)
5. Remove fragments (#)

**Example**:
```
Original:     https://Example.com/PATH/?utm_source=test&id=123#section
Normalized:   https://example.com/path?id=123
```

**Relationships**:
- **Belongs to** Project (n:1)
- **Has many** PageSnapshots (1:n, via Runs)
- **Has many** Diffs (1:n)

### PageSnapshot

Raw captured data for a page in a specific run.

**Properties:**
- `id`: Unique identifier (UUID v4)
- `runId`: Reference to Run
- `pageId`: Reference to Page
- `isBaseline`: Whether this snapshot is from baseline run
- `capturedAt`: Capture timestamp
- `httpStatus`: HTTP status code (200, 404, etc.)
- `htmlHash`: SHA-256 hash of HTML content
- `redirectChain`: Array of redirect URLs (if any)
- `headers`: HTTP response headers (JSON)
- `seo`: Extracted SEO metadata (JSON)
  - `title`: Page title
  - `description`: Meta description
  - `canonical`: Canonical URL
  - `robots`: Robots meta tag
  - `h1`: Array of H1 headings
  - `h2`: Array of H2 headings
- `performanceData`: Performance metrics (JSON, optional)
  - `loadTime`: Page load time (ms)
  - `requestCount`: Number of HTTP requests
  - `totalSize`: Total transferred bytes
- `hasScreenshot`: Screenshot file exists (boolean)
- `hasHar`: HAR file exists (boolean)
- `hasDiff`: Diff image generated (boolean)

**Database**: `snapshots` table via `SnapshotRepository`

**Relationships**:
- **Belongs to** Run (n:1)
- **Belongs to** Page (n:1)

**Artifacts** (stored on file system):
- `{pageId}/snapshot-{snapshotId}.html` - Raw HTML
- `{pageId}/screenshot-{snapshotId}.png` - Full-page screenshot
- `{pageId}/performance-{snapshotId}.har` - HAR file (optional)
- `{pageId}/diff-{baselineId}-vs-{comparisonId}.png` - Visual diff (generated on-demand)

### Diff

Comparison results between baseline and comparison run for a page.

**Properties:**
- `id`: Unique identifier (UUID v4)
- `pageId`: Reference to Page
- `baselineSnapshotId`: Reference to baseline PageSnapshot
- `comparisonSnapshotId`: Reference to comparison PageSnapshot
- `runId`: Reference to comparison Run
- `summary`: High-level diff summary (JSON)
  - `hasSeoChanges`: Boolean
  - `hasVisualChanges`: Boolean
  - `hasHeaderChanges`: Boolean
  - `hasPerformanceChanges`: Boolean
  - `severity`: `NONE`, `INFO`, `WARNING`, `CRITICAL`
- `changes`: Detailed change list (JSON array)
  - Each change: `{ type, field, oldValue, newValue, severity }`
- `status`: Business status (`NEW`, `ACCEPTED`, `MUTED`)
- `createdAt`: Diff creation timestamp

**Database**: `diffs` table via `DiffRepository`

**Relationships**:
- **Belongs to** Page (n:1)
- **Belongs to** Run (n:1)
- **References** two PageSnapshots (baseline and comparison)

**Change Types**:
- `SEO_TITLE_CHANGED`
- `SEO_DESCRIPTION_CHANGED`
- `SEO_CANONICAL_CHANGED`
- `SEO_H1_CHANGED`
- `VISUAL_PIXELS_CHANGED`
- `HEADER_ADDED`
- `HEADER_REMOVED`
- `HEADER_VALUE_CHANGED`
- `PERFORMANCE_LOAD_TIME_INCREASED`
- `PERFORMANCE_REQUEST_COUNT_INCREASED`
- `PERFORMANCE_SIZE_INCREASED`

**Severity Levels**:
- `NONE`: No differences
- `INFO`: Minor changes (e.g., timestamp)
- `WARNING`: Notable changes that may be intentional
- `CRITICAL`: Breaking changes (e.g., 404, missing title)

### Rule / MuteRule

Patterns for ignoring or muting specific differences.

**Properties:**
- `id`: Unique identifier (UUID v4)
- `projectId`: Reference to Project (null for global rules)
- `type`: Rule type (`CSS_SELECTOR`, `XPATH`, `HEADER_PATTERN`, `FIELD_PATTERN`)
- `pattern`: Pattern to match (string or regex)
- `scope`: `GLOBAL` or `PROJECT`
- `active`: Rule enabled (boolean)
- `diffTypes`: Array of diff types to apply to
- `createdAt`: Rule creation timestamp

**Database**: `rules` table (future implementation)

**Examples**:
```json
{
  "type": "CSS_SELECTOR",
  "pattern": ".timestamp",
  "scope": "PROJECT",
  "diffTypes": ["SEO_*", "VISUAL_*"]
}

{
  "type": "HEADER_PATTERN",
  "pattern": "x-request-id",
  "scope": "GLOBAL",
  "diffTypes": ["HEADER_*"]
}
```

**Status**: Planned, not yet implemented

## Data Lifecycle

### 1. Baseline Creation Flow

```
POST /api/v1/scans
    ↓
Create Project (if new baseUrl)
    ↓
Create Run (isBaseline=true)
    ↓
Crawl/Capture Pages
    ↓
For each URL:
  - Create Page (normalized)
  - Create PageSnapshot
  - Store Artifacts (HTML, screenshot, HAR)
```

### 2. Comparison Run Flow

```
POST /api/v1/scans (existing baseUrl)
    ↓
Find existing Project
    ↓
Create Run (isBaseline=false)
    ↓
Crawl/Capture Pages
    ↓
For each URL:
  - Find or Create Page
  - Create PageSnapshot
  - Store Artifacts
  - Generate Diff (baseline vs new)
  - Create Diff record
```

### 3. Diff Generation Flow

```
PageComparator.compare(baselineSnapshot, comparisonSnapshot)
    ↓
SEOComparator → SEO changes
VisualComparator → Pixel diff (pixelmatch)
HeaderComparator → Header changes
PerformanceComparator → Performance deltas
    ↓
Aggregate changes + Calculate severity
    ↓
Create Diff record
    ↓
Store in DiffRepository
```

## Type Safety

All entities are defined with TypeScript interfaces in `packages/shared/src/types/`:

```typescript
// packages/shared/src/types/project.ts
export interface Project {
  id: string;
  name: string;
  baseUrl: string;
  config: ProjectConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectConfig {
  crawl: boolean;
  viewport: { width: number; height: number };
  visualDiffThreshold: number;
  maxPages?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
}
```

These types are:
1. Shared between backend and frontend
2. Used for API request/response validation
3. Enforced by Drizzle ORM schema
4. Validated at runtime with JSON schemas

## See Also

- [Architecture Overview](overview.md) - System design and components
- [Technology Stack](technology-stack.md) - Implementation technologies
- [API Types](../api/types.md) - Complete type definitions
