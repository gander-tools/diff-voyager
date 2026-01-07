/**
 * ProjectRepository unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, cleanupTestDb, type TestDatabase } from '../../helpers/test-db.js';
import { createDatabase } from '../../../src/storage/database.js';
import { ProjectRepository } from '../../../src/storage/repositories/project-repository.js';
import { RunStatus } from '@gander-tools/diff-voyager-shared';

describe('ProjectRepository', () => {
  let db: TestDatabase;
  let repo: ProjectRepository;

  beforeEach(async () => {
    db = await createTestDb();
    // Run migrations
    createDatabase({ dbPath: db.name, baseDir: '', artifactsDir: '' });
    db.close();
    db = (await import('better-sqlite3')).default(db.name);
    repo = new ProjectRepository(db);
  });

  afterEach(async () => {
    await cleanupTestDb(db);
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
      expect(project.name).toBe('Test Project');
      expect(project.baseUrl).toBe('http://localhost:3456');
      expect(project.status).toBe(RunStatus.NEW);
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
    });

    it('should return null when not exists', async () => {
      const found = await repo.findById('non-existent-id');
      expect(found).toBeNull();
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
  });
});
