/**
 * RunRepositoryDrizzle unit tests (TDD)
 * These tests are written BEFORE the implementation
 */

import { RunStatus } from '@gander-tools/diff-voyager-shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../../src/storage/database.js';
import { createDrizzleDb, type DrizzleDb } from '../../../src/storage/drizzle/db.js';
import { RunRepositoryDrizzle } from '../../../src/storage/repositories/run-repository.drizzle.js';
import { cleanupTestDb, createTestDb, type TestDatabase } from '../../helpers/test-db.js';

describe('RunRepositoryDrizzle', () => {
  let sqliteDb: TestDatabase;
  let drizzleDb: DrizzleDb;
  let repo: RunRepositoryDrizzle;
  let projectId: string;

  beforeEach(async () => {
    sqliteDb = await createTestDb();
    createDatabase({ dbPath: sqliteDb.name, baseDir: '', artifactsDir: '' });
    sqliteDb.close();
    sqliteDb = (await import('better-sqlite3')).default(sqliteDb.name);
    drizzleDb = createDrizzleDb(sqliteDb);
    repo = new RunRepositoryDrizzle(drizzleDb);

    // Create test project
    projectId = 'test-project-id';
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
        new Date().toISOString(),
        new Date().toISOString(),
      );
  });

  afterEach(async () => {
    await cleanupTestDb(sqliteDb);
  });

  describe('create', () => {
    it('should insert run record', async () => {
      const run = await repo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      expect(run.id).toBeDefined();
      expect(run.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(run.projectId).toBe(projectId);
      expect(run.isBaseline).toBe(true);
      expect(run.status).toBe(RunStatus.NEW);
      expect(run.config).toEqual({
        viewport: { width: 1920, height: 1080 },
        captureScreenshots: true,
        captureHar: false,
      });
      expect(run.statistics).toBeNull();
      expect(run.createdAt).toBeInstanceOf(Date);
      expect(run.startedAt).toBeUndefined();
      expect(run.completedAt).toBeUndefined();
    });

    it('should return created run with id', async () => {
      const run = await repo.create({
        projectId,
        isBaseline: false,
        config: {
          viewport: { width: 1280, height: 720 },
          captureScreenshots: false,
          captureHar: true,
        },
      });

      expect(run.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(run.createdAt).toBeInstanceOf(Date);
      expect(run.isBaseline).toBe(false);
    });

    it('should handle baseline flag correctly', async () => {
      const baseline = await repo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      const comparison = await repo.create({
        projectId,
        isBaseline: false,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      expect(baseline.isBaseline).toBe(true);
      expect(comparison.isBaseline).toBe(false);
    });
  });

  describe('findById', () => {
    it('should return run when exists', async () => {
      const created = await repo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      const found = await repo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.projectId).toBe(projectId);
      expect(found?.config).toEqual(created.config);
    });

    it('should return null when not exists', async () => {
      const found = await repo.findById('non-existent-id');
      expect(found).toBeNull();
    });

    it('should properly deserialize JSON columns', async () => {
      const created = await repo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1280, height: 720 },
          captureScreenshots: true,
          captureHar: true,
        },
      });

      const found = await repo.findById(created.id);

      expect(found?.config).toEqual({
        viewport: { width: 1280, height: 720 },
        captureScreenshots: true,
        captureHar: true,
      });
      expect(found?.statistics).toBeNull();
    });

    it('should handle optional timestamps', async () => {
      const created = await repo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      const found = await repo.findById(created.id);

      expect(found?.createdAt).toBeInstanceOf(Date);
      expect(found?.startedAt).toBeUndefined();
      expect(found?.completedAt).toBeUndefined();
    });
  });

  describe('findByProjectId', () => {
    it('should return all runs for project', async () => {
      await repo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      await repo.create({
        projectId,
        isBaseline: false,
        config: {
          viewport: { width: 1280, height: 720 },
          captureScreenshots: false,
          captureHar: true,
        },
      });

      const runs = await repo.findByProjectId(projectId);

      expect(runs).toHaveLength(2);
    });

    it('should return runs ordered by created_at DESC', async () => {
      const run1 = await repo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const run2 = await repo.create({
        projectId,
        isBaseline: false,
        config: {
          viewport: { width: 1280, height: 720 },
          captureScreenshots: false,
          captureHar: true,
        },
      });

      const runs = await repo.findByProjectId(projectId);

      expect(runs[0].id).toBe(run2.id); // Newest first
      expect(runs[1].id).toBe(run1.id);
    });

    it('should return empty array when no runs', async () => {
      const runs = await repo.findByProjectId('non-existent-project');
      expect(runs).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update run status', async () => {
      const created = await repo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      await repo.updateStatus(created.id, RunStatus.IN_PROGRESS);

      const found = await repo.findById(created.id);
      expect(found?.status).toBe(RunStatus.IN_PROGRESS);
    });

    it('should set started_at when status is IN_PROGRESS', async () => {
      const created = await repo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      await repo.updateStatus(created.id, RunStatus.IN_PROGRESS);

      const found = await repo.findById(created.id);
      expect(found?.startedAt).toBeInstanceOf(Date);
      expect(found?.completedAt).toBeUndefined();
    });

    it('should set completed_at when status is COMPLETED', async () => {
      const created = await repo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      await repo.updateStatus(created.id, RunStatus.COMPLETED);

      const found = await repo.findById(created.id);
      expect(found?.completedAt).toBeInstanceOf(Date);
    });

    it('should not modify timestamps for other statuses', async () => {
      const created = await repo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      await repo.updateStatus(created.id, RunStatus.INTERRUPTED);

      const found = await repo.findById(created.id);
      expect(found?.status).toBe(RunStatus.INTERRUPTED);
      expect(found?.startedAt).toBeUndefined();
      expect(found?.completedAt).toBeUndefined();
    });
  });

  describe('updateStatistics', () => {
    it('should update run statistics', async () => {
      const created = await repo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      const statistics = {
        totalPages: 100,
        completedPages: 50,
        errorPages: 5,
        changedPages: 20,
        unchangedPages: 30,
      };

      await repo.updateStatistics(created.id, statistics);

      const found = await repo.findById(created.id);
      expect(found?.statistics).toEqual(statistics);
    });

    it('should overwrite existing statistics', async () => {
      const created = await repo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      await repo.updateStatistics(created.id, {
        totalPages: 100,
        completedPages: 50,
        errorPages: 5,
        changedPages: 20,
        unchangedPages: 30,
      });

      await repo.updateStatistics(created.id, {
        totalPages: 100,
        completedPages: 100,
        errorPages: 0,
        changedPages: 40,
        unchangedPages: 60,
      });

      const found = await repo.findById(created.id);
      expect(found?.statistics).toEqual({
        totalPages: 100,
        completedPages: 100,
        errorPages: 0,
        changedPages: 40,
        unchangedPages: 60,
      });
    });
  });
});
