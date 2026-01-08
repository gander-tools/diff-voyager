# TDD Test Plan

## Testing Philosophy

All development follows Test-Driven Development (TDD):
1. **Red**: Write a failing test that defines expected behavior
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code while keeping tests green

## Test Framework

- **Vitest**: Primary test framework (already configured)
- **Supertest**: HTTP endpoint testing
- **Mock Server**: Custom HTTP server serving fabricated HTML documents

## Test Directory Structure

```
packages/backend/
├── src/
│   ├── api/
│   ├── comparison/
│   ├── crawler/
│   ├── queue/
│   └── storage/
└── tests/
    ├── unit/
    │   ├── comparison/
    │   │   ├── seo-comparison.test.ts
    │   │   ├── visual-comparison.test.ts
    │   │   ├── header-comparison.test.ts
    │   │   └── performance-comparison.test.ts
    │   ├── queue/
    │   │   ├── task-queue.test.ts
    │   │   └── page-task.test.ts
    │   ├── storage/
    │   │   ├── project-repository.test.ts
    │   │   ├── run-repository.test.ts
    │   │   ├── page-repository.test.ts
    │   │   └── snapshot-repository.test.ts
    │   └── domain/
    │       ├── url-normalizer.test.ts
    │       └── diff-calculator.test.ts
    ├── integration/
    │   ├── api/
    │   │   ├── scan-endpoints.test.ts
    │   │   ├── project-endpoints.test.ts
    │   │   ├── run-endpoints.test.ts
    │   │   ├── page-endpoints.test.ts
    │   │   └── artifact-endpoints.test.ts
    │   ├── crawler/
    │   │   └── page-crawler.test.ts
    │   └── workflow/
    │       ├── single-page-workflow.test.ts
    │       └── crawl-workflow.test.ts
    ├── fixtures/
    │   ├── html/
    │   │   ├── baseline/
    │   │   └── changed/
    │   ├── screenshots/
    │   └── har/
    └── helpers/
        ├── mock-server.ts
        ├── test-db.ts
        └── factories.ts
```

---

## Mock Server Architecture

### Purpose

The Mock Server serves controlled HTML documents that contain known differences, enabling precise verification of diff detection logic.

### Implementation

```typescript
// packages/backend/tests/helpers/mock-server.ts

import { createServer, Server, IncomingMessage, ServerResponse } from 'http';

export interface MockRoute {
  path: string;
  method?: 'GET' | 'POST';
  status?: number;
  headers?: Record<string, string>;
  body: string | (() => string);
  delay?: number;
}

export interface MockServerConfig {
  port?: number;
  routes: MockRoute[];
}

export class MockServer {
  private server: Server | null = null;
  private routes: Map<string, MockRoute> = new Map();
  private requestLog: Array<{ method: string; path: string; timestamp: Date }> = [];

  constructor(private config: MockServerConfig) {
    for (const route of config.routes) {
      this.routes.set(`${route.method || 'GET'}:${route.path}`, route);
    }
  }

  async start(): Promise<string> {
    // Returns base URL like http://localhost:3456
  }

  async stop(): Promise<void> {
    // Graceful shutdown
  }

  getRequestLog(): Array<{ method: string; path: string; timestamp: Date }> {
    return [...this.requestLog];
  }

  clearRequestLog(): void {
    this.requestLog = [];
  }

  updateRoute(path: string, body: string): void {
    // Update route content dynamically
  }
}
```

### HTML Fixtures Strategy

```typescript
// packages/backend/tests/fixtures/html/index.ts

export const HTML_FIXTURES = {
  // Base document for all tests
  baseline: {
    simple: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Test Page Title</title>
        <meta name="description" content="Test description">
        <link rel="canonical" href="http://localhost:3456/page">
        <meta name="robots" content="index, follow">
      </head>
      <body>
        <h1>Main Heading</h1>
        <h2>Subheading One</h2>
        <p>Content paragraph.</p>
      </body>
      </html>
    `,
  },

  // SEO changes
  seoChanges: {
    titleChanged: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Changed Page Title</title>
        <!-- rest same as baseline -->
      </head>
      </html>
    `,
    metaDescriptionChanged: `...`,
    canonicalChanged: `...`,
    robotsChanged: `...`,
    h1Changed: `...`,
    h1Missing: `...`,
    langChanged: `...`,
  },

  // Header differences (set via MockServer route config)
  headerChanges: {
    cacheControlChanged: { headers: { 'cache-control': 'no-cache' } },
    contentTypeChanged: { headers: { 'content-type': 'text/html; charset=iso-8859-1' } },
    newHeader: { headers: { 'x-custom-header': 'value' } },
    removedHeader: { headers: {} }, // Missing header from baseline
  },

  // HTTP status changes
  statusChanges: {
    notFound: { status: 404 },
    serverError: { status: 500 },
    redirect: { status: 301, headers: { 'location': '/new-page' } },
  },

  // Content changes
  contentChanges: {
    textChanged: `...content with different paragraph text...`,
    structureChanged: `...content with different DOM structure...`,
    elementAdded: `...content with additional elements...`,
    elementRemoved: `...content with missing elements...`,
  },

  // Edge cases
  edgeCases: {
    emptyDocument: ``,
    malformedHtml: `<html><head><title>Broken`,
    largeDocument: generateLargeHtml(10000), // 10KB+ content
    unicodeContent: `...content with émojis 🎉 and spëcial characters...`,
  },
};
```

---

## Unit Tests

### 1. SEO Comparison Tests

```typescript
// packages/backend/tests/unit/comparison/seo-comparison.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MockServer } from '../../helpers/mock-server';
import { HTML_FIXTURES } from '../../fixtures/html';
import { SeoComparator } from '../../../src/comparison/seo-comparator';
import { SeoData } from '@diff-voyager/shared';

describe('SeoComparator', () => {
  describe('extractSeoData', () => {
    it('should extract title from HTML', async () => {
      const html = HTML_FIXTURES.baseline.simple;
      const seo = SeoComparator.extractSeoData(html);
      expect(seo.title).toBe('Test Page Title');
    });

    it('should extract meta description', async () => {
      const html = HTML_FIXTURES.baseline.simple;
      const seo = SeoComparator.extractSeoData(html);
      expect(seo.metaDescription).toBe('Test description');
    });

    it('should extract canonical URL', async () => { ... });
    it('should extract robots directive', async () => { ... });
    it('should extract all H1 headings', async () => { ... });
    it('should extract all H2 headings', async () => { ... });
    it('should extract lang attribute', async () => { ... });
    it('should handle missing title gracefully', async () => { ... });
    it('should handle missing meta description', async () => { ... });
    it('should handle multiple H1 tags', async () => { ... });
  });

  describe('compareSeoData', () => {
    it('should detect title change', async () => {
      const baseline = SeoComparator.extractSeoData(HTML_FIXTURES.baseline.simple);
      const current = SeoComparator.extractSeoData(HTML_FIXTURES.seoChanges.titleChanged);

      const result = SeoComparator.compare(baseline, current);

      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].field).toBe('title');
      expect(result.changes[0].severity).toBe('CRITICAL');
      expect(result.changes[0].baselineValue).toBe('Test Page Title');
      expect(result.changes[0].currentValue).toBe('Changed Page Title');
    });

    it('should detect meta description change', async () => { ... });
    it('should detect canonical URL change', async () => { ... });
    it('should detect robots directive change', async () => { ... });
    it('should detect H1 change', async () => { ... });
    it('should detect missing H1 as critical', async () => { ... });
    it('should detect lang attribute change', async () => { ... });
    it('should return empty changes for identical SEO', async () => { ... });
    it('should classify title removal as critical', async () => { ... });
    it('should classify description change as warning', async () => { ... });
  });
});
```

### 2. Visual Comparison Tests

```typescript
// packages/backend/tests/unit/comparison/visual-comparison.test.ts

import { describe, it, expect } from 'vitest';
import { VisualComparator } from '../../../src/comparison/visual-comparator';
import { loadTestScreenshot } from '../../helpers/fixtures';

describe('VisualComparator', () => {
  describe('compare', () => {
    it('should return 0% diff for identical images', async () => {
      const baseline = await loadTestScreenshot('baseline/page1.png');
      const current = await loadTestScreenshot('baseline/page1.png');

      const result = await VisualComparator.compare(baseline, current);

      expect(result.diffPercentage).toBe(0);
      expect(result.diffPixels).toBe(0);
      expect(result.thresholdExceeded).toBe(false);
    });

    it('should detect pixel differences', async () => {
      const baseline = await loadTestScreenshot('baseline/page1.png');
      const current = await loadTestScreenshot('changed/page1-color-change.png');

      const result = await VisualComparator.compare(baseline, current);

      expect(result.diffPercentage).toBeGreaterThan(0);
      expect(result.diffPixels).toBeGreaterThan(0);
    });

    it('should respect threshold setting', async () => {
      const baseline = await loadTestScreenshot('baseline/page1.png');
      const current = await loadTestScreenshot('changed/page1-minor-change.png');

      const lowThreshold = await VisualComparator.compare(baseline, current, { threshold: 0.001 });
      const highThreshold = await VisualComparator.compare(baseline, current, { threshold: 0.1 });

      expect(lowThreshold.thresholdExceeded).toBe(true);
      expect(highThreshold.thresholdExceeded).toBe(false);
    });

    it('should generate diff image buffer', async () => {
      const baseline = await loadTestScreenshot('baseline/page1.png');
      const current = await loadTestScreenshot('changed/page1-color-change.png');

      const result = await VisualComparator.compare(baseline, current, { generateDiff: true });

      expect(result.diffImageBuffer).toBeDefined();
      expect(result.diffImageBuffer?.length).toBeGreaterThan(0);
    });

    it('should handle different image sizes', async () => { ... });
    it('should handle transparent pixels', async () => { ... });
  });
});
```

### 3. Header Comparison Tests

```typescript
// packages/backend/tests/unit/comparison/header-comparison.test.ts

import { describe, it, expect } from 'vitest';
import { HeaderComparator } from '../../../src/comparison/header-comparator';

describe('HeaderComparator', () => {
  describe('compare', () => {
    it('should detect header value change', async () => {
      const baseline = { 'cache-control': 'max-age=3600' };
      const current = { 'cache-control': 'no-cache' };

      const result = HeaderComparator.compare(baseline, current);

      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].headerName).toBe('cache-control');
      expect(result.changes[0].baselineValue).toBe('max-age=3600');
      expect(result.changes[0].currentValue).toBe('no-cache');
    });

    it('should detect new header', async () => {
      const baseline = {};
      const current = { 'x-new-header': 'value' };

      const result = HeaderComparator.compare(baseline, current);

      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].baselineValue).toBeNull();
      expect(result.changes[0].currentValue).toBe('value');
    });

    it('should detect removed header', async () => {
      const baseline = { 'x-old-header': 'value' };
      const current = {};

      const result = HeaderComparator.compare(baseline, current);

      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].baselineValue).toBe('value');
      expect(result.changes[0].currentValue).toBeNull();
    });

    it('should ignore case differences in header names', async () => { ... });
    it('should return empty changes for identical headers', async () => { ... });
    it('should handle special headers like Set-Cookie', async () => { ... });
  });
});
```

### 4. Performance Comparison Tests

```typescript
// packages/backend/tests/unit/comparison/performance-comparison.test.ts

import { describe, it, expect } from 'vitest';
import { PerformanceComparator } from '../../../src/comparison/performance-comparator';
import { PerformanceData } from '@diff-voyager/shared';

describe('PerformanceComparator', () => {
  describe('compare', () => {
    it('should detect load time increase', async () => {
      const baseline: PerformanceData = { loadTimeMs: 1000, requestCount: 50, totalSizeBytes: 500000 };
      const current: PerformanceData = { loadTimeMs: 1500, requestCount: 50, totalSizeBytes: 500000 };

      const result = PerformanceComparator.compare(baseline, current);

      expect(result.changes).toContainEqual(expect.objectContaining({
        metric: 'loadTime',
        changePercentage: 50,
      }));
    });

    it('should detect request count increase', async () => { ... });
    it('should detect total size increase', async () => { ... });
    it('should classify significant changes as warning', async () => { ... });
    it('should ignore changes within threshold', async () => { ... });
    it('should handle missing baseline data', async () => { ... });
    it('should handle missing current data', async () => { ... });
  });
});
```

### 5. URL Normalizer Tests

```typescript
// packages/backend/tests/unit/domain/url-normalizer.test.ts

import { describe, it, expect } from 'vitest';
import { UrlNormalizer } from '../../../src/domain/url-normalizer';

describe('UrlNormalizer', () => {
  describe('normalize', () => {
    it('should remove trailing slash', async () => {
      expect(UrlNormalizer.normalize('https://example.com/page/')).toBe('/page');
    });

    it('should lowercase path', async () => {
      expect(UrlNormalizer.normalize('https://example.com/Page')).toBe('/page');
    });

    it('should remove default ports', async () => { ... });
    it('should sort query parameters', async () => { ... });
    it('should remove tracking parameters', async () => { ... });
    it('should remove fragment', async () => { ... });
    it('should handle root URL', async () => { ... });
    it('should preserve meaningful query parameters', async () => { ... });
  });
});
```

### 6. Task Queue Tests

```typescript
// packages/backend/tests/unit/queue/task-queue.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskQueue } from '../../../src/queue/task-queue';
import { createTestDb, cleanupTestDb } from '../../helpers/test-db';

describe('TaskQueue', () => {
  let queue: TaskQueue;
  let db: TestDatabase;

  beforeEach(async () => {
    db = await createTestDb();
    queue = new TaskQueue(db);
  });

  afterEach(async () => {
    await cleanupTestDb(db);
  });

  describe('enqueue', () => {
    it('should add task with PENDING status', async () => {
      const task = await queue.enqueue({
        projectId: 'proj-1',
        runId: 'run-1',
        type: 'SINGLE_PAGE',
      });

      expect(task.id).toBeDefined();
      expect(task.status).toBe('PENDING');
    });

    it('should set priority based on type', async () => { ... });
    it('should set default retry count', async () => { ... });
  });

  describe('dequeue', () => {
    it('should return highest priority pending task', async () => { ... });
    it('should mark task as IN_PROGRESS', async () => { ... });
    it('should return null when queue is empty', async () => { ... });
  });

  describe('complete', () => {
    it('should mark task as COMPLETED', async () => { ... });
    it('should set completedAt timestamp', async () => { ... });
  });

  describe('fail', () => {
    it('should increment retry count', async () => { ... });
    it('should mark as FAILED when max retries exceeded', async () => { ... });
    it('should keep as PENDING when retries remain', async () => { ... });
  });
});
```

---

## Integration Tests

### 1. API Endpoint Tests

```typescript
// packages/backend/tests/integration/api/scan-endpoints.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/api/app';
import { MockServer } from '../../helpers/mock-server';
import { HTML_FIXTURES } from '../../fixtures/html';
import { cleanupTestEnvironment, setupTestEnvironment } from '../../helpers/test-env';

describe('POST /api/v1/scans/single-page', () => {
  let app: Express;
  let mockServer: MockServer;
  let baseUrl: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    mockServer = new MockServer({
      routes: [
        { path: '/test-page', body: HTML_FIXTURES.baseline.simple },
      ],
    });
    baseUrl = await mockServer.start();
    app = await createApp();
  });

  afterAll(async () => {
    await mockServer.stop();
    await cleanupTestEnvironment();
  });

  it('should create scan task and return 202', async () => {
    const response = await request(app)
      .post('/api/v1/scans/single-page')
      .send({ url: `${baseUrl}/test-page` })
      .expect(202);

    expect(response.body.taskId).toBeDefined();
    expect(response.body.projectId).toBeDefined();
    expect(response.body.runId).toBeDefined();
    expect(response.body.status).toBe('PENDING');
    expect(response.body.statusUrl).toContain('/tasks/');
  });

  it('should validate URL is required', async () => {
    const response = await request(app)
      .post('/api/v1/scans/single-page')
      .send({})
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should validate URL format', async () => {
    const response = await request(app)
      .post('/api/v1/scans/single-page')
      .send({ url: 'not-a-url' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should accept optional configuration', async () => {
    const response = await request(app)
      .post('/api/v1/scans/single-page')
      .send({
        url: `${baseUrl}/test-page`,
        name: 'Custom Name',
        profile: 'FULL',
        viewport: { width: 1280, height: 720 },
      })
      .expect(202);

    expect(response.body.taskId).toBeDefined();
  });
});
```

### 2. Crawler Integration Tests

```typescript
// packages/backend/tests/integration/crawler/page-crawler.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MockServer } from '../../helpers/mock-server';
import { HTML_FIXTURES } from '../../fixtures/html';
import { PageCrawler } from '../../../src/crawler/page-crawler';

describe('PageCrawler', () => {
  let mockServer: MockServer;
  let baseUrl: string;

  beforeAll(async () => {
    mockServer = new MockServer({
      routes: [
        { path: '/', body: HTML_FIXTURES.baseline.simple },
        { path: '/page-1', body: HTML_FIXTURES.baseline.simple },
        {
          path: '/page-with-links',
          body: `
            <html>
              <body>
                <a href="/page-1">Link 1</a>
                <a href="/page-2">Link 2</a>
              </body>
            </html>
          `
        },
      ],
    });
    baseUrl = await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  describe('capturePage', () => {
    it('should capture HTML content', async () => {
      const crawler = new PageCrawler();
      const result = await crawler.capturePage(`${baseUrl}/page-1`);

      expect(result.html).toContain('<title>Test Page Title</title>');
      expect(result.htmlHash).toBeDefined();
    });

    it('should capture HTTP status', async () => {
      const result = await new PageCrawler().capturePage(`${baseUrl}/page-1`);
      expect(result.httpStatus).toBe(200);
    });

    it('should extract SEO data', async () => {
      const result = await new PageCrawler().capturePage(`${baseUrl}/page-1`);

      expect(result.seoData.title).toBe('Test Page Title');
      expect(result.seoData.metaDescription).toBe('Test description');
      expect(result.seoData.h1).toContain('Main Heading');
    });

    it('should capture screenshot', async () => {
      const result = await new PageCrawler().capturePage(`${baseUrl}/page-1`);

      expect(result.screenshotBuffer).toBeDefined();
      expect(result.screenshotBuffer.length).toBeGreaterThan(0);
    });

    it('should capture HTTP headers', async () => {
      const result = await new PageCrawler().capturePage(`${baseUrl}/page-1`);

      expect(result.headers).toBeDefined();
      expect(result.headers['content-type']).toBeDefined();
    });

    it('should handle 404 pages', async () => {
      mockServer.updateRoute('/not-found', { status: 404, body: 'Not Found' });
      const result = await new PageCrawler().capturePage(`${baseUrl}/not-found`);

      expect(result.httpStatus).toBe(404);
    });

    it('should capture redirect chain', async () => {
      mockServer.updateRoute('/redirect', {
        status: 301,
        headers: { 'location': '/page-1' },
        body: ''
      });
      const result = await new PageCrawler().capturePage(`${baseUrl}/redirect`);

      expect(result.redirectChain.length).toBeGreaterThan(0);
    });
  });

  describe('crawl', () => {
    it('should discover linked pages', async () => {
      const crawler = new PageCrawler();
      const results: string[] = [];

      await crawler.crawl(`${baseUrl}/page-with-links`, {
        onPageComplete: (result) => results.push(result.url),
      });

      expect(results).toContain(`${baseUrl}/page-with-links`);
      expect(results).toContain(`${baseUrl}/page-1`);
    });

    it('should respect maxPages limit', async () => { ... });
    it('should respect exclude patterns', async () => { ... });
    it('should not crawl external domains', async () => { ... });
  });
});
```

### 3. Workflow Integration Tests

```typescript
// packages/backend/tests/integration/workflow/single-page-workflow.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/api/app';
import { MockServer } from '../../helpers/mock-server';
import { HTML_FIXTURES } from '../../fixtures/html';
import { waitForTaskCompletion } from '../../helpers/async';

describe('Single Page Scan Workflow', () => {
  let app: Express;
  let mockServer: MockServer;
  let baseUrl: string;

  beforeAll(async () => {
    mockServer = new MockServer({
      routes: [
        { path: '/page', body: HTML_FIXTURES.baseline.simple },
      ],
    });
    baseUrl = await mockServer.start();
    app = await createApp();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  it('should complete full single-page scan workflow', async () => {
    // Step 1: Create scan
    const createResponse = await request(app)
      .post('/api/v1/scans/single-page')
      .send({ url: `${baseUrl}/page` })
      .expect(202);

    const { taskId, projectId, runId } = createResponse.body;

    // Step 2: Wait for completion
    await waitForTaskCompletion(app, taskId);

    // Step 3: Verify task completed
    const taskResponse = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .expect(200);

    expect(taskResponse.body.status).toBe('COMPLETED');
    expect(taskResponse.body.progress.completedPages).toBe(1);

    // Step 4: Verify project created
    const projectResponse = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .expect(200);

    expect(projectResponse.body.project.baseUrl).toBe(baseUrl);
    expect(projectResponse.body.baseline).toBeDefined();

    // Step 5: Verify page captured
    const pagesResponse = await request(app)
      .get(`/api/v1/runs/${runId}/pages`)
      .expect(200);

    expect(pagesResponse.body.items).toHaveLength(1);
    expect(pagesResponse.body.items[0].status).toBe('COMPLETED');

    // Step 6: Verify artifacts accessible
    const pageId = pagesResponse.body.items[0].id;
    const pageResponse = await request(app)
      .get(`/api/v1/pages/${pageId}`)
      .expect(200);

    expect(pageResponse.body.snapshot.seoData.title).toBe('Test Page Title');

    // Step 7: Verify screenshot accessible
    const snapshotId = pageResponse.body.snapshot.id;
    await request(app)
      .get(`/api/v1/artifacts/${snapshotId}/screenshot`)
      .expect(200)
      .expect('Content-Type', /image\/png/);
  });
});
```

### 4. Diff Detection Workflow Tests

```typescript
// packages/backend/tests/integration/workflow/diff-detection-workflow.test.ts

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/api/app';
import { MockServer } from '../../helpers/mock-server';
import { HTML_FIXTURES } from '../../fixtures/html';
import { waitForTaskCompletion } from '../../helpers/async';

describe('Diff Detection Workflow', () => {
  let app: Express;
  let mockServer: MockServer;
  let baseUrl: string;

  beforeAll(async () => {
    mockServer = new MockServer({
      routes: [
        { path: '/page', body: HTML_FIXTURES.baseline.simple },
      ],
    });
    baseUrl = await mockServer.start();
    app = await createApp();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  it('should detect SEO title change between runs', async () => {
    // Step 1: Create baseline with original content
    const baseline = await request(app)
      .post('/api/v1/scans/single-page')
      .send({ url: `${baseUrl}/page` });

    await waitForTaskCompletion(app, baseline.body.taskId);
    const projectId = baseline.body.projectId;

    // Step 2: Update mock server with changed title
    mockServer.updateRoute('/page', HTML_FIXTURES.seoChanges.titleChanged);

    // Step 3: Create comparison run
    const comparison = await request(app)
      .post(`/api/v1/projects/${projectId}/runs`)
      .send({});

    await waitForTaskCompletion(app, comparison.body.taskId);

    // Step 4: Verify diff detected
    const pages = await request(app)
      .get(`/api/v1/runs/${comparison.body.runId}/pages?changedOnly=true`);

    expect(pages.body.items).toHaveLength(1);
    expect(pages.body.items[0].hasChanges).toBe(true);

    // Step 5: Verify SEO change details
    const diff = await request(app)
      .get(`/api/v1/pages/${pages.body.items[0].id}/diff?runId=${comparison.body.runId}`);

    expect(diff.body.seoChanges).toContainEqual(expect.objectContaining({
      field: 'title',
      baselineValue: 'Test Page Title',
      currentValue: 'Changed Page Title',
    }));
  });

  it('should detect header changes', async () => { ... });
  it('should detect visual differences', async () => { ... });
  it('should detect HTTP status changes', async () => { ... });
  it('should detect performance regressions', async () => { ... });
});
```

---

## Test Helpers

### Test Database Helper

```typescript
// packages/backend/tests/helpers/test-db.ts

import { Database } from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';

export async function createTestDb(): Promise<Database> {
  const dbPath = path.join(os.tmpdir(), `diff-voyager-test-${uuid()}.db`);
  const db = new Database(dbPath);
  await runMigrations(db);
  return db;
}

export async function cleanupTestDb(db: Database): Promise<void> {
  const dbPath = db.name;
  db.close();
  fs.unlinkSync(dbPath);
}
```

### Factories

```typescript
// packages/backend/tests/helpers/factories.ts

import { v4 as uuid } from 'uuid';
import { Project, Run, Page, PageSnapshot } from '@diff-voyager/shared';

export function createProject(overrides: Partial<Project> = {}): Project {
  return {
    id: uuid(),
    name: 'Test Project',
    baseUrl: 'http://localhost:3456',
    config: {
      viewport: { width: 1920, height: 1080 },
      visualDiffThreshold: 0.01,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createRun(overrides: Partial<Run> = {}): Run { ... }
export function createPage(overrides: Partial<Page> = {}): Page { ... }
export function createSnapshot(overrides: Partial<PageSnapshot> = {}): PageSnapshot { ... }
```

### Async Helpers

```typescript
// packages/backend/tests/helpers/async.ts

export async function waitForTaskCompletion(
  app: Express,
  taskId: string,
  timeoutMs: number = 30000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const response = await request(app).get(`/api/v1/tasks/${taskId}`);

    if (response.body.status === 'COMPLETED') return;
    if (response.body.status === 'FAILED') {
      throw new Error(`Task failed: ${response.body.errorMessage}`);
    }

    await sleep(100);
  }

  throw new Error(`Task ${taskId} did not complete within ${timeoutMs}ms`);
}
```

---

## Test Execution

### Commands

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run specific test file
npm run test:backend -- tests/unit/comparison/seo-comparison.test.ts

# Run tests in watch mode
npm run test:backend -- --watch

# Run tests with coverage
npm run test:backend -- --coverage

# Run integration tests only
npm run test:backend -- tests/integration/
```

### CI Configuration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run setup
      - run: npm test
```

---

## Coverage Goals

| Category | Target |
|----------|--------|
| Unit Tests | 90% line coverage |
| Integration Tests | 80% endpoint coverage |
| Critical Paths | 100% coverage |

Critical paths requiring 100% coverage:
- SEO extraction and comparison
- Visual diff calculation
- Task queue operations
- API request validation
- Error handling paths
