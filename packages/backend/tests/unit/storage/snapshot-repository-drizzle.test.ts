/**
 * SnapshotRepositoryDrizzle unit tests (TDD)
 * These tests are written BEFORE the implementation
 */

import { PageStatus } from '@gander-tools/diff-voyager-shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../../src/storage/database.js';
import { createDrizzleDb, type DrizzleDb } from '../../../src/storage/drizzle/db.js';
import { SnapshotRepositoryDrizzle } from '../../../src/storage/repositories/snapshot-repository.drizzle.js';
import type { CreateSnapshotInput } from '../../../src/storage/repositories/snapshot-repository.js';
import { cleanupTestDb, createTestDb, type TestDatabase } from '../../helpers/test-db.js';

describe('SnapshotRepositoryDrizzle', () => {
  let sqliteDb: TestDatabase;
  let drizzleDb: DrizzleDb;
  let repo: SnapshotRepositoryDrizzle;
  let projectId: string;
  let runId: string;
  let pageId: string;

  beforeEach(async () => {
    sqliteDb = await createTestDb();
    createDatabase({ dbPath: sqliteDb.name, baseDir: '', artifactsDir: '' });
    sqliteDb.close();
    sqliteDb = (await import('better-sqlite3')).default(sqliteDb.name);
    drizzleDb = createDrizzleDb(sqliteDb);
    repo = new SnapshotRepositoryDrizzle(drizzleDb);

    // Create test project, run, and page
    projectId = 'test-project-id';
    runId = 'test-run-id';
    pageId = 'test-page-id';

    const now = new Date().toISOString();

    sqliteDb
      .prepare(
        'INSERT INTO projects (id, name, base_url, config_json, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        projectId,
        'Test Project',
        'http://localhost:3456',
        JSON.stringify({ crawl: false }),
        'new',
        now,
        now,
      );

    sqliteDb
      .prepare(
        'INSERT INTO runs (id, project_id, is_baseline, status, config_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(
        runId,
        projectId,
        1,
        'new',
        JSON.stringify({ viewport: { width: 1920, height: 1080 } }),
        now,
      );

    sqliteDb
      .prepare(
        'INSERT INTO pages (id, project_id, normalized_url, original_url, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .run(pageId, projectId, 'http://example.com', 'http://example.com', now);
  });

  afterEach(async () => {
    await cleanupTestDb(sqliteDb);
  });

  describe('create', () => {
    it('should insert snapshot record with all fields', async () => {
      const input: CreateSnapshotInput = {
        pageId,
        runId,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 200,
        redirectChain: [
          { url: 'http://example.com', status: 301 },
          { url: 'https://example.com', status: 200 },
        ],
        htmlHash: 'abc123',
        headers: {
          'content-type': 'text/html',
          'cache-control': 'no-cache',
        },
        seo: {
          title: 'Example Page',
          description: 'Test description',
          canonical: 'https://example.com',
          robots: 'index,follow',
          h1: ['Main Heading'],
        },
        performanceData: {
          loadTime: 1500,
          requestCount: 25,
          totalSize: 500000,
        },
        hasScreenshot: true,
        hasHar: true,
        hasDiff: false,
      };

      const snapshot = await repo.create(input);

      expect(snapshot.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(snapshot.pageId).toBe(pageId);
      expect(snapshot.runId).toBe(runId);
      expect(snapshot.status).toBe(PageStatus.PENDING);
      expect(snapshot.httpStatus).toBe(200);
      expect(snapshot.redirectChain).toEqual(input.redirectChain);
      expect(snapshot.htmlHash).toBe('abc123');
      expect(snapshot.headers).toEqual(input.headers);
      expect(snapshot.seoData).toEqual(input.seo);
      expect(snapshot.performanceData).toEqual(input.performanceData);
      expect(snapshot.screenshotPath).toBe('screenshot.png');
      expect(snapshot.harPath).toBe('performance.har');
      expect(snapshot.diffImagePath).toBeUndefined();
    });

    it('should handle optional fields', async () => {
      const input: CreateSnapshotInput = {
        pageId,
        runId,
        isBaseline: false,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'def456',
        headers: {},
        seo: {
          title: 'Simple Page',
        },
        hasScreenshot: false,
        hasHar: false,
        hasDiff: false,
      };

      const snapshot = await repo.create(input);

      expect(snapshot.redirectChain).toBeUndefined();
      expect(snapshot.performanceData).toBeUndefined();
      expect(snapshot.screenshotPath).toBeUndefined();
      expect(snapshot.harPath).toBeUndefined();
    });

    it('should accept custom ID', async () => {
      const customId = 'custom-snapshot-id';
      const input: CreateSnapshotInput = {
        id: customId,
        pageId,
        runId,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'hash',
        headers: {},
        seo: { title: 'Test' },
        hasScreenshot: false,
        hasHar: false,
        hasDiff: false,
      };

      const snapshot = await repo.create(input);
      expect(snapshot.id).toBe(customId);
    });
  });

  describe('findById', () => {
    it('should return snapshot when exists', async () => {
      const created = await repo.create({
        pageId,
        runId,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'hash',
        headers: { 'content-type': 'text/html' },
        seo: { title: 'Test' },
        hasScreenshot: true,
        hasHar: false,
        hasDiff: false,
      });

      const found = await repo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.headers).toEqual({ 'content-type': 'text/html' });
    });

    it('should return null when not exists', async () => {
      const found = await repo.findById('non-existent');
      expect(found).toBeNull();
    });

    it('should deserialize all JSON columns', async () => {
      const created = await repo.create({
        pageId,
        runId,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 200,
        redirectChain: [{ url: 'http://test.com', status: 200 }],
        htmlHash: 'hash',
        headers: { server: 'nginx' },
        seo: {
          title: 'Test',
          description: 'Desc',
          canonical: 'http://test.com',
        },
        performanceData: {
          loadTime: 1000,
          requestCount: 10,
          totalSize: 100000,
        },
        hasScreenshot: false,
        hasHar: false,
        hasDiff: false,
      });

      const found = await repo.findById(created.id);

      expect(found?.redirectChain).toEqual([{ url: 'http://test.com', status: 200 }]);
      expect(found?.headers).toEqual({ server: 'nginx' });
      expect(found?.seoData?.title).toBe('Test');
      expect(found?.performanceData?.loadTime).toBe(1000);
    });
  });

  describe('findByPageAndRun', () => {
    it('should return snapshot for page-run combination', async () => {
      const created = await repo.create({
        pageId,
        runId,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'hash',
        headers: {},
        seo: { title: 'Test' },
        hasScreenshot: false,
        hasHar: false,
        hasDiff: false,
      });

      const found = await repo.findByPageAndRun(pageId, runId);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });

    it('should return null when combination not exists', async () => {
      const found = await repo.findByPageAndRun('non-existent-page', runId);
      expect(found).toBeNull();
    });
  });

  describe('findByRunId', () => {
    it('should return all snapshots for run', async () => {
      // Create second page
      const page2Id = 'page-2';
      sqliteDb
        .prepare(
          'INSERT INTO pages (id, project_id, normalized_url, original_url, created_at) VALUES (?, ?, ?, ?, ?)',
        )
        .run(
          page2Id,
          projectId,
          'http://example.com/page2',
          'http://example.com/page2',
          new Date().toISOString(),
        );

      await repo.create({
        pageId,
        runId,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'hash1',
        headers: {},
        seo: { title: 'Page 1' },
        hasScreenshot: false,
        hasHar: false,
        hasDiff: false,
      });

      await repo.create({
        pageId: page2Id,
        runId,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'hash2',
        headers: {},
        seo: { title: 'Page 2' },
        hasScreenshot: false,
        hasHar: false,
        hasDiff: false,
      });

      const snapshots = await repo.findByRunId(runId);

      expect(snapshots).toHaveLength(2);
      expect(snapshots.map((s) => s.pageId).sort()).toEqual([pageId, page2Id].sort());
    });

    it('should return empty array when no snapshots', async () => {
      const snapshots = await repo.findByRunId('non-existent-run');
      expect(snapshots).toEqual([]);
    });
  });

  describe('findByPageId', () => {
    it('should return all snapshots for page', async () => {
      // Create second run
      const run2Id = 'run-2';
      sqliteDb
        .prepare(
          'INSERT INTO runs (id, project_id, is_baseline, status, config_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .run(
          run2Id,
          projectId,
          0,
          'new',
          JSON.stringify({ viewport: { width: 1920, height: 1080 } }),
          new Date().toISOString(),
        );

      await repo.create({
        pageId,
        runId,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'hash1',
        headers: {},
        seo: { title: 'Run 1' },
        hasScreenshot: false,
        hasHar: false,
        hasDiff: false,
      });

      await repo.create({
        pageId,
        runId: run2Id,
        isBaseline: false,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'hash2',
        headers: {},
        seo: { title: 'Run 2' },
        hasScreenshot: false,
        hasHar: false,
        hasDiff: false,
      });

      const snapshots = await repo.findByPageId(pageId);

      expect(snapshots).toHaveLength(2);
      expect(snapshots.map((s) => s.runId).sort()).toEqual([runId, run2Id].sort());
    });

    it('should return empty array when no snapshots', async () => {
      const snapshots = await repo.findByPageId('non-existent-page');
      expect(snapshots).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update all fields', async () => {
      const created = await repo.create({
        pageId,
        runId,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'original',
        headers: { original: 'header' },
        seo: { title: 'Original' },
        hasScreenshot: false,
        hasHar: false,
        hasDiff: false,
      });

      await repo.update(created.id, {
        status: PageStatus.ERROR,
        httpStatus: 500,
        redirectChain: [{ url: 'http://redirect.com', status: 302 }],
        htmlHash: 'updated',
        htmlPath: 'path/to/html',
        headers: { updated: 'header' },
        seoData: { title: 'Updated', description: 'New desc' },
        performanceData: { loadTime: 2000, requestCount: 50, totalSize: 1000000 },
        screenshotPath: 'path/to/screenshot.png',
        harPath: 'path/to/har',
        diffImagePath: 'path/to/diff.png',
        capturedAt: new Date('2024-01-15'),
        errorMessage: 'Test error',
      });

      const updated = await repo.findById(created.id);

      expect(updated?.status).toBe(PageStatus.ERROR);
      expect(updated?.httpStatus).toBe(500);
      expect(updated?.redirectChain).toEqual([{ url: 'http://redirect.com', status: 302 }]);
      expect(updated?.htmlHash).toBe('updated');
      expect(updated?.htmlPath).toBe('path/to/html');
      expect(updated?.headers).toEqual({ updated: 'header' });
      expect(updated?.seoData).toEqual({ title: 'Updated', description: 'New desc' });
      expect(updated?.performanceData?.loadTime).toBe(2000);
      expect(updated?.screenshotPath).toBe('path/to/screenshot.png');
      expect(updated?.errorMessage).toBe('Test error');
    });

    it('should handle partial updates', async () => {
      const created = await repo.create({
        pageId,
        runId,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'original',
        headers: { original: 'header' },
        seo: { title: 'Original' },
        hasScreenshot: false,
        hasHar: false,
        hasDiff: false,
      });

      await repo.update(created.id, {
        status: PageStatus.COMPLETED,
        errorMessage: 'Partial update',
      });

      const updated = await repo.findById(created.id);

      expect(updated?.status).toBe(PageStatus.COMPLETED);
      expect(updated?.errorMessage).toBe('Partial update');
      // Original fields should be preserved
      expect(updated?.htmlHash).toBe('original');
    });
  });
});
