# API Endpoints Specification

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

MVP: No authentication required (local development tool)

## Common Response Headers

```
Content-Type: application/json
X-Request-Id: <uuid>
```

## Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": {
      "field": "specific field error"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `INTERNAL_ERROR` | 500 | Server error |
| `TASK_FAILED` | 500 | Task processing failed |

---

## Scenario 1: Single Page Scan

### POST /scans/single-page

Create a new single-page scan task.

**Request Body:**

```json
{
  "url": "https://example.com/page",
  "name": "My Single Page Scan",
  "description": "Optional description",
  "profile": "VISUAL_SEO",
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "visualDiffThreshold": 0.01,
  "collectHar": false,
  "waitAfterLoad": 1000
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | string | Yes | - | URL to scan |
| `name` | string | No | Auto-generated | Project name |
| `description` | string | No | null | Project description |
| `profile` | RunProfile | No | `VISUAL_SEO` | Data collection profile |
| `viewport` | ViewportConfig | No | `{1920, 1080}` | Screenshot viewport |
| `visualDiffThreshold` | number | No | `0.01` | Visual diff threshold (0-1) |
| `collectHar` | boolean | No | `false` | Collect HAR files |
| `waitAfterLoad` | number | No | `1000` | Wait time after load (ms) |

**Response: 202 Accepted**

```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "projectId": "550e8400-e29b-41d4-a716-446655440001",
  "runId": "550e8400-e29b-41d4-a716-446655440002",
  "status": "PENDING",
  "statusUrl": "/api/v1/tasks/550e8400-e29b-41d4-a716-446655440000",
  "projectUrl": "/api/v1/projects/550e8400-e29b-41d4-a716-446655440001"
}
```

---

## Scenario 2: Full Domain Crawl

### POST /scans/crawl

Create a new full domain crawl task.

**Request Body:**

```json
{
  "baseUrl": "https://example.com",
  "name": "Full Site Crawl",
  "description": "Complete site audit",
  "profile": "FULL",
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "visualDiffThreshold": 0.01,
  "collectHar": true,
  "maxPages": 100,
  "maxDurationSeconds": 3600,
  "includePatterns": ["^/blog/.*", "^/products/.*"],
  "excludePatterns": ["^/admin/.*", ".*\\.pdf$"],
  "followSubdomains": false,
  "waitAfterLoad": 1000,
  "concurrency": 3
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `baseUrl` | string | Yes | - | Base URL to crawl |
| `name` | string | No | Auto-generated | Project name |
| `description` | string | No | null | Project description |
| `profile` | RunProfile | No | `VISUAL_SEO` | Data collection profile |
| `viewport` | ViewportConfig | No | `{1920, 1080}` | Screenshot viewport |
| `visualDiffThreshold` | number | No | `0.01` | Visual diff threshold |
| `collectHar` | boolean | No | `false` | Collect HAR files |
| `maxPages` | number | No | `1000` | Max pages to crawl |
| `maxDurationSeconds` | number | No | `3600` | Max crawl duration |
| `includePatterns` | string[] | No | `[]` | URL patterns to include (regex) |
| `excludePatterns` | string[] | No | `[]` | URL patterns to exclude (regex) |
| `followSubdomains` | boolean | No | `false` | Crawl subdomains |
| `waitAfterLoad` | number | No | `1000` | Wait time after load (ms) |
| `concurrency` | number | No | `3` | Concurrent page limit |

**Response: 202 Accepted**

```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440010",
  "projectId": "550e8400-e29b-41d4-a716-446655440011",
  "runId": "550e8400-e29b-41d4-a716-446655440012",
  "status": "PENDING",
  "statusUrl": "/api/v1/tasks/550e8400-e29b-41d4-a716-446655440010",
  "projectUrl": "/api/v1/projects/550e8400-e29b-41d4-a716-446655440011"
}
```

---

## Task Status

### GET /tasks/:taskId

Get task processing status.

**Response: 200 OK**

```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "projectId": "550e8400-e29b-41d4-a716-446655440001",
  "runId": "550e8400-e29b-41d4-a716-446655440002",
  "type": "SINGLE_PAGE",
  "status": "IN_PROGRESS",
  "progress": {
    "totalPages": 1,
    "completedPages": 0,
    "failedPages": 0,
    "currentPage": "https://example.com/page"
  },
  "createdAt": "2025-01-07T10:00:00Z",
  "startedAt": "2025-01-07T10:00:01Z",
  "completedAt": null,
  "estimatedTimeRemaining": null,
  "errorMessage": null
}
```

**Status Values:**
- `PENDING` - Task queued, not started
- `IN_PROGRESS` - Task is being processed
- `COMPLETED` - Task finished successfully
- `FAILED` - Task failed (see errorMessage)
- `CANCELLED` - Task was cancelled

---

## Scenario 3: Project & Results Retrieval

### GET /projects

List all projects.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `sortBy` | string | `createdAt` | Sort field |
| `sortOrder` | string | `desc` | Sort direction |

**Response: 200 OK**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "My Project",
      "description": "Project description",
      "baseUrl": "https://example.com",
      "status": "COMPLETED",
      "createdAt": "2025-01-07T10:00:00Z",
      "lastRunAt": "2025-01-07T10:05:00Z",
      "pageCount": 25,
      "hasBaseline": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

---

### GET /projects/:projectId

Get full project details.

**Response: 200 OK**

```json
{
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "My Project",
    "description": "Project description",
    "baseUrl": "https://example.com",
    "config": {
      "viewport": { "width": 1920, "height": 1080 },
      "visualDiffThreshold": 0.01,
      "maxPages": 100
    },
    "createdAt": "2025-01-07T10:00:00Z",
    "updatedAt": "2025-01-07T10:05:00Z"
  },
  "baseline": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "projectId": "550e8400-e29b-41d4-a716-446655440001",
    "runId": "550e8400-e29b-41d4-a716-446655440002",
    "pageCount": 25,
    "createdAt": "2025-01-07T10:00:00Z"
  },
  "latestRun": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "status": "COMPLETED",
    "isBaseline": true,
    "statistics": {
      "totalPages": 25,
      "completedPages": 25,
      "errorPages": 0,
      "unchangedPages": 25,
      "changedPages": 0
    }
  },
  "runs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "status": "COMPLETED",
      "isBaseline": true,
      "createdAt": "2025-01-07T10:00:00Z",
      "completedAt": "2025-01-07T10:05:00Z"
    }
  ],
  "statistics": {
    "totalRuns": 1,
    "totalPages": 25,
    "lastRunAt": "2025-01-07T10:05:00Z",
    "totalDifferences": 0,
    "criticalDifferences": 0,
    "acceptedDifferences": 0,
    "mutedDifferences": 0
  }
}
```

---

### GET /projects/:projectId/runs

List all runs for a project.

**Response: 200 OK**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "projectId": "550e8400-e29b-41d4-a716-446655440001",
      "status": "COMPLETED",
      "isBaseline": true,
      "createdAt": "2025-01-07T10:00:00Z",
      "completedAt": "2025-01-07T10:05:00Z",
      "statistics": {
        "totalPages": 25,
        "completedPages": 25,
        "errorPages": 0,
        "unchangedPages": 25,
        "changedPages": 0,
        "criticalDifferences": 0,
        "acceptedDifferences": 0,
        "mutedDifferences": 0
      }
    }
  ],
  "pagination": { ... }
}
```

---

### GET /runs/:runId

Get run details with pages.

**Response: 200 OK**

```json
{
  "run": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "projectId": "550e8400-e29b-41d4-a716-446655440001",
    "status": "COMPLETED",
    "config": { ... },
    "statistics": { ... },
    "createdAt": "2025-01-07T10:00:00Z",
    "completedAt": "2025-01-07T10:05:00Z"
  },
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "My Project",
    "baseUrl": "https://example.com"
  },
  "pages": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440100",
      "normalizedUrl": "/page-1",
      "originalUrl": "https://example.com/page-1",
      "status": "COMPLETED",
      "httpStatus": 200,
      "hasChanges": false,
      "changeCount": 0,
      "criticalChangeCount": 0,
      "capturedAt": "2025-01-07T10:01:00Z"
    }
  ],
  "statistics": { ... }
}
```

---

### GET /runs/:runId/pages

List pages for a run with filtering.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | PageStatus | - | Filter by status |
| `changedOnly` | boolean | false | Show only changed pages |
| `diffType` | DiffType | - | Filter by diff type |
| `severity` | DiffSeverity | - | Filter by severity |
| `includeMuted` | boolean | false | Include muted diffs |
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page |
| `sortBy` | string | `url` | Sort field |
| `sortOrder` | string | `asc` | Sort direction |

**Response: 200 OK**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440100",
      "normalizedUrl": "/page-1",
      "originalUrl": "https://example.com/page-1",
      "status": "COMPLETED",
      "httpStatus": 200,
      "hasChanges": true,
      "changeCount": 3,
      "criticalChangeCount": 1,
      "capturedAt": "2025-01-07T10:01:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### GET /pages/:pageId

Get full page details with snapshot.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `runId` | string | latest | Specific run ID |

**Response: 200 OK**

```json
{
  "page": {
    "id": "550e8400-e29b-41d4-a716-446655440100",
    "projectId": "550e8400-e29b-41d4-a716-446655440001",
    "normalizedUrl": "/page-1",
    "originalUrl": "https://example.com/page-1"
  },
  "snapshot": {
    "id": "550e8400-e29b-41d4-a716-446655440200",
    "pageId": "550e8400-e29b-41d4-a716-446655440100",
    "runId": "550e8400-e29b-41d4-a716-446655440002",
    "status": "COMPLETED",
    "httpStatus": 200,
    "redirectChain": [],
    "htmlHash": "abc123...",
    "httpHeaders": {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "max-age=3600"
    },
    "seoData": {
      "title": "Page Title",
      "metaDescription": "Page description",
      "canonical": "https://example.com/page-1",
      "robots": "index, follow",
      "h1": ["Main Heading"],
      "h2": ["Subheading 1", "Subheading 2"],
      "lang": "en"
    },
    "performanceData": {
      "loadTimeMs": 1250,
      "requestCount": 45,
      "totalSizeBytes": 2500000
    },
    "artifacts": {
      "screenshotPath": "/artifacts/proj-1/run-2/screenshots/page-100.png",
      "harPath": "/artifacts/proj-1/run-2/har/page-100.har",
      "diffImagePath": null
    },
    "capturedAt": "2025-01-07T10:01:00Z"
  },
  "baselineSnapshot": {
    "id": "550e8400-e29b-41d4-a716-446655440199",
    ...
  },
  "diff": null
}
```

---

### GET /pages/:pageId/diff

Get detailed diff for a page.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `runId` | string | latest | Specific run ID |
| `includeMuted` | boolean | false | Include muted changes |

**Response: 200 OK**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440300",
  "pageId": "550e8400-e29b-41d4-a716-446655440100",
  "runId": "550e8400-e29b-41d4-a716-446655440003",
  "summary": {
    "totalChanges": 5,
    "criticalChanges": 1,
    "acceptedChanges": 0,
    "mutedChanges": 1,
    "changesByType": {
      "SEO": 2,
      "VISUAL": 1,
      "HEADERS": 1,
      "PERFORMANCE": 1
    },
    "visualDiffPercentage": 0.023,
    "visualDiffPixels": 4520,
    "thresholdExceeded": true
  },
  "seoChanges": [
    {
      "field": "title",
      "severity": "CRITICAL",
      "status": "NEW",
      "baselineValue": "Original Title",
      "currentValue": "Changed Title"
    },
    {
      "field": "metaDescription",
      "severity": "WARNING",
      "status": "NEW",
      "baselineValue": "Original description",
      "currentValue": "New description"
    }
  ],
  "headerChanges": [
    {
      "headerName": "cache-control",
      "severity": "INFO",
      "status": "NEW",
      "baselineValue": "max-age=3600",
      "currentValue": "max-age=7200"
    }
  ],
  "contentChanges": [],
  "visualDiff": {
    "diffPixels": 4520,
    "diffPercentage": 0.023,
    "thresholdExceeded": true,
    "threshold": 0.01,
    "baselineScreenshotUrl": "/api/v1/artifacts/snap-199/screenshot",
    "currentScreenshotUrl": "/api/v1/artifacts/snap-200/screenshot",
    "diffImageUrl": "/api/v1/artifacts/snap-200/diff"
  },
  "performanceChanges": [
    {
      "metric": "loadTime",
      "severity": "WARNING",
      "status": "NEW",
      "baselineValue": 1250,
      "currentValue": 1890,
      "changePercentage": 51.2
    }
  ]
}
```

---

## Artifact Endpoints

### GET /artifacts/:snapshotId/screenshot

Get screenshot image for a snapshot.

**Response: 200 OK**

```
Content-Type: image/png
Content-Disposition: inline; filename="screenshot.png"

<binary PNG data>
```

---

### GET /artifacts/:snapshotId/diff

Get visual diff image for a snapshot.

**Response: 200 OK**

```
Content-Type: image/png
Content-Disposition: inline; filename="diff.png"

<binary PNG data>
```

**Response: 404 Not Found** (if no diff exists)

---

### GET /artifacts/:snapshotId/har

Get HAR file for a snapshot.

**Response: 200 OK**

```
Content-Type: application/json
Content-Disposition: attachment; filename="page.har"

<HAR JSON data>
```

---

### GET /artifacts/:snapshotId/html

Get captured HTML for a snapshot.

**Response: 200 OK**

```
Content-Type: text/html; charset=utf-8

<HTML content>
```

---

## Comparison Run (Future Extension)

### POST /projects/:projectId/runs

Create a comparison run against baseline.

**Request Body:**

```json
{
  "profile": "VISUAL_SEO",
  "viewport": {
    "width": 1920,
    "height": 1080
  }
}
```

**Response: 202 Accepted**

```json
{
  "taskId": "...",
  "projectId": "...",
  "runId": "...",
  "status": "PENDING",
  "statusUrl": "/api/v1/tasks/...",
  "projectUrl": "/api/v1/projects/..."
}
```

---

## API Summary Table

| Method | Endpoint | Description | Scenario |
|--------|----------|-------------|----------|
| POST | `/scans/single-page` | Create single page scan | 1 |
| POST | `/scans/crawl` | Create full crawl | 2 |
| GET | `/tasks/:taskId` | Get task status | 1, 2 |
| GET | `/projects` | List projects | 3 |
| GET | `/projects/:projectId` | Get project details | 3 |
| GET | `/projects/:projectId/runs` | List project runs | 3 |
| GET | `/runs/:runId` | Get run details | 3 |
| GET | `/runs/:runId/pages` | List run pages | 3 |
| GET | `/pages/:pageId` | Get page details | 3 |
| GET | `/pages/:pageId/diff` | Get page diff | 3 |
| GET | `/artifacts/:snapshotId/screenshot` | Get screenshot | 3 |
| GET | `/artifacts/:snapshotId/diff` | Get diff image | 3 |
| GET | `/artifacts/:snapshotId/har` | Get HAR file | 3 |
| GET | `/artifacts/:snapshotId/html` | Get HTML | 3 |
