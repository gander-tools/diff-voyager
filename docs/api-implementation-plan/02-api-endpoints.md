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

## Scenarios 1 & 2: Create Scan

### POST /scans

Create a new scan task. The `crawl` parameter determines whether to scan only the starting URL (Scenario 1) or discover and crawl all pages within the domain (Scenario 2).

**Request Body:**

```json
{
  "url": "https://example.com/page",
  "crawl": false,
  "name": "My Scan",
  "description": "Optional description",
  "profile": "VISUAL_SEO",
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "visualDiffThreshold": 0.01,
  "collectHar": false,
  "waitAfterLoad": 1000,
  "maxPages": 100,
  "maxDurationSeconds": 3600,
  "includePatterns": ["^/blog/.*", "^/products/.*"],
  "excludePatterns": ["^/admin/.*", ".*\\.pdf$"],
  "followSubdomains": false,
  "concurrency": 3
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | string | Yes | - | Starting URL for the scan |
| `crawl` | boolean | No | `false` | **false** = scan only this URL (Scenario 1), **true** = discover and crawl all pages in domain (Scenario 2) |
| `name` | string | No | Auto-generated | Project name |
| `description` | string | No | null | Project description |
| `profile` | RunProfile | No | `VISUAL_SEO` | Data collection profile |
| `viewport` | ViewportConfig | No | `{1920, 1080}` | Screenshot viewport |
| `visualDiffThreshold` | number | No | `0.01` | Visual diff threshold (0-1) |
| `collectHar` | boolean | No | `false` | Collect HAR files |
| `waitAfterLoad` | number | No | `1000` | Wait time after page load (ms) |
| `maxPages` | number | No | `1000` | Max pages to crawl (only when `crawl: true`) |
| `maxDurationSeconds` | number | No | `3600` | Max crawl duration (only when `crawl: true`) |
| `includePatterns` | string[] | No | `[]` | URL patterns to include - regex (only when `crawl: true`) |
| `excludePatterns` | string[] | No | `[]` | URL patterns to exclude - regex (only when `crawl: true`) |
| `followSubdomains` | boolean | No | `false` | Crawl subdomains (only when `crawl: true`) |
| `concurrency` | number | No | `3` | Concurrent page limit (only when `crawl: true`) |

**Example: Single Page Scan (Scenario 1)**

```json
{
  "url": "https://example.com/specific-page",
  "crawl": false
}
```

**Example: Full Domain Crawl (Scenario 2)**

```json
{
  "url": "https://example.com",
  "crawl": true,
  "maxPages": 100,
  "excludePatterns": ["^/admin/.*"]
}
```

**Response: 202 Accepted**

```json
{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "projectId": "550e8400-e29b-41d4-a716-446655440001",
  "runId": "550e8400-e29b-41d4-a716-446655440002",
  "status": "PENDING",
  "crawl": false,
  "statusUrl": "/api/v1/tasks/550e8400-e29b-41d4-a716-446655440000",
  "projectUrl": "/api/v1/projects/550e8400-e29b-41d4-a716-446655440001"
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

### GET /projects/:projectId

Get full project details including status, runs, pages, and diffs.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includePages` | boolean | `true` | Include pages in response |
| `includeDiffs` | boolean | `true` | Include diffs for changed pages |
| `changedOnly` | boolean | `false` | Show only pages with changes |
| `diffType` | DiffType | - | Filter by diff type |
| `severity` | DiffSeverity | - | Filter by severity |
| `pageLimit` | number | `100` | Max pages to include |
| `pageOffset` | number | `0` | Offset for pagination |

**Response: 200 OK**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "My Project",
  "description": "Project description",
  "baseUrl": "https://example.com",
  "config": {
    "crawl": true,
    "viewport": { "width": 1920, "height": 1080 },
    "visualDiffThreshold": 0.01,
    "maxPages": 100
  },
  "status": "COMPLETED",
  "createdAt": "2025-01-07T10:00:00Z",
  "updatedAt": "2025-01-07T10:05:00Z",

  "statistics": {
    "totalPages": 25,
    "completedPages": 25,
    "errorPages": 0,
    "changedPages": 3,
    "unchangedPages": 22,
    "totalDifferences": 8,
    "criticalDifferences": 2,
    "acceptedDifferences": 0,
    "mutedDifferences": 1
  },

  "pages": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440100",
      "url": "/page-1",
      "originalUrl": "https://example.com/page-1",
      "status": "COMPLETED",
      "httpStatus": 200,
      "capturedAt": "2025-01-07T10:01:00Z",

      "seoData": {
        "title": "Page Title",
        "metaDescription": "Page description",
        "canonical": "https://example.com/page-1",
        "robots": "index, follow",
        "h1": ["Main Heading"],
        "lang": "en"
      },

      "httpHeaders": {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "max-age=3600"
      },

      "performanceData": {
        "loadTimeMs": 1250,
        "requestCount": 45,
        "totalSizeBytes": 2500000
      },

      "artifacts": {
        "screenshotUrl": "/api/v1/artifacts/page-100/screenshot",
        "harUrl": "/api/v1/artifacts/page-100/har",
        "htmlUrl": "/api/v1/artifacts/page-100/html"
      },

      "diff": null
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440101",
      "url": "/page-2",
      "originalUrl": "https://example.com/page-2",
      "status": "COMPLETED",
      "httpStatus": 200,
      "capturedAt": "2025-01-07T10:01:05Z",

      "seoData": {
        "title": "Changed Page Title",
        "metaDescription": "New description",
        "canonical": "https://example.com/page-2",
        "robots": "index, follow",
        "h1": ["Changed Heading"],
        "lang": "en"
      },

      "httpHeaders": {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-cache"
      },

      "performanceData": {
        "loadTimeMs": 1890,
        "requestCount": 52,
        "totalSizeBytes": 2800000
      },

      "artifacts": {
        "screenshotUrl": "/api/v1/artifacts/page-101/screenshot",
        "diffImageUrl": "/api/v1/artifacts/page-101/diff",
        "harUrl": "/api/v1/artifacts/page-101/har",
        "htmlUrl": "/api/v1/artifacts/page-101/html"
      },

      "diff": {
        "summary": {
          "totalChanges": 5,
          "criticalChanges": 1,
          "changesByType": {
            "SEO": 2,
            "VISUAL": 1,
            "HEADERS": 1,
            "PERFORMANCE": 1
          },
          "visualDiffPercentage": 0.023,
          "thresholdExceeded": true
        },
        "seoChanges": [
          {
            "field": "title",
            "severity": "CRITICAL",
            "baselineValue": "Original Title",
            "currentValue": "Changed Page Title"
          },
          {
            "field": "metaDescription",
            "severity": "WARNING",
            "baselineValue": "Original description",
            "currentValue": "New description"
          }
        ],
        "headerChanges": [
          {
            "headerName": "cache-control",
            "severity": "INFO",
            "baselineValue": "max-age=3600",
            "currentValue": "no-cache"
          }
        ],
        "performanceChanges": [
          {
            "metric": "loadTime",
            "severity": "WARNING",
            "baselineValue": 1250,
            "currentValue": 1890,
            "changePercentage": 51.2
          }
        ],
        "visualDiff": {
          "diffPercentage": 0.023,
          "diffPixels": 4520,
          "thresholdExceeded": true,
          "baselineScreenshotUrl": "/api/v1/artifacts/page-101/baseline-screenshot",
          "diffImageUrl": "/api/v1/artifacts/page-101/diff"
        }
      }
    }
  ],

  "pagination": {
    "totalPages": 25,
    "limit": 100,
    "offset": 0,
    "hasMore": false
  }
}
```

**Status Values:**
- `PENDING` - Task queued, not started
- `IN_PROGRESS` - Scan/crawl is running
- `INTERRUPTED` - Scan was interrupted, can be resumed
- `COMPLETED` - Scan finished successfully
- `FAILED` - Scan failed (see error field)

---

## Artifact Endpoints

Binary artifacts are accessed by page ID. For comparison runs, baseline artifacts are also available.

### GET /artifacts/:pageId/screenshot

Get current screenshot for a page.

**Response: 200 OK**

```
Content-Type: image/png
Content-Disposition: inline; filename="screenshot.png"

<binary PNG data>
```

---

### GET /artifacts/:pageId/baseline-screenshot

Get baseline screenshot for comparison.

**Response: 200 OK**

```
Content-Type: image/png
```

**Response: 404 Not Found** (if no baseline exists)

---

### GET /artifacts/:pageId/diff

Get visual diff image between baseline and current.

**Response: 200 OK**

```
Content-Type: image/png
Content-Disposition: inline; filename="diff.png"

<binary PNG data>
```

**Response: 404 Not Found** (if no diff exists or no changes)

---

### GET /artifacts/:pageId/har

Get HAR file for a page.

**Response: 200 OK**

```
Content-Type: application/json
Content-Disposition: attachment; filename="page.har"

<HAR JSON data>
```

**Response: 404 Not Found** (if HAR not collected)

---

### GET /artifacts/:pageId/html

Get captured HTML for a page.

**Response: 200 OK**

```
Content-Type: text/html; charset=utf-8

<HTML content>
```

---

## API Summary Table

| Method | Endpoint | Description | Scenario |
|--------|----------|-------------|----------|
| POST | `/scans` | Create scan (`crawl: false` = single page, `crawl: true` = full crawl) | 1, 2 |
| GET | `/projects/:projectId` | Get project with status, pages, diffs | 3 |
| GET | `/artifacts/:pageId/screenshot` | Get screenshot | 3 |
| GET | `/artifacts/:pageId/baseline-screenshot` | Get baseline screenshot | 3 |
| GET | `/artifacts/:pageId/diff` | Get diff image | 3 |
| GET | `/artifacts/:pageId/har` | Get HAR file | 3 |
| GET | `/artifacts/:pageId/html` | Get HTML | 3 |
