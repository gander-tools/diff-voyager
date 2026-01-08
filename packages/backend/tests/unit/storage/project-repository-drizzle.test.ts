/**
 * ProjectRepositoryDrizzle unit tests (TDD)
 * These tests are written BEFORE the implementation
 */

import { RunStatus } from '@gander-tools/diff-voyager-shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../../src/storage/database.js';
import { createDrizzleDb, type DrizzleDb } from '../../../src/storage/drizzle/db.js';
import { ProjectRepositoryDrizzle } from '../../../src/storage/repositories/project-repository.drizzle.js';
import { cleanupTestDb, createTestDb, type TestDatabase } from '../../helpers/test-db.js';

describe('ProjectRepositoryDrizzle', () => {
  let sqliteDb: TestDatabase;
  let drizzleDb: DrizzleDb;
  let repo: ProjectRepositoryDrizzle;

  beforeEach(async () => {
    sqliteDb = await createTestDb();
    createDatabase({ dbPath: sqliteDb.name, baseDir: '', artifactsDir: '' });
    sqliteDb.close();
    sqliteDb = (await import('better-sqlite3')).default(sqliteDb.name);
    drizzleDb = createDrizzleDb(sqliteDb);
    repo = new ProjectRepositoryDrizzle(drizzleDb);
  });

  afterEach(async () => {
    await cleanupTestDb(sqliteDb);
  });

  describe('create', () => {
    it('should insert project record', async () => {
      const project = await repo.create({
        name: 'Test Project',
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      expect(project.id).toBeDefined();
      expect(project.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(project.name).toBe('Test Project');
      expect(project.baseUrl).toBe('http://localhost:3456');
      expect(project.status).toBe(RunStatus.NEW);
      expect(project.config).toEqual({
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.01,
      });
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should return created project with id', async () => {
      const project = await repo.create({
        name: 'New Project',
        baseUrl: 'http://example.com',
        config: {
          crawl: true,
          viewport: { width: 1280, height: 720 },
          visualDiffThreshold: 0.02,
          maxPages: 50,
        },
      });

      expect(project.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
      expect(project.config.maxPages).toBe(50);
    });

    it('should store description when provided', async () => {
      const project = await repo.create({
        name: 'Project with Description',
        description: 'Test description',
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      expect(project.description).toBe('Test description');
    });

    it('should handle optional description', async () => {
      const project = await repo.create({
        name: 'Project without Description',
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      expect(project.description).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should return project when exists', async () => {
      const created = await repo.create({
        name: 'Test Project',
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      const found = await repo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Project');
      expect(found?.config).toEqual(created.config);
    });

    it('should return null when not exists', async () => {
      const found = await repo.findById('non-existent-id');
      expect(found).toBeNull();
    });

    it('should properly deserialize JSON config', async () => {
      const created = await repo.create({
        name: 'Test Project',
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: true,
          viewport: { width: 1280, height: 720 },
          visualDiffThreshold: 0.05,
          maxPages: 100,
        },
      });

      const found = await repo.findById(created.id);

      expect(found?.config).toEqual({
        crawl: true,
        viewport: { width: 1280, height: 720 },
        visualDiffThreshold: 0.05,
        maxPages: 100,
      });
    });
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      await repo.create({
        name: 'Project 1',
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });
      await repo.create({
        name: 'Project 2',
        baseUrl: 'http://example.com',
        config: { crawl: true, viewport: { width: 1280, height: 720 }, visualDiffThreshold: 0.02 },
      });

      const result = await repo.findAll();

      expect(result.projects).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should support pagination', async () => {
      // Create 5 projects
      for (let i = 0; i < 5; i++) {
        await repo.create({
          name: `Project ${i}`,
          baseUrl: `http://localhost:${3000 + i}`,
          config: {
            crawl: false,
            viewport: { width: 1920, height: 1080 },
            visualDiffThreshold: 0.01,
          },
        });
      }

      const page1 = await repo.findAll({ limit: 2, offset: 0 });
      expect(page1.projects).toHaveLength(2);
      expect(page1.total).toBe(5);

      const page2 = await repo.findAll({ limit: 2, offset: 2 });
      expect(page2.projects).toHaveLength(2);
      expect(page2.total).toBe(5);

      const page3 = await repo.findAll({ limit: 2, offset: 4 });
      expect(page3.projects).toHaveLength(1);
      expect(page3.total).toBe(5);
    });

    it('should return projects ordered by created_at DESC', async () => {
      const project1 = await repo.create({
        name: 'First',
        baseUrl: 'http://localhost:3001',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const project2 = await repo.create({
        name: 'Second',
        baseUrl: 'http://localhost:3002',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      const result = await repo.findAll();

      expect(result.projects[0].id).toBe(project2.id); // Newest first
      expect(result.projects[1].id).toBe(project1.id);
    });

    it('should return empty array when no projects', async () => {
      const result = await repo.findAll();

      expect(result.projects).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('updateStatus', () => {
    it('should update project status', async () => {
      const created = await repo.create({
        name: 'Test Project',
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      await repo.updateStatus(created.id, RunStatus.IN_PROGRESS);

      const found = await repo.findById(created.id);
      expect(found?.status).toBe(RunStatus.IN_PROGRESS);
    });

    it('should update updated_at timestamp', async () => {
      const created = await repo.create({
        name: 'Test Project',
        baseUrl: 'http://localhost:3456',
        config: {
          crawl: false,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
        },
      });

      const originalUpdatedAt = created.updatedAt.getTime();

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await repo.updateStatus(created.id, RunStatus.COMPLETED);

      const found = await repo.findById(created.id);
      expect(found?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt);
    });
  });
});
