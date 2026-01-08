/**
 * RunRepository Comparison Tests
 * Verify behavioral equivalence between SQL and Drizzle implementations
 */

import { RunStatus } from '@gander-tools/diff-voyager-shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../../src/storage/database.js';
import { createDrizzleDb, type DrizzleDb } from '../../../src/storage/drizzle/db.js';
import { RunRepositoryDrizzle } from '../../../src/storage/repositories/run-repository.drizzle.js';
import { RunRepository } from '../../../src/storage/repositories/run-repository.js';
import { cleanupTestDb, createTestDb, type TestDatabase } from '../../helpers/test-db.js';

describe('RunRepository Comparison (SQL vs Drizzle)', () => {
  let sqliteDb: TestDatabase;
  let drizzleDb: DrizzleDb;
  let sqlRepo: RunRepository;
  let drizzleRepo: RunRepositoryDrizzle;
  let projectId: string;

  beforeEach(async () => {
    sqliteDb = await createTestDb();
    createDatabase({ dbPath: sqliteDb.name, baseDir: '', artifactsDir: '' });
    sqliteDb.close();
    sqliteDb = (await import('better-sqlite3')).default(sqliteDb.name);
    drizzleDb = createDrizzleDb(sqliteDb);

    sqlRepo = new RunRepository(sqliteDb);
    drizzleRepo = new RunRepositoryDrizzle(drizzleDb);

    // Create test project
    projectId = 'test-project-comparison';
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

  describe('create()', () => {
    it('should produce identical results', async () => {
      const input1 = {
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      };

      const input2 = {
        projectId,
        isBaseline: false,
        config: {
          viewport: { width: 1280, height: 720 },
          captureScreenshots: false,
          captureHar: true,
        },
      };

      const sqlResult = await sqlRepo.create(input1);
      const drizzleResult = await drizzleRepo.create(input2);

      // Both should return same structure
      expect(sqlResult).toHaveProperty('id');
      expect(drizzleResult).toHaveProperty('id');
      expect(sqlResult.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(drizzleResult.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(sqlResult.projectId).toBe(projectId);
      expect(drizzleResult.projectId).toBe(projectId);
      expect(sqlResult.status).toBe(RunStatus.NEW);
      expect(drizzleResult.status).toBe(RunStatus.NEW);
      expect(sqlResult.isBaseline).toBe(true);
      expect(drizzleResult.isBaseline).toBe(false);
      expect(sqlResult.createdAt).toBeInstanceOf(Date);
      expect(drizzleResult.createdAt).toBeInstanceOf(Date);
    });

    it('should handle baseline flag identically', async () => {
      const baselineInput = {
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      };

      const comparisonInput = {
        projectId,
        isBaseline: false,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      };

      const sqlBaseline = await sqlRepo.create(baselineInput);
      const drizzleBaseline = await drizzleRepo.create(baselineInput);
      const sqlComparison = await sqlRepo.create(comparisonInput);
      const drizzleComparison = await drizzleRepo.create(comparisonInput);

      expect(sqlBaseline.isBaseline).toBe(true);
      expect(drizzleBaseline.isBaseline).toBe(true);
      expect(sqlComparison.isBaseline).toBe(false);
      expect(drizzleComparison.isBaseline).toBe(false);
    });

    it('should serialize JSON config identically', async () => {
      const input = {
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1280, height: 720 },
          captureScreenshots: true,
          captureHar: true,
        },
      };

      const sqlResult = await sqlRepo.create(input);
      const drizzleResult = await drizzleRepo.create(input);

      expect(sqlResult.config).toEqual(drizzleResult.config);
      expect(sqlResult.config).toEqual(input.config);
    });
  });

  describe('findById()', () => {
    it('should return same result for existing run', async () => {
      const created = await sqlRepo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      const sqlResult = await sqlRepo.findById(created.id);
      const drizzleResult = await drizzleRepo.findById(created.id);

      expect(sqlResult).toEqual(drizzleResult);
      expect(sqlResult?.id).toBe(drizzleResult?.id);
    });

    it('should both return null for non-existent run', async () => {
      const sqlResult = await sqlRepo.findById('non-existent');
      const drizzleResult = await drizzleRepo.findById('non-existent');

      expect(sqlResult).toBeNull();
      expect(drizzleResult).toBeNull();
    });

    it('should properly deserialize JSON config and statistics', async () => {
      const created = await sqlRepo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1280, height: 720 },
          captureScreenshots: true,
          captureHar: true,
        },
      });

      await sqlRepo.updateStatistics(created.id, {
        totalPages: 100,
        completedPages: 50,
        errorPages: 5,
        changedPages: 20,
        unchangedPages: 30,
      });

      const sqlResult = await sqlRepo.findById(created.id);
      const drizzleResult = await drizzleRepo.findById(created.id);

      expect(sqlResult?.config).toEqual(drizzleResult?.config);
      expect(sqlResult?.statistics).toEqual(drizzleResult?.statistics);
    });
  });

  describe('findByProjectId()', () => {
    it('should return same runs in same order', async () => {
      await sqlRepo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await sqlRepo.create({
        projectId,
        isBaseline: false,
        config: {
          viewport: { width: 1280, height: 720 },
          captureScreenshots: false,
          captureHar: true,
        },
      });

      const sqlResults = await sqlRepo.findByProjectId(projectId);
      const drizzleResults = await drizzleRepo.findByProjectId(projectId);

      expect(sqlResults).toHaveLength(2);
      expect(drizzleResults).toHaveLength(2);

      // Compare each run
      for (let i = 0; i < sqlResults.length; i++) {
        expect(sqlResults[i].id).toBe(drizzleResults[i].id);
        expect(sqlResults[i].isBaseline).toBe(drizzleResults[i].isBaseline);
      }

      // Verify DESC order (newest first)
      expect(sqlResults[0].isBaseline).toBe(false);
      expect(drizzleResults[0].isBaseline).toBe(false);
    });

    it('should both return empty array for non-existent project', async () => {
      const sqlResults = await sqlRepo.findByProjectId('non-existent');
      const drizzleResults = await drizzleRepo.findByProjectId('non-existent');

      expect(sqlResults).toEqual([]);
      expect(drizzleResults).toEqual([]);
    });
  });

  describe('updateStatus()', () => {
    it('should update status identically', async () => {
      const created = await sqlRepo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      await sqlRepo.updateStatus(created.id, RunStatus.IN_PROGRESS);
      await drizzleRepo.updateStatus(created.id, RunStatus.IN_PROGRESS);

      const sqlResult = await sqlRepo.findById(created.id);
      const drizzleResult = await drizzleRepo.findById(created.id);

      expect(sqlResult?.status).toBe(RunStatus.IN_PROGRESS);
      expect(drizzleResult?.status).toBe(RunStatus.IN_PROGRESS);
    });

    it('should set started_at for IN_PROGRESS status', async () => {
      const created = await sqlRepo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      await sqlRepo.updateStatus(created.id, RunStatus.IN_PROGRESS);
      await drizzleRepo.updateStatus(created.id, RunStatus.IN_PROGRESS);

      const sqlResult = await sqlRepo.findById(created.id);
      const drizzleResult = await drizzleRepo.findById(created.id);

      expect(sqlResult?.startedAt).toBeInstanceOf(Date);
      expect(drizzleResult?.startedAt).toBeInstanceOf(Date);
      expect(sqlResult?.completedAt).toBeUndefined();
      expect(drizzleResult?.completedAt).toBeUndefined();
    });

    it('should set completed_at for COMPLETED status', async () => {
      const created = await sqlRepo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      await sqlRepo.updateStatus(created.id, RunStatus.COMPLETED);
      await drizzleRepo.updateStatus(created.id, RunStatus.COMPLETED);

      const sqlResult = await sqlRepo.findById(created.id);
      const drizzleResult = await drizzleRepo.findById(created.id);

      expect(sqlResult?.completedAt).toBeInstanceOf(Date);
      expect(drizzleResult?.completedAt).toBeInstanceOf(Date);
    });

    it('should not set timestamps for other statuses', async () => {
      const created = await sqlRepo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      await sqlRepo.updateStatus(created.id, RunStatus.INTERRUPTED);
      await drizzleRepo.updateStatus(created.id, RunStatus.INTERRUPTED);

      const sqlResult = await sqlRepo.findById(created.id);
      const drizzleResult = await drizzleRepo.findById(created.id);

      expect(sqlResult?.status).toBe(RunStatus.INTERRUPTED);
      expect(drizzleResult?.status).toBe(RunStatus.INTERRUPTED);
      expect(sqlResult?.startedAt).toBeUndefined();
      expect(drizzleResult?.startedAt).toBeUndefined();
      expect(sqlResult?.completedAt).toBeUndefined();
      expect(drizzleResult?.completedAt).toBeUndefined();
    });
  });

  describe('updateStatistics()', () => {
    it('should update statistics identically', async () => {
      const created = await sqlRepo.create({
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

      await sqlRepo.updateStatistics(created.id, statistics);
      await drizzleRepo.updateStatistics(created.id, statistics);

      const sqlResult = await sqlRepo.findById(created.id);
      const drizzleResult = await drizzleRepo.findById(created.id);

      expect(sqlResult?.statistics).toEqual(statistics);
      expect(drizzleResult?.statistics).toEqual(statistics);
    });

    it('should overwrite existing statistics', async () => {
      const created = await sqlRepo.create({
        projectId,
        isBaseline: true,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      });

      await sqlRepo.updateStatistics(created.id, {
        totalPages: 100,
        completedPages: 50,
        errorPages: 5,
        changedPages: 20,
        unchangedPages: 30,
      });

      const newStatistics = {
        totalPages: 100,
        completedPages: 100,
        errorPages: 0,
        changedPages: 40,
        unchangedPages: 60,
      };

      await sqlRepo.updateStatistics(created.id, newStatistics);
      await drizzleRepo.updateStatistics(created.id, newStatistics);

      const sqlResult = await sqlRepo.findById(created.id);
      const drizzleResult = await drizzleRepo.findById(created.id);

      expect(sqlResult?.statistics).toEqual(newStatistics);
      expect(drizzleResult?.statistics).toEqual(newStatistics);
    });
  });

  describe('Edge cases', () => {
    it('should handle concurrent operations consistently', async () => {
      const runs = Array.from({ length: 10 }, (_, i) => ({
        projectId,
        isBaseline: i === 0,
        config: {
          viewport: { width: 1920, height: 1080 },
          captureScreenshots: true,
          captureHar: false,
        },
      }));

      // Create runs using SQL
      const sqlRuns = await Promise.all(runs.map((r) => sqlRepo.create(r)));

      // Retrieve using Drizzle
      const drizzleResults = await drizzleRepo.findByProjectId(projectId);

      expect(drizzleResults).toHaveLength(sqlRuns.length);
      expect(drizzleResults.map((r) => r.id).sort()).toEqual(sqlRuns.map((r) => r.id).sort());
    });
  });
});
