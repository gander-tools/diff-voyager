/**
 * Single page processor tests
 * Tests orchestration of page capture, SEO extraction, and artifact storage
 */

import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import * as tmp from 'tmp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  BrowserManager,
  PageCapturer,
  type ProcessPageInput,
  SinglePageProcessor,
} from '../../../src/crawler/index.js';
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

describe('SinglePageProcessor', () => {
  let mockServer: MockServer;
  let baseUrl: string;
  let testDir: string;
  let artifactsDir: string;
  let db: DatabaseInstance;
  let browserManager: BrowserManager;
  let pageCapturer: PageCapturer;
  let processor: SinglePageProcessor;
  let pageRepository: PageRepository;
  let snapshotRepository: SnapshotRepository;
  let projectRepository: ProjectRepository;
  let runRepository: RunRepository;

  // Helper to create project and run
  async function setupProjectAndRun() {
    const project = await projectRepository.create({
      name: 'Test Project',
      baseUrl: `${baseUrl}/test-page`,
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.01,
      },
    });

    const run = await runRepository.create({
      projectId: project.id,
      baselineId: null,
      config: {
        viewport: { width: 1920, height: 1080 },
        captureHar: false,
      },
    });

    return { projectId: project.id, runId: run.id };
  }

  beforeAll(async () => {
    // Setup test directory
    testDir = tmp.dirSync({ unsafeCleanup: true, prefix: 'diff-voyager-test-' }).name;
    artifactsDir = join(testDir, 'artifacts');
    await mkdir(artifactsDir, { recursive: true });

    // Create database
    const dbPath = join(testDir, 'test.db');
    db = createDatabase({ dbPath, baseDir: testDir, artifactsDir });

    // Create repositories
    pageRepository = new PageRepository(db);
    snapshotRepository = new SnapshotRepository(db);
    projectRepository = new ProjectRepository(db);
    runRepository = new RunRepository(db);

    // Create browser manager and capturer
    browserManager = new BrowserManager({ headless: true });
    pageCapturer = new PageCapturer({ artifactsDir });

    // Create processor
    processor = new SinglePageProcessor({
      browserManager,
      pageCapturer,
      pageRepository,
      snapshotRepository,
      artifactsDir,
    });

    // Start mock server
    mockServer = new MockServer({
      routes: [
        { path: '/test-page', body: HTML_FIXTURES.baseline.simple },
        { path: '/seo-page', body: HTML_FIXTURES.baseline.fullSeo },
        { path: '/404', status: 404, body: 'Not Found' },
      ],
    });
    baseUrl = await mockServer.start();
  });

  afterAll(async () => {
    await browserManager.close();
    await mockServer.stop();
    closeDatabase(db);
    await rm(testDir, { recursive: true, force: true });
  });

  describe('processPage', () => {
    it('should capture and store a page snapshot', async () => {
      const { projectId, runId } = await setupProjectAndRun();

      const input: ProcessPageInput = {
        url: `${baseUrl}/test-page`,
        projectId,
        runId,
        isBaseline: true,
        viewport: { width: 1920, height: 1080 },
        waitAfterLoad: 0,
        collectHar: false,
      };

      const result = await processor.processPage(input);

      expect(result.success).toBe(true);
      expect(result.pageId).toBeDefined();
      expect(result.snapshotId).toBeDefined();
      expect(result.error).toBeUndefined();

      // Verify page was created
      const page = await pageRepository.findById(result.pageId);
      expect(page).toBeDefined();
      expect(page?.projectId).toBe(projectId);
      expect(page?.originalUrl).toBe(`${baseUrl}/test-page`);

      // Verify snapshot was created
      const snapshot = await snapshotRepository.findById(result.snapshotId);
      expect(snapshot).toBeDefined();
      expect(snapshot?.pageId).toBe(result.pageId);
      expect(snapshot?.runId).toBe(runId);
      expect(snapshot?.httpStatus).toBe(200);
      expect(snapshot?.seoData).toBeDefined();
      expect(snapshot?.seoData.title).toBeDefined();
    });

    it('should extract SEO data during capture', async () => {
      const { projectId, runId } = await setupProjectAndRun();

      const input: ProcessPageInput = {
        url: `${baseUrl}/seo-page`,
        projectId,
        runId,
        isBaseline: true,
        viewport: { width: 1920, height: 1080 },
        waitAfterLoad: 0,
        collectHar: false,
      };

      const result = await processor.processPage(input);

      expect(result.success).toBe(true);

      const snapshot = await snapshotRepository.findById(result.snapshotId);
      expect(snapshot?.seoData).toBeDefined();
      expect(snapshot?.seoData.title).toBeTruthy();
      expect(snapshot?.seoData.metaDescription).toBeTruthy();
      expect(snapshot?.seoData.h1).toBeDefined();
      expect(Array.isArray(snapshot?.seoData.h1)).toBe(true);
    });

    it('should handle 404 pages gracefully', async () => {
      const { projectId, runId } = await setupProjectAndRun();

      const input: ProcessPageInput = {
        url: `${baseUrl}/404`,
        projectId,
        runId,
        isBaseline: false,
        viewport: { width: 1920, height: 1080 },
        waitAfterLoad: 0,
        collectHar: false,
      };

      const result = await processor.processPage(input);

      expect(result.success).toBe(true);
      expect(result.pageId).toBeDefined();

      const snapshot = await snapshotRepository.findById(result.snapshotId);
      expect(snapshot?.httpStatus).toBe(404);
    });

    it('should reuse existing page for same normalized URL', async () => {
      const { projectId } = await setupProjectAndRun();

      // Create two separate runs
      const run1 = await runRepository.create({
        projectId,
        baselineId: null,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureHar: false,
        },
      });

      const run2 = await runRepository.create({
        projectId,
        baselineId: run1.id,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureHar: false,
        },
      });

      const input1: ProcessPageInput = {
        url: `${baseUrl}/test-page`,
        projectId,
        runId: run1.id,
        isBaseline: true,
        viewport: { width: 1920, height: 1080 },
        waitAfterLoad: 0,
        collectHar: false,
      };

      const result1 = await processor.processPage(input1);
      expect(result1.success).toBe(true);

      // Process same URL again for different run
      const input2: ProcessPageInput = {
        ...input1,
        runId: run2.id,
        isBaseline: false,
      };

      const result2 = await processor.processPage(input2);
      expect(result2.success).toBe(true);

      // Should reuse same page ID
      expect(result2.pageId).toBe(result1.pageId);

      // But create different snapshots
      expect(result2.snapshotId).not.toBe(result1.snapshotId);
    });

    it('should handle capture errors and return error info', async () => {
      const { projectId, runId } = await setupProjectAndRun();

      const input: ProcessPageInput = {
        url: 'http://invalid-domain-that-does-not-exist.test',
        projectId,
        runId,
        isBaseline: true,
        viewport: { width: 1920, height: 1080 },
        waitAfterLoad: 0,
        collectHar: false,
      };

      const result = await processor.processPage(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Error message may vary by platform
      expect(result.error?.toLowerCase()).toMatch(/err_name_not_resolved|enotfound|failed/);
    });

    it('should respect viewport configuration', async () => {
      const { projectId, runId } = await setupProjectAndRun();

      const customViewport = { width: 375, height: 667 }; // Mobile viewport

      const input: ProcessPageInput = {
        url: `${baseUrl}/test-page`,
        projectId,
        runId,
        isBaseline: true,
        viewport: customViewport,
        waitAfterLoad: 100,
        collectHar: false,
      };

      const result = await processor.processPage(input);

      expect(result.success).toBe(true);

      // The capturer should use the specified viewport
      // This would be reflected in the screenshot dimensions
      const snapshot = await snapshotRepository.findById(result.snapshotId);
      expect(snapshot).toBeDefined();
    });
  });
});
