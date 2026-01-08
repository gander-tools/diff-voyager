/**
 * ProjectRepository Comparison Tests
 * Verify behavioral equivalence between SQL and Drizzle implementations
 */

import { RunStatus } from '@gander-tools/diff-voyager-shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../../src/storage/database.js';
import { createDrizzleDb, type DrizzleDb } from '../../../src/storage/drizzle/db.js';
import { ProjectRepositoryDrizzle } from '../../../src/storage/repositories/project-repository.drizzle.js';
import { ProjectRepository } from '../../../src/storage/repositories/project-repository.js';
import { cleanupTestDb, createTestDb, type TestDatabase } from '../../helpers/test-db.js';

describe('ProjectRepository Comparison (SQL vs Drizzle)', () => {
  let sqliteDb: TestDatabase;
  let drizzleDb: DrizzleDb;
  let sqlRepo: ProjectRepository;
  let drizzleRepo: ProjectRepositoryDrizzle;

  beforeEach(async () => {
    sqliteDb = await createTestDb();
    createDatabase({ dbPath: sqliteDb.name, baseDir: '', artifactsDir: '' });
    sqliteDb.close();
    sqliteDb = (await import('better-sqlite3')).default(sqliteDb.name);
    drizzleDb = createDrizzleDb(sqliteDb);

    sqlRepo = new ProjectRepository(sqliteDb);
    drizzleRepo = new ProjectRepositoryDrizzle(drizzleDb);
  });

  afterEach(async () => {
    await cleanupTestDb(sqliteDb);
  });

  describe('create()', () => {
    it('should produce identical results', async () => {
      const input1 = {
        name: 'Test Project SQL',
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      };

      const input2 = {
        name: 'Test Project Drizzle',
        baseUrl: 'http://localhost:3457',
        config: {
          crawl: true,
          viewport: { width: 1280, height: 720 },
          visualDiffThreshold: 0.02,
          maxPages: 50,
        },
      };

      const sqlResult = await sqlRepo.create(input1);
      const drizzleResult = await drizzleRepo.create(input2);

      // Both should return same structure
      expect(sqlResult).toHaveProperty('id');
      expect(drizzleResult).toHaveProperty('id');
      expect(sqlResult.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(drizzleResult.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(sqlResult.name).toBe('Test Project SQL');
      expect(drizzleResult.name).toBe('Test Project Drizzle');
      expect(sqlResult.status).toBe(RunStatus.NEW);
      expect(drizzleResult.status).toBe(RunStatus.NEW);
      expect(sqlResult.createdAt).toBeInstanceOf(Date);
      expect(drizzleResult.createdAt).toBeInstanceOf(Date);
      expect(sqlResult.updatedAt).toBeInstanceOf(Date);
      expect(drizzleResult.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle description field identically', async () => {
      const withDescription = {
        name: 'With Description',
        description: 'Test description',
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      };

      const withoutDescription = {
        name: 'Without Description',
        baseUrl: 'http://localhost:3457',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      };

      const sqlWith = await sqlRepo.create(withDescription);
      const drizzleWith = await drizzleRepo.create(withDescription);
      const sqlWithout = await sqlRepo.create(withoutDescription);
      const drizzleWithout = await drizzleRepo.create(withoutDescription);

      expect(sqlWith.description).toBe('Test description');
      expect(drizzleWith.description).toBe('Test description');
      expect(sqlWithout.description).toBeUndefined();
      expect(drizzleWithout.description).toBeUndefined();
    });

    it('should serialize JSON config identically', async () => {
      const input = {
        name: 'Complex Config',
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: true,
          viewport: { width: 1280, height: 720 },
          visualDiffThreshold: 0.05,
          maxPages: 100,
          customOption: 'value',
        },
      };

      const sqlResult = await sqlRepo.create(input);
      const drizzleResult = await drizzleRepo.create(input);

      expect(sqlResult.config).toEqual(drizzleResult.config);
      expect(sqlResult.config).toEqual(input.config);
      expect(drizzleResult.config).toEqual(input.config);
    });
  });

  describe('findById()', () => {
    it('should return same result for existing project', async () => {
      const created = await sqlRepo.create({
        name: 'Find Test',
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      const sqlResult = await sqlRepo.findById(created.id);
      const drizzleResult = await drizzleRepo.findById(created.id);

      expect(sqlResult).toEqual(drizzleResult);
      expect(sqlResult?.id).toBe(drizzleResult?.id);
      expect(sqlResult?.name).toBe('Find Test');
    });

    it('should both return null for non-existent project', async () => {
      const sqlResult = await sqlRepo.findById('non-existent');
      const drizzleResult = await drizzleRepo.findById('non-existent');

      expect(sqlResult).toBeNull();
      expect(drizzleResult).toBeNull();
    });

    it('should properly deserialize JSON config', async () => {
      const created = await sqlRepo.create({
        name: 'Config Test',
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: true,
          viewport: { width: 1280, height: 720 },
          visualDiffThreshold: 0.05,
          maxPages: 100,
        },
      });

      const sqlResult = await sqlRepo.findById(created.id);
      const drizzleResult = await drizzleRepo.findById(created.id);

      expect(sqlResult?.config).toEqual({
        crawl: true,
        viewport: { width: 1280, height: 720 },
        visualDiffThreshold: 0.05,
        maxPages: 100,
      });
      expect(drizzleResult?.config).toEqual(sqlResult?.config);
    });
  });

  describe('findAll()', () => {
    it('should return same projects in same order', async () => {
      // Create test projects
      await sqlRepo.create({
        name: 'Project 1',
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await sqlRepo.create({
        name: 'Project 2',
        baseUrl: 'http://example.com',
        config: { crawl: true, viewport: { width: 1280, height: 720 }, visualDiffThreshold: 0.02 },
      });

      const sqlResults = await sqlRepo.findAll();
      const drizzleResults = await drizzleRepo.findAll();

      expect(sqlResults.total).toBe(2);
      expect(drizzleResults.total).toBe(2);
      expect(sqlResults.projects).toHaveLength(2);
      expect(drizzleResults.projects).toHaveLength(2);

      // Compare each project
      for (let i = 0; i < sqlResults.projects.length; i++) {
        expect(sqlResults.projects[i].id).toBe(drizzleResults.projects[i].id);
        expect(sqlResults.projects[i].name).toBe(drizzleResults.projects[i].name);
      }

      // Verify DESC order (newest first)
      expect(sqlResults.projects[0].name).toBe('Project 2');
      expect(drizzleResults.projects[0].name).toBe('Project 2');
    });

    it('should handle pagination identically', async () => {
      // Create 5 projects
      for (let i = 0; i < 5; i++) {
        await sqlRepo.create({
          name: `Project ${i}`,
          baseUrl: `http://localhost:${3000 + i}`,
          config: {
            crawl: false,
            viewport: { width: 1920, height: 1080 },
            visualDiffThreshold: 0.01,
          },
        });
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      const sqlPage1 = await sqlRepo.findAll({ limit: 2, offset: 0 });
      const drizzlePage1 = await drizzleRepo.findAll({ limit: 2, offset: 0 });

      expect(sqlPage1.total).toBe(5);
      expect(drizzlePage1.total).toBe(5);
      expect(sqlPage1.projects).toHaveLength(2);
      expect(drizzlePage1.projects).toHaveLength(2);

      const sqlPage2 = await sqlRepo.findAll({ limit: 2, offset: 2 });
      const drizzlePage2 = await drizzleRepo.findAll({ limit: 2, offset: 2 });

      expect(sqlPage2.projects).toHaveLength(2);
      expect(drizzlePage2.projects).toHaveLength(2);

      const sqlPage3 = await sqlRepo.findAll({ limit: 2, offset: 4 });
      const drizzlePage3 = await drizzleRepo.findAll({ limit: 2, offset: 4 });

      expect(sqlPage3.projects).toHaveLength(1);
      expect(drizzlePage3.projects).toHaveLength(1);
    });

    it('should both return empty array when no projects', async () => {
      const sqlResult = await sqlRepo.findAll();
      const drizzleResult = await drizzleRepo.findAll();

      expect(sqlResult.projects).toEqual([]);
      expect(sqlResult.total).toBe(0);
      expect(drizzleResult.projects).toEqual([]);
      expect(drizzleResult.total).toBe(0);
    });
  });

  describe('updateStatus()', () => {
    it('should update status identically', async () => {
      const created = await sqlRepo.create({
        name: 'Status Test',
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      await sqlRepo.updateStatus(created.id, RunStatus.IN_PROGRESS);
      await drizzleRepo.updateStatus(created.id, RunStatus.IN_PROGRESS);

      const sqlResult = await sqlRepo.findById(created.id);
      const drizzleResult = await drizzleRepo.findById(created.id);

      expect(sqlResult?.status).toBe(RunStatus.IN_PROGRESS);
      expect(drizzleResult?.status).toBe(RunStatus.IN_PROGRESS);
    });

    it('should update updatedAt timestamp', async () => {
      const created = await sqlRepo.create({
        name: 'Timestamp Test',
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      const originalUpdatedAt = created.updatedAt.getTime();

      await new Promise((resolve) => setTimeout(resolve, 10));

      await sqlRepo.updateStatus(created.id, RunStatus.COMPLETED);
      await drizzleRepo.updateStatus(created.id, RunStatus.COMPLETED);

      const sqlResult = await sqlRepo.findById(created.id);
      const drizzleResult = await drizzleRepo.findById(created.id);

      expect(sqlResult?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt);
      expect(drizzleResult?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt);
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in names identically', async () => {
      const specialName = 'Test Project with \'special\' "chars" & symbols';

      const sqlResult = await sqlRepo.create({
        name: specialName,
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      const drizzleResult = await drizzleRepo.findById(sqlResult.id);

      expect(drizzleResult).not.toBeNull();
      expect(drizzleResult?.name).toBe(specialName);
    });

    it('should handle concurrent operations consistently', async () => {
      const projects = Array.from({ length: 10 }, (_, i) => ({
        name: `Concurrent Project ${i}`,
        baseUrl: `http://localhost:${3000 + i}`,
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      }));

      // Create projects using SQL
      const sqlProjects = await Promise.all(projects.map((p) => sqlRepo.create(p)));

      // Retrieve using Drizzle
      const drizzleResults = await drizzleRepo.findAll({ limit: 50 });

      expect(drizzleResults.projects).toHaveLength(sqlProjects.length);
      expect(drizzleResults.projects.map((p) => p.id).sort()).toEqual(
        sqlProjects.map((p) => p.id).sort(),
      );
    });
  });
});
