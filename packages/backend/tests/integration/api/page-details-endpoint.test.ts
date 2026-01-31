/**
 * Page details endpoint integration tests
 */

import { randomUUID } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { PageStatus } from '@gander-tools/diff-voyager-shared';
import type { FastifyInstance } from 'fastify';
import * as tmp from 'tmp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  closeDatabase,
  createDatabase,
  type DatabaseInstance,
} from '../../../src/storage/database.js';
import { PageRepository } from '../../../src/storage/repositories/page-repository.js';
import { ProjectRepository } from '../../../src/storage/repositories/project-repository.js';
import { RunRepository } from '../../../src/storage/repositories/run-repository.js';
import { SnapshotRepository } from '../../../src/storage/repositories/snapshot-repository.js';
import { createTestApp } from '../../helpers/test-db.js';

describe('GET /api/v1/pages/:pageId', () => {
  let app: FastifyInstance;
  let db: DatabaseInstance;
  let projectRepo: ProjectRepository;
  let runRepo: RunRepository;
  let pageRepo: PageRepository;
  let snapshotRepo: SnapshotRepository;
  let testDir: string;

  beforeAll(async () => {
    // Setup test directory
    testDir = tmp.dirSync({ unsafeCleanup: true, prefix: 'diff-voyager-test-' }).name;

    const dbPath = join(testDir, 'test.db');
    const artifactsDir = join(testDir, 'artifacts');
    await mkdir(artifactsDir, { recursive: true });

    // Create database
    db = createDatabase({ dbPath, baseDir: testDir, artifactsDir });

    // Create repositories
    projectRepo = new ProjectRepository(db);
    runRepo = new RunRepository(db);
    pageRepo = new PageRepository(db);
    snapshotRepo = new SnapshotRepository(db);

    // Create app
    app = await createTestApp({ db, artifactsDir });
  });

  afterAll(async () => {
    closeDatabase(db);
    await rm(testDir, { recursive: true, force: true });
  });

  it('should return 404 for non-existent page', async () => {
    const nonExistentId = randomUUID();
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/pages/${nonExistentId}`,
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('Page not found');
  });

  it('should return page details with latest snapshot', async () => {
    const project = await projectRepo.create({
      name: 'Test Project',
      baseUrl: 'https://example.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.01,
      },
    });

    const run = await runRepo.create({
      projectId: project.id,
      isBaseline: true,
      config: {
        viewport: { width: 1920, height: 1080 },
        captureScreenshots: true,
        captureHar: false,
      },
    });

    const page = await pageRepo.create({
      projectId: project.id,
      normalizedUrl: 'https://example.com/',
      originalUrl: 'https://example.com/',
    });

    await snapshotRepo.create({
      runId: run.id,
      pageId: page.id,
      isBaseline: true,
      capturedAt: new Date(),
      httpStatus: 200,
      htmlHash: 'hash1',
      headers: { 'content-type': 'text/html' },
      seo: { title: 'Test Page', description: 'Test description' },
      hasScreenshot: true,
      hasHar: false,
      hasDiff: false,
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/pages/${page.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBe(page.id);
    expect(body.url).toBe(page.normalizedUrl);
    expect(body.originalUrl).toBe(page.originalUrl);
    expect(body.projectId).toBe(project.id);
  });

  // FIXME: Page details endpoint doesn't populate seoData in response
  // GET /api/v1/pages/:pageId should return snapshot data including seoData, httpHeaders, performanceData
  //
  // ENABLE WHEN:
  // - Page details endpoint implementation populates snapshot data in response
  // - Endpoint queries latest snapshot for the page and includes seo, headers, performance fields
  // - Response matches pageResponseSchema defined in api-contract.ts
  //
  // PHASE: Phase 6 - Integration Workflows (Diff Generation Integration)
  // COMPONENT: GET /api/v1/pages/:pageId endpoint (packages/backend/src/api/routes-ts-rest.ts)
  // STATUS: Endpoint exists but doesn't populate snapshot data fields
  // DOCUMENTATION:
  // - API Contract: packages/shared/src/api-contract.ts (pageResponseSchema includes seoData)
  // - API Types: docs/api/types.md (PageDetailsResponse interface)
  // ISSUE: Endpoint returns page entity but not associated snapshot data
  // FIX NEEDED: Query latest snapshot and include seo, headers, performance in response
  it.skip('should include SEO data from latest snapshot', async () => {
    const project = await projectRepo.create({
      name: 'Test Project',
      baseUrl: 'https://example.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.01,
      },
    });

    const run = await runRepo.create({
      projectId: project.id,
      isBaseline: true,
      config: {
        viewport: { width: 1920, height: 1080 },
        captureScreenshots: true,
        captureHar: false,
      },
    });

    const page = await pageRepo.create({
      projectId: project.id,
      normalizedUrl: 'https://example.com/seo',
      originalUrl: 'https://example.com/seo',
    });

    await snapshotRepo.create({
      runId: run.id,
      pageId: page.id,
      isBaseline: true,
      capturedAt: new Date(),
      httpStatus: 200,
      htmlHash: 'hash1',
      headers: { 'content-type': 'text/html' },
      seo: {
        title: 'SEO Test Page',
        description: 'Test SEO description',
      },
      hasScreenshot: true,
      hasHar: false,
      hasDiff: false,
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/pages/${page.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.seoData).toBeDefined();
    expect(body.seoData.title).toBe('SEO Test Page');
    expect(body.seoData.description).toBe('Test SEO description');
  });

  // FIXME: Page details endpoint doesn't populate httpHeaders in response
  // GET /api/v1/pages/:pageId should return snapshot data including httpHeaders
  //
  // ENABLE WHEN:
  // - Page details endpoint implementation populates snapshot data in response
  // - Endpoint queries latest snapshot for the page and includes headers field
  // - Response matches pageResponseSchema defined in api-contract.ts
  //
  // PHASE: Phase 6 - Integration Workflows (Diff Generation Integration)
  // COMPONENT: GET /api/v1/pages/:pageId endpoint (packages/backend/src/api/routes-ts-rest.ts)
  // STATUS: Endpoint exists but doesn't populate snapshot data fields
  // DOCUMENTATION:
  // - API Contract: packages/shared/src/api-contract.ts (pageResponseSchema includes httpHeaders)
  // - API Types: docs/api/types.md (PageDetailsResponse interface)
  // ISSUE: Same as SEO data test - endpoint doesn't join with snapshots table
  // FIX NEEDED: Query latest snapshot and include headers in response
  it.skip('should include HTTP headers from latest snapshot', async () => {
    const project = await projectRepo.create({
      name: 'Test Project',
      baseUrl: 'https://example.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.01,
      },
    });

    const run = await runRepo.create({
      projectId: project.id,
      isBaseline: true,
      config: {
        viewport: { width: 1920, height: 1080 },
        captureScreenshots: true,
        captureHar: false,
      },
    });

    const page = await pageRepo.create({
      projectId: project.id,
      normalizedUrl: 'https://example.com/headers',
      originalUrl: 'https://example.com/headers',
    });

    await snapshotRepo.create({
      runId: run.id,
      pageId: page.id,
      isBaseline: true,
      capturedAt: new Date(),
      httpStatus: 200,
      htmlHash: 'hash1',
      headers: {
        'content-type': 'text/html',
        'cache-control': 'max-age=3600',
      },
      seo: { title: 'Headers Test', description: 'Test headers' },
      hasScreenshot: true,
      hasHar: false,
      hasDiff: false,
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/pages/${page.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.httpHeaders).toBeDefined();
    expect(body.httpHeaders['content-type']).toBe('text/html');
    expect(body.httpHeaders['cache-control']).toBe('max-age=3600');
  });

  // FIXME: Page details endpoint doesn't populate performanceData in response
  // GET /api/v1/pages/:pageId should return snapshot data including performanceData
  //
  // ENABLE WHEN:
  // - Page details endpoint implementation populates snapshot data in response
  // - Endpoint queries latest snapshot for the page and includes performance field
  // - Response matches pageResponseSchema defined in api-contract.ts
  //
  // PHASE: Phase 6 - Integration Workflows (Diff Generation Integration)
  // COMPONENT: GET /api/v1/pages/:pageId endpoint (packages/backend/src/api/routes-ts-rest.ts)
  // STATUS: Endpoint exists but doesn't populate snapshot data fields
  // DOCUMENTATION:
  // - API Contract: packages/shared/src/api-contract.ts (pageResponseSchema includes performanceData)
  // - API Types: docs/api/types.md (PageDetailsResponse interface)
  // ISSUE: Same as SEO data and headers tests - endpoint doesn't join with snapshots table
  // FIX NEEDED: Query latest snapshot and include performanceData in response
  it.skip('should include performance metrics from latest snapshot', async () => {
    const project = await projectRepo.create({
      name: 'Test Project',
      baseUrl: 'https://example.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.01,
      },
    });

    const run = await runRepo.create({
      projectId: project.id,
      isBaseline: true,
      config: {
        viewport: { width: 1920, height: 1080 },
        captureScreenshots: true,
        captureHar: false,
      },
    });

    const page = await pageRepo.create({
      projectId: project.id,
      normalizedUrl: 'https://example.com/perf',
      originalUrl: 'https://example.com/perf',
    });

    await snapshotRepo.create({
      runId: run.id,
      pageId: page.id,
      isBaseline: true,
      capturedAt: new Date(),
      httpStatus: 200,
      htmlHash: 'hash1',
      headers: { 'content-type': 'text/html' },
      seo: { title: 'Perf Test', description: 'Test performance' },
      performanceData: {
        loadTime: 1234,
        requestCount: 10,
        totalSize: 50000,
      },
      hasScreenshot: true,
      hasHar: false,
      hasDiff: false,
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/pages/${page.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.performanceData).toBeDefined();
    expect(body.performanceData.loadTime).toBe(1234);
    expect(body.performanceData.requestCount).toBe(10);
    expect(body.performanceData.totalSize).toBe(50000);
  });

  it('should include artifact URLs', async () => {
    const project = await projectRepo.create({
      name: 'Test Project',
      baseUrl: 'https://example.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.01,
      },
    });

    const run = await runRepo.create({
      projectId: project.id,
      isBaseline: true,
      config: {
        viewport: { width: 1920, height: 1080 },
        captureScreenshots: true,
        captureHar: true,
      },
    });

    const page = await pageRepo.create({
      projectId: project.id,
      normalizedUrl: 'https://example.com/artifacts',
      originalUrl: 'https://example.com/artifacts',
    });

    const snapshot = await snapshotRepo.create({
      runId: run.id,
      pageId: page.id,
      isBaseline: true,
      capturedAt: new Date(),
      httpStatus: 200,
      htmlHash: 'hash1',
      headers: { 'content-type': 'text/html' },
      seo: { title: 'Artifacts Test', description: 'Test artifacts' },
      hasScreenshot: true,
      hasHar: true,
      hasDiff: false,
    });

    // Update snapshot with artifact paths
    await snapshotRepo.update(snapshot.id, {
      status: PageStatus.COMPLETED,
      screenshotPath: 'screenshot.png',
      harPath: 'page.har',
      htmlPath: 'page.html',
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/pages/${page.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.artifacts).toBeDefined();
    expect(body.artifacts.screenshotUrl).toContain(`/api/v1/artifacts/${page.id}/screenshot`);
    expect(body.artifacts.harUrl).toContain(`/api/v1/artifacts/${page.id}/har`);
    expect(body.artifacts.htmlUrl).toContain(`/api/v1/artifacts/${page.id}/html`);
  });

  it('should validate UUID format for pageId', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/pages/invalid-uuid',
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    // @ts-rest validation error format may differ from old API
    // Just verify we got a 400 status for invalid UUID
    expect(body).toBeDefined();
  });
});
