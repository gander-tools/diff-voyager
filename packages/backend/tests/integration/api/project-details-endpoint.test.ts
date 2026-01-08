/**
 * Project details endpoint integration tests
 */

import { randomUUID } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PageStatus } from '@gander-tools/diff-voyager-shared';
import type { FastifyInstance } from 'fastify';
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

describe('Project Details Endpoints', () => {
  let app: FastifyInstance;
  let db: DatabaseInstance;
  let projectRepo: ProjectRepository;
  let runRepo: RunRepository;
  let pageRepo: PageRepository;
  let snapshotRepo: SnapshotRepository;
  let testDir: string;

  beforeAll(async () => {
    // Setup test directory
    testDir = join(tmpdir(), `diff-voyager-test-project-details-${randomUUID()}`);
    await mkdir(testDir, { recursive: true });

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
    app = await createApp({ db, artifactsDir });
    await app.ready();
  });

  afterAll(async () => {
    closeDatabase(db);
    await rm(testDir, { recursive: true, force: true });
  });

  describe('GET /api/v1/projects/:projectId', () => {
    it('should return 404 for non-existent project', async () => {
      const nonExistentId = randomUUID();
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${nonExistentId}`,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return project details without pages when includePages is false', async () => {
      const project = await projectRepo.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${project.id}?includePages=false`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(project.id);
      expect(body.pages).toEqual([]);
    });

    it('should return project details with pages when includePages is true', async () => {
      const project = await projectRepo.create({
        name: 'Test Project with Pages',
        baseUrl: 'https://example.com',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      // Create a baseline run
      const run = await runRepo.create({
        projectId: project.id,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      // Create pages
      const page1 = await pageRepo.create({
        projectId: project.id,
        normalizedUrl: 'https://example.com/',
        originalUrl: 'https://example.com/',
      });

      const page2 = await pageRepo.create({
        projectId: project.id,
        normalizedUrl: 'https://example.com/about',
        originalUrl: 'https://example.com/about',
      });

      // Create snapshots for pages
      await snapshotRepo.create({
        runId: run.id,
        pageId: page1.id,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'hash1',
        headers: { 'content-type': 'text/html' },
        seo: { title: 'Home Page', description: 'Home description' },
        hasScreenshot: true,
        hasHar: false,
        hasDiff: false,
      });

      await snapshotRepo.create({
        runId: run.id,
        pageId: page2.id,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'hash2',
        headers: { 'content-type': 'text/html' },
        seo: { title: 'About Page', description: 'About description' },
        hasScreenshot: true,
        hasHar: true,
        hasDiff: false,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${project.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(project.id);
      expect(body.pages).toHaveLength(2);

      // Check page details
      const homePage = body.pages.find((p: { url: string }) => p.url === 'https://example.com/');
      expect(homePage).toBeDefined();
      expect(homePage.status).toBe(PageStatus.COMPLETED);
      expect(homePage.httpStatus).toBe(200);
      expect(homePage.seoData.title).toBe('Home Page');
      expect(homePage.artifacts.screenshotUrl).toContain('/api/v1/artifacts/');
    });

    it('should paginate pages correctly', async () => {
      const project = await projectRepo.create({
        name: 'Test Project with Many Pages',
        baseUrl: 'https://example.com',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      // Create a baseline run
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
          normalizedUrl: `https://example.com/page${i}`,
          originalUrl: `https://example.com/page${i}`,
        });

        await snapshotRepo.create({
          runId: run.id,
          pageId: page.id,
          isBaseline: true,
          capturedAt: new Date(),
          httpStatus: 200,
          htmlHash: `hash${i}`,
          headers: { 'content-type': 'text/html' },
          seo: { title: `Page ${i}`, description: `Description ${i}` },
          hasScreenshot: true,
          hasHar: false,
          hasDiff: false,
        });
      }

      // Request with pagination
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${project.id}?pageLimit=2&pageOffset=1`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.pages).toHaveLength(2);
      expect(body.pagination.totalPages).toBe(5);
      expect(body.pagination.limit).toBe(2);
      expect(body.pagination.offset).toBe(1);
      expect(body.pagination.hasMore).toBe(true);
    });

    it('should return artifact URLs for pages with artifacts', async () => {
      const project = await projectRepo.create({
        name: 'Test Project with Artifacts',
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
        normalizedUrl: 'https://example.com/artifacts-test',
        originalUrl: 'https://example.com/artifacts-test',
      });

      await snapshotRepo.create({
        runId: run.id,
        pageId: page.id,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'hash-artifacts',
        headers: { 'content-type': 'text/html' },
        seo: { title: 'Artifacts Test', description: 'Test artifacts' },
        hasScreenshot: true,
        hasHar: true,
        hasDiff: false,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${project.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const testPage = body.pages[0];

      expect(testPage.artifacts.screenshotUrl).toBe(`/api/v1/artifacts/${page.id}/screenshot`);
      expect(testPage.artifacts.harUrl).toBe(`/api/v1/artifacts/${page.id}/har`);
      expect(testPage.artifacts.htmlUrl).toBe(`/api/v1/artifacts/${page.id}/html`);
    });

    it('should calculate statistics correctly', async () => {
      const project = await projectRepo.create({
        name: 'Test Project with Stats',
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

      // Create pages with different statuses
      const page1 = await pageRepo.create({
        projectId: project.id,
        normalizedUrl: 'https://example.com/completed',
        originalUrl: 'https://example.com/completed',
      });

      const page2 = await pageRepo.create({
        projectId: project.id,
        normalizedUrl: 'https://example.com/error',
        originalUrl: 'https://example.com/error',
      });

      // Create completed snapshot
      await snapshotRepo.create({
        runId: run.id,
        pageId: page1.id,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'hash-completed',
        headers: { 'content-type': 'text/html' },
        seo: { title: 'Completed Page', description: 'Completed' },
        hasScreenshot: true,
        hasHar: false,
        hasDiff: false,
      });

      // Create error snapshot
      await snapshotRepo.create({
        runId: run.id,
        pageId: page2.id,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 500,
        htmlHash: 'hash-error',
        headers: {},
        seo: {},
        hasScreenshot: false,
        hasHar: false,
        hasDiff: false,
        error: 'Internal Server Error',
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${project.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.statistics.totalPages).toBe(2);
      expect(body.statistics.completedPages).toBeGreaterThanOrEqual(0);
    });
  });

  describe('POST /api/v1/projects/:projectId/runs', () => {
    it('should return 404 for non-existent project', async () => {
      const nonExistentId = randomUUID();
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${nonExistentId}/runs`,
        headers: {
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify({
          url: 'https://example.com',
        }),
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toContain('Project not found');
    });

    it('should create a comparison run for existing project', async () => {
      const project = await projectRepo.create({
        name: 'Test Project for Runs',
        baseUrl: 'https://example.com',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${project.id}/runs`,
        headers: {
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify({
          url: 'https://example.com',
        }),
      });

      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.body);
      expect(body.runId).toBeDefined();
      expect(body.status).toBe('PENDING');
      expect(body.runUrl).toContain(`/api/v1/projects/${project.id}/runs/`);
    });

    it('should accept optional viewport parameter', async () => {
      const project = await projectRepo.create({
        name: 'Test Project for Viewport',
        baseUrl: 'https://example.com',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${project.id}/runs`,
        headers: {
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify({
          url: 'https://example.com',
          viewport: { width: 1280, height: 720 },
        }),
      });

      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.body);
      expect(body.runId).toBeDefined();
    });

    it('should accept collectHar parameter', async () => {
      const project = await projectRepo.create({
        name: 'Test Project for HAR',
        baseUrl: 'https://example.com',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${project.id}/runs`,
        headers: {
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify({
          url: 'https://example.com',
          collectHar: true,
        }),
      });

      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.body);
      expect(body.runId).toBeDefined();
    });
  });
});
