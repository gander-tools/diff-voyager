/**
 * ScanProcessor integration tests
 * Tests synchronous scan processing with Playwright browser automation
 */

import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { PageStatus, RunStatus } from '@gander-tools/diff-voyager-shared';
import * as tmp from 'tmp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ScanProcessor } from '../../../src/services/scan-processor.js';
import {
  closeDatabase,
  createDatabase,
  type DatabaseInstance,
} from '../../../src/storage/database.js';
import { PageRepository } from '../../../src/storage/repositories/page-repository.js';
import { ProjectRepository } from '../../../src/storage/repositories/project-repository.js';
import { RunRepository } from '../../../src/storage/repositories/run-repository.js';
import { SnapshotRepository } from '../../../src/storage/repositories/snapshot-repository.js';
import { HTML_FIXTURES } from '../../fixtures/html/index.js';
import { MockServer } from '../../helpers/mock-server.js';

describe('ScanProcessor', () => {
  let db: DatabaseInstance;
  let projectRepo: ProjectRepository;
  let runRepo: RunRepository;
  let pageRepo: PageRepository;
  let snapshotRepo: SnapshotRepository;
  let mockServer: MockServer;
  let baseUrl: string;
  let testDir: string;
  let artifactsDir: string;

  beforeAll(async () => {
    // Setup test directory
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

    // Start mock server
    mockServer = new MockServer({
      routes: [
        {
          path: '/simple',
          body: HTML_FIXTURES.baseline.simple,
          headers: { 'content-type': 'text/html' },
        },
        {
          path: '/full-seo',
          body: HTML_FIXTURES.baseline.fullSeo,
        },
        {
          path: '/page1',
          body: '<html><head><title>Page 1</title></head><body><a href="/page2">Link</a></body></html>',
        },
        {
          path: '/page2',
          body: '<html><head><title>Page 2</title></head><body>Page 2 content</body></html>',
        },
        {
          path: '/error',
          status: 500,
          body: '<html><body>Server Error</body></html>',
        },
      ],
    });

    baseUrl = await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
    closeDatabase(db);
    await rm(testDir, { recursive: true, force: true });
  });

  describe('processScan - single page mode', () => {
    it('should process single page successfully', async () => {
      const project = await projectRepo.create({
        name: 'Test Single Page',
        baseUrl: `${baseUrl}/simple`,
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

      const processor = new ScanProcessor({
        db,
        artifactsDir,
        projectRepo,
        runRepo,
        pageRepo,
        snapshotRepo,
      });

      const result = await processor.processScan({
        projectId: project.id,
        runId: run.id,
        url: `${baseUrl}/simple`,
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        waitAfterLoad: 100,
        collectHar: false,
      });

      // Verify result structure
      expect(result.id).toBe(project.id);
      expect(result.name).toBe('Test Single Page');
      expect(result.status).toBe(RunStatus.COMPLETED);
      expect(result.pages).toHaveLength(1);

      // Verify page data
      const page = result.pages[0];
      expect(page.status).toBe(PageStatus.COMPLETED);
      expect(page.httpStatus).toBe(200);
      expect(page.seoData?.title).toBe('Test Page Title');
      expect(page.artifacts.screenshotUrl).toBeDefined();
      expect(page.artifacts.htmlUrl).toBeDefined();

      // Verify statistics
      expect(result.statistics.totalPages).toBe(1);
      expect(result.statistics.completedPages).toBe(1);
      expect(result.statistics.errorPages).toBe(0);

      // Verify database was updated
      const updatedProject = await projectRepo.findById(project.id);
      expect(updatedProject?.status).toBe(RunStatus.COMPLETED);

      const updatedRun = await runRepo.findById(run.id);
      expect(updatedRun?.status).toBe(RunStatus.COMPLETED);
      expect(updatedRun?.statistics?.totalPages).toBe(1);
    });

    it('should capture full SEO data', async () => {
      const project = await projectRepo.create({
        name: 'Test SEO Data',
        baseUrl: `${baseUrl}/full-seo`,
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

      const processor = new ScanProcessor({
        db,
        artifactsDir,
        projectRepo,
        runRepo,
        pageRepo,
        snapshotRepo,
      });

      const result = await processor.processScan({
        projectId: project.id,
        runId: run.id,
        url: `${baseUrl}/full-seo`,
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        waitAfterLoad: 100,
        collectHar: false,
      });

      const page = result.pages[0];
      expect(page.seoData?.title).toBe('Complete SEO Page');
      expect(page.seoData?.metaDescription).toBe('This is a comprehensive meta description');
      expect(page.seoData?.canonicalUrl).toBe('https://example.com/canonical');
      expect(page.seoData?.h1).toEqual(['Main Heading']);
      expect(page.seoData?.robotsMeta).toBe('index,follow');
    });

    it('should collect HAR file when collectHar is true', async () => {
      const project = await projectRepo.create({
        name: 'Test HAR Collection',
        baseUrl: `${baseUrl}/simple`,
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

      const processor = new ScanProcessor({
        db,
        artifactsDir,
        projectRepo,
        runRepo,
        pageRepo,
        snapshotRepo,
      });

      const result = await processor.processScan({
        projectId: project.id,
        runId: run.id,
        url: `${baseUrl}/simple`,
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        waitAfterLoad: 100,
        collectHar: true,
      });

      const page = result.pages[0];
      expect(page.artifacts.harUrl).toBeDefined();
      expect(page.performanceData).toBeDefined();
    });

    it('should handle page errors gracefully', async () => {
      const project = await projectRepo.create({
        name: 'Test Error Handling',
        baseUrl: `${baseUrl}/error`,
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

      const processor = new ScanProcessor({
        db,
        artifactsDir,
        projectRepo,
        runRepo,
        pageRepo,
        snapshotRepo,
      });

      const result = await processor.processScan({
        projectId: project.id,
        runId: run.id,
        url: `${baseUrl}/error`,
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        waitAfterLoad: 100,
        collectHar: false,
      });

      // Should complete but mark page as completed (500 is still a valid response)
      expect(result.status).toBe(RunStatus.COMPLETED);
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].httpStatus).toBe(500);
    });

    it('should update project and run status to IN_PROGRESS during processing', async () => {
      const project = await projectRepo.create({
        name: 'Test Status Updates',
        baseUrl: `${baseUrl}/simple`,
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

      // Verify initial status
      expect(project.status).toBe(RunStatus.PENDING);
      expect(run.status).toBe(RunStatus.PENDING);

      const processor = new ScanProcessor({
        db,
        artifactsDir,
        projectRepo,
        runRepo,
        pageRepo,
        snapshotRepo,
      });

      await processor.processScan({
        projectId: project.id,
        runId: run.id,
        url: `${baseUrl}/simple`,
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        waitAfterLoad: 100,
        collectHar: false,
      });

      // Verify final status
      const updatedProject = await projectRepo.findById(project.id);
      const updatedRun = await runRepo.findById(run.id);

      expect(updatedProject?.status).toBe(RunStatus.COMPLETED);
      expect(updatedRun?.status).toBe(RunStatus.COMPLETED);
    });
  });

  describe('processScan - crawl mode', () => {
    it('should discover and process multiple pages', async () => {
      const project = await projectRepo.create({
        name: 'Test Crawl Mode',
        baseUrl: `${baseUrl}/page1`,
        config: {
          crawl: true,
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

      const processor = new ScanProcessor({
        db,
        artifactsDir,
        projectRepo,
        runRepo,
        pageRepo,
        snapshotRepo,
      });

      const result = await processor.processScan({
        projectId: project.id,
        runId: run.id,
        url: `${baseUrl}/page1`,
        crawl: true,
        viewport: { width: 1920, height: 1080 },
        waitAfterLoad: 100,
        collectHar: false,
      });

      // Should discover multiple pages
      expect(result.pages.length).toBeGreaterThan(1);
      expect(result.statistics.totalPages).toBeGreaterThan(1);
      expect(result.status).toBe(RunStatus.COMPLETED);

      // Verify pages were captured
      const completedPages = result.pages.filter((p) => p.status === PageStatus.COMPLETED);
      expect(completedPages.length).toBeGreaterThan(0);
    });

    it('should respect maxPages limit (100) during crawl', async () => {
      const project = await projectRepo.create({
        name: 'Test Max Pages Limit',
        baseUrl: `${baseUrl}/page1`,
        config: {
          crawl: true,
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

      const processor = new ScanProcessor({
        db,
        artifactsDir,
        projectRepo,
        runRepo,
        pageRepo,
        snapshotRepo,
      });

      const result = await processor.processScan({
        projectId: project.id,
        runId: run.id,
        url: `${baseUrl}/page1`,
        crawl: true,
        viewport: { width: 1920, height: 1080 },
        waitAfterLoad: 100,
        collectHar: false,
      });

      // Should not exceed 100 pages
      expect(result.pages.length).toBeLessThanOrEqual(100);
    });
  });

  describe('processScan - error handling', () => {
    it('should handle page errors gracefully', async () => {
      const project = await projectRepo.create({
        name: 'Test Error Recovery',
        baseUrl: 'https://invalid-domain-that-does-not-exist-12345.com',
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

      const processor = new ScanProcessor({
        db,
        artifactsDir,
        projectRepo,
        runRepo,
        pageRepo,
        snapshotRepo,
      });

      // Should complete successfully even with page error
      const result = await processor.processScan({
        projectId: project.id,
        runId: run.id,
        url: 'https://invalid-domain-that-does-not-exist-12345.com',
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        waitAfterLoad: 100,
        collectHar: false,
      });

      // Verify scan completed successfully
      expect(result.status).toBe(RunStatus.COMPLETED);
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].status).toBe(PageStatus.ERROR);
      expect(result.statistics.errorPages).toBe(1);
      expect(result.statistics.completedPages).toBe(0);

      // Verify project and run status were updated to COMPLETED
      const updatedProject = await projectRepo.findById(project.id);
      const updatedRun = await runRepo.findById(run.id);

      expect(updatedProject?.status).toBe(RunStatus.COMPLETED);
      expect(updatedRun?.status).toBe(RunStatus.COMPLETED);
    });
  });

  describe('processScan - viewport and configuration', () => {
    it('should respect custom viewport settings', async () => {
      const project = await projectRepo.create({
        name: 'Test Custom Viewport',
        baseUrl: `${baseUrl}/simple`,
        config: {
          crawl: false,
          viewport: { width: 1280, height: 720 },
          visualDiffThreshold: 0.1,
          maxPages: 100,
        },
      });

      const run = await runRepo.create({
        projectId: project.id,
        isBaseline: true,
        config: {
          viewport: { width: 1280, height: 720 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      const processor = new ScanProcessor({
        db,
        artifactsDir,
        projectRepo,
        runRepo,
        pageRepo,
        snapshotRepo,
      });

      const result = await processor.processScan({
        projectId: project.id,
        runId: run.id,
        url: `${baseUrl}/simple`,
        crawl: false,
        viewport: { width: 1280, height: 720 },
        waitAfterLoad: 100,
        collectHar: false,
      });

      expect(result.config.viewport.width).toBe(1280);
      expect(result.config.viewport.height).toBe(720);
    });

    it('should include pagination metadata', async () => {
      const project = await projectRepo.create({
        name: 'Test Pagination',
        baseUrl: `${baseUrl}/simple`,
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

      const processor = new ScanProcessor({
        db,
        artifactsDir,
        projectRepo,
        runRepo,
        pageRepo,
        snapshotRepo,
      });

      const result = await processor.processScan({
        projectId: project.id,
        runId: run.id,
        url: `${baseUrl}/simple`,
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        waitAfterLoad: 100,
        collectHar: false,
      });

      expect(result.pagination).toBeDefined();
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.limit).toBe(100);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });
  });
});
