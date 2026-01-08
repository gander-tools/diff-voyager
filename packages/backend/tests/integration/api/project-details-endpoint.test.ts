/**
 * Project details endpoint integration tests
 * Tests GET /api/v1/projects/:projectId with full response including pages, snapshots, and statistics
 */

import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PageStatus, RunStatus } from '@gander-tools/diff-voyager-shared';
import type { FastifyInstance } from 'fastify';
import * as tmp from 'tmp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../../src/api/app.js';
import {
  closeDatabase,
  createDatabase,
  type DatabaseInstance,
} from '../../../src/storage/database.js';
import { PageRepository } from '../../../src/storage/repositories/page-repository.js';
import { ProjectRepository } from '../../../src/storage/repositories/project-repository.js';
import { RunRepository } from '../../../src/storage/repositories/run-repository.js';
import { SnapshotRepository } from '../../../src/storage/repositories/snapshot-repository.js';

describe('GET /api/v1/projects/:projectId - Project Details', () => {
  let app: FastifyInstance;
  let db: DatabaseInstance;
  let projectRepo: ProjectRepository;
  let runRepo: RunRepository;
  let pageRepo: PageRepository;
  let snapshotRepo: SnapshotRepository;
  let testDir: string;
  let artifactsDir: string;

  beforeAll(async () => {
    // Setup test directory using secure tmp library
    testDir = tmp.dirSync({ unsafeCleanup: true, prefix: 'diff-voyager-test-' }).name;

    const dbPath = join(testDir, 'test.db');
    artifactsDir = join(testDir, 'artifacts');
    await mkdir(artifactsDir, { recursive: true });

    // Create database
    db = createDatabase({ dbPath, baseDir: testDir, artifactsDir });

    // Create repositories
    projectRepo = new ProjectRepository(db);
    runRepo = new RunRepository(db);
    pageRepo = new PageRepository(db);
    snapshotRepo = new SnapshotRepository(db, artifactsDir);

    // Create app
    app = await createApp({ db, artifactsDir });
    await app.ready();
  });

  afterAll(async () => {
    closeDatabase(db);
    await rm(testDir, { recursive: true, force: true });
  });

  it('should return 404 for non-existent project', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/non-existent-id',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Project not found');
  });

  it('should return project with no runs', async () => {
    const project = await projectRepo.create({
      name: 'Test Project No Runs',
      baseUrl: 'https://example.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.1,
        maxPages: 100,
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBe(project.id);
    expect(body.name).toBe('Test Project No Runs');
    expect(body.pages).toEqual([]);
    expect(body.statistics.totalPages).toBe(0);
    expect(body.statistics.completedPages).toBe(0);
  });

  it('should return project with run but no pages', async () => {
    const project = await projectRepo.create({
      name: 'Test Project No Pages',
      baseUrl: 'https://example.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.1,
        maxPages: 100,
      },
    });

    await runRepo.create({
      projectId: project.id,
      isBaseline: true,
      config: {
        viewport: { width: 1920, height: 1080 },
        captureScreenshots: true,
        captureHar: false,
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBe(project.id);
    expect(body.pages).toEqual([]);
    expect(body.statistics.totalPages).toBe(0);
  });

  it('should return project with pages and snapshots', async () => {
    const project = await projectRepo.create({
      name: 'Test Project With Pages',
      baseUrl: 'https://example.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.1,
        maxPages: 100,
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

    // Create page and snapshot
    const page = await pageRepo.create({
      projectId: project.id,
      normalizedUrl: 'https://example.com/',
      originalUrl: 'https://example.com/',
    });

    const snapshot = await snapshotRepo.create({
      pageId: page.id,
      runId: run.id,
    });

    await snapshotRepo.update(snapshot.id, {
      status: PageStatus.COMPLETED,
      httpStatus: 200,
      htmlHash: 'test-hash-123',
      htmlPath: '/test/html/path.html',
      seoData: {
        title: 'Example Page',
        metaDescription: 'Test description',
        h1: ['Main Heading'],
      },
      headers: {
        'content-type': 'text/html',
      },
      capturedAt: new Date(),
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBe(project.id);
    expect(body.pages).toHaveLength(1);
    expect(body.pages[0].id).toBe(page.id);
    expect(body.pages[0].status).toBe(PageStatus.COMPLETED);
    expect(body.pages[0].httpStatus).toBe(200);
    expect(body.pages[0].seoData.title).toBe('Example Page');
    expect(body.pages[0].httpHeaders['content-type']).toBe('text/html');
    expect(body.statistics.totalPages).toBe(1);
    expect(body.statistics.completedPages).toBe(1);
    expect(body.statistics.errorPages).toBe(0);
  });

  it('should include artifact URLs when artifacts exist', async () => {
    const project = await projectRepo.create({
      name: 'Test Project With Artifacts',
      baseUrl: 'https://example.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.1,
        maxPages: 100,
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
      normalizedUrl: 'https://example.com/with-artifacts',
      originalUrl: 'https://example.com/with-artifacts',
    });

    const snapshot = await snapshotRepo.create({
      pageId: page.id,
      runId: run.id,
    });

    // Create mock artifact files
    const screenshotPath = join(artifactsDir, `${page.id}-screenshot.png`);
    const harPath = join(artifactsDir, `${page.id}.har`);
    const htmlPath = join(artifactsDir, `${page.id}.html`);

    await writeFile(screenshotPath, 'mock-screenshot');
    await writeFile(harPath, 'mock-har');
    await writeFile(htmlPath, 'mock-html');

    await snapshotRepo.update(snapshot.id, {
      status: PageStatus.COMPLETED,
      httpStatus: 200,
      screenshotPath,
      harPath,
      htmlPath,
      capturedAt: new Date(),
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.pages[0].artifacts.screenshotUrl).toBe(`/api/v1/artifacts/${page.id}/screenshot`);
    expect(body.pages[0].artifacts.harUrl).toBe(`/api/v1/artifacts/${page.id}/har`);
    expect(body.pages[0].artifacts.htmlUrl).toBe(`/api/v1/artifacts/${page.id}/html`);
  });

  it('should respect includePages=false query parameter', async () => {
    const project = await projectRepo.create({
      name: 'Test Project Include Pages False',
      baseUrl: 'https://example.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.1,
        maxPages: 100,
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
      normalizedUrl: 'https://example.com/test',
      originalUrl: 'https://example.com/test',
    });

    await snapshotRepo.create({
      pageId: page.id,
      runId: run.id,
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}?includePages=false`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.pages).toEqual([]);
    // But statistics should still show total pages
    expect(body.statistics.totalPages).toBe(1);
  });

  it('should handle pagination with pageLimit', async () => {
    const project = await projectRepo.create({
      name: 'Test Project Pagination',
      baseUrl: 'https://example.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.1,
        maxPages: 100,
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

    // Create 5 pages
    for (let i = 0; i < 5; i++) {
      const page = await pageRepo.create({
        projectId: project.id,
        normalizedUrl: `https://example.com/page-${i}`,
        originalUrl: `https://example.com/page-${i}`,
      });

      await snapshotRepo.create({
        pageId: page.id,
        runId: run.id,
      });
    }

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}?pageLimit=2`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.pages).toHaveLength(2);
    expect(body.pagination.totalPages).toBe(5);
    expect(body.pagination.limit).toBe(2);
    expect(body.pagination.offset).toBe(0);
    expect(body.pagination.hasMore).toBe(true);
  });

  it('should handle pagination with pageOffset', async () => {
    const project = await projectRepo.create({
      name: 'Test Project Pagination Offset',
      baseUrl: 'https://example.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.1,
        maxPages: 100,
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

    // Create 5 pages
    for (let i = 0; i < 5; i++) {
      const page = await pageRepo.create({
        projectId: project.id,
        normalizedUrl: `https://example.com/page-${i}`,
        originalUrl: `https://example.com/page-${i}`,
      });

      await snapshotRepo.create({
        pageId: page.id,
        runId: run.id,
      });
    }

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}?pageLimit=2&pageOffset=3`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.pages).toHaveLength(2);
    expect(body.pagination.totalPages).toBe(5);
    expect(body.pagination.limit).toBe(2);
    expect(body.pagination.offset).toBe(3);
    expect(body.pagination.hasMore).toBe(false); // 3 + 2 = 5, no more pages
  });

  it('should count error pages correctly in statistics', async () => {
    const project = await projectRepo.create({
      name: 'Test Project With Errors',
      baseUrl: 'https://example.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.1,
        maxPages: 100,
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

    // Create 2 completed pages
    for (let i = 0; i < 2; i++) {
      const page = await pageRepo.create({
        projectId: project.id,
        normalizedUrl: `https://example.com/ok-${i}`,
        originalUrl: `https://example.com/ok-${i}`,
      });

      const snapshot = await snapshotRepo.create({
        pageId: page.id,
        runId: run.id,
      });

      await snapshotRepo.update(snapshot.id, {
        status: PageStatus.COMPLETED,
        httpStatus: 200,
        capturedAt: new Date(),
      });
    }

    // Create 1 error page
    const errorPage = await pageRepo.create({
      projectId: project.id,
      normalizedUrl: 'https://example.com/error',
      originalUrl: 'https://example.com/error',
    });

    const errorSnapshot = await snapshotRepo.create({
      pageId: errorPage.id,
      runId: run.id,
    });

    await snapshotRepo.update(errorSnapshot.id, {
      status: PageStatus.ERROR,
      httpStatus: 500,
      errorMessage: 'Server error',
      capturedAt: new Date(),
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.statistics.totalPages).toBe(3);
    expect(body.statistics.completedPages).toBe(2);
    expect(body.statistics.errorPages).toBe(1);
    expect(body.statistics.unchangedPages).toBe(2);
  });

  it('should handle pages with no snapshot gracefully', async () => {
    const project = await projectRepo.create({
      name: 'Test Project Page No Snapshot',
      baseUrl: 'https://example.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.1,
        maxPages: 100,
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

    // Create page WITHOUT snapshot
    await pageRepo.create({
      projectId: project.id,
      normalizedUrl: 'https://example.com/no-snapshot',
      originalUrl: 'https://example.com/no-snapshot',
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.pages).toHaveLength(1);
    expect(body.pages[0].status).toBe(PageStatus.PENDING);
    expect(body.pages[0].httpStatus).toBeUndefined();
    expect(body.pages[0].capturedAt).toBeUndefined();
  });

  it('should include full project configuration in response', async () => {
    const project = await projectRepo.create({
      name: 'Test Project Config',
      description: 'Test description',
      baseUrl: 'https://example.com',
      config: {
        crawl: true,
        viewport: { width: 1280, height: 720 },
        visualDiffThreshold: 0.05,
        maxPages: 50,
      },
    });

    await projectRepo.updateStatus(project.id, RunStatus.COMPLETED);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${project.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBe(project.id);
    expect(body.name).toBe('Test Project Config');
    expect(body.description).toBe('Test description');
    expect(body.baseUrl).toBe('https://example.com');
    expect(body.status).toBe(RunStatus.COMPLETED);
    expect(body.config.crawl).toBe(true);
    expect(body.config.viewport.width).toBe(1280);
    expect(body.config.viewport.height).toBe(720);
    expect(body.config.visualDiffThreshold).toBe(0.05);
    expect(body.config.maxPages).toBe(50);
    expect(body.createdAt).toBeDefined();
    expect(body.updatedAt).toBeDefined();
  });
});
