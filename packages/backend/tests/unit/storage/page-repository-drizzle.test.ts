/**
 * PageRepositoryDrizzle unit tests (TDD)
 * These tests are written BEFORE the implementation
 */

import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../../src/storage/database.js';
import { createDrizzleDb, type DrizzleDb } from '../../../src/storage/drizzle/db.js';
import { PageRepositoryDrizzle } from '../../../src/storage/repositories/page-repository.drizzle.js';
import { cleanupTestDb, createTestDb, type TestDatabase } from '../../helpers/test-db.js';

describe('PageRepositoryDrizzle', () => {
  let sqliteDb: TestDatabase;
  let drizzleDb: DrizzleDb;
  let repo: PageRepositoryDrizzle;

  beforeEach(async () => {
    sqliteDb = await createTestDb();
    // Run migrations to create schema
    createDatabase({ dbPath: sqliteDb.name, baseDir: '', artifactsDir: '' });
    sqliteDb.close();
    // Reopen and create Drizzle instance
    sqliteDb = (await import('better-sqlite3')).default(sqliteDb.name);
    drizzleDb = createDrizzleDb(sqliteDb);
    repo = new PageRepositoryDrizzle(drizzleDb);
  });

  afterEach(async () => {
    await cleanupTestDb(sqliteDb);
  });

  describe('create', () => {
    it('should insert page record', async () => {
      // First create a project (pages need a project_id)
      const projectId = 'test-project-id';
      sqliteDb
        .prepare(
          `INSERT INTO projects (id, name, base_url, config_json, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

      const page = await repo.create({
        projectId,
        normalizedUrl: 'http://localhost:3456/',
        originalUrl: 'http://localhost:3456',
      });

      expect(page.id).toBeDefined();
      expect(page.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
      expect(page.projectId).toBe(projectId);
      expect(page.normalizedUrl).toBe('http://localhost:3456/');
      expect(page.originalUrl).toBe('http://localhost:3456');
      expect(page.createdAt).toBeInstanceOf(Date);
    });

    it('should return created page with UUID', async () => {
      const projectId = 'test-project-id-2';
      sqliteDb
        .prepare(
          `INSERT INTO projects (id, name, base_url, config_json, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          projectId,
          'Test Project 2',
          'http://example.com',
          JSON.stringify({ crawl: false }),
          'new',
          new Date().toISOString(),
          new Date().toISOString(),
        );

      const page = await repo.create({
        projectId,
        normalizedUrl: 'http://example.com/page',
        originalUrl: 'http://example.com/page?utm_source=test',
      });

      expect(page.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(page.createdAt).toBeInstanceOf(Date);
      expect(page.normalizedUrl).toBe('http://example.com/page');
    });
  });

  describe('findById', () => {
    it('should return page when exists', async () => {
      const projectId = 'test-project-id';
      sqliteDb
        .prepare(
          `INSERT INTO projects (id, name, base_url, config_json, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

      const created = await repo.create({
        projectId,
        normalizedUrl: 'http://localhost:3456/',
        originalUrl: 'http://localhost:3456',
      });

      const found = await repo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.projectId).toBe(projectId);
      expect(found?.normalizedUrl).toBe('http://localhost:3456/');
      expect(found?.originalUrl).toBe('http://localhost:3456');
      expect(found?.createdAt).toBeInstanceOf(Date);
    });

    it('should return null when not exists', async () => {
      const found = await repo.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByProjectId', () => {
    it('should return all pages for project', async () => {
      const projectId = 'test-project-id';
      sqliteDb
        .prepare(
          `INSERT INTO projects (id, name, base_url, config_json, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

      // Create multiple pages
      await repo.create({
        projectId,
        normalizedUrl: 'http://localhost:3456/',
        originalUrl: 'http://localhost:3456',
      });
      await repo.create({
        projectId,
        normalizedUrl: 'http://localhost:3456/about',
        originalUrl: 'http://localhost:3456/about',
      });
      await repo.create({
        projectId,
        normalizedUrl: 'http://localhost:3456/contact',
        originalUrl: 'http://localhost:3456/contact',
      });

      const pages = await repo.findByProjectId(projectId);

      expect(pages).toHaveLength(3);
      expect(pages[0].projectId).toBe(projectId);
      expect(pages[1].projectId).toBe(projectId);
      expect(pages[2].projectId).toBe(projectId);
      expect(pages.map((p) => p.normalizedUrl)).toContain('http://localhost:3456/');
      expect(pages.map((p) => p.normalizedUrl)).toContain('http://localhost:3456/about');
      expect(pages.map((p) => p.normalizedUrl)).toContain('http://localhost:3456/contact');
    });

    it('should return empty array when no pages', async () => {
      const pages = await repo.findByProjectId('non-existent-project');
      expect(pages).toEqual([]);
      expect(pages).toHaveLength(0);
    });
  });

  describe('findByNormalizedUrl', () => {
    it('should return page when exists', async () => {
      const projectId = 'test-project-id';
      sqliteDb
        .prepare(
          `INSERT INTO projects (id, name, base_url, config_json, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

      await repo.create({
        projectId,
        normalizedUrl: 'http://localhost:3456/specific-page',
        originalUrl: 'http://localhost:3456/specific-page?utm=test',
      });

      const found = await repo.findByNormalizedUrl(
        projectId,
        'http://localhost:3456/specific-page',
      );

      expect(found).not.toBeNull();
      expect(found?.normalizedUrl).toBe('http://localhost:3456/specific-page');
      expect(found?.projectId).toBe(projectId);
    });

    it('should return null when not exists', async () => {
      const projectId = 'test-project-id';
      const found = await repo.findByNormalizedUrl(projectId, 'http://localhost:3456/not-found');
      expect(found).toBeNull();
    });

    it('should distinguish between different projects', async () => {
      const projectId1 = 'project-1';
      const projectId2 = 'project-2';

      // Create two projects
      sqliteDb
        .prepare(
          `INSERT INTO projects (id, name, base_url, config_json, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          projectId1,
          'Project 1',
          'http://localhost:3456',
          JSON.stringify({ crawl: false }),
          'new',
          new Date().toISOString(),
          new Date().toISOString(),
        );
      sqliteDb
        .prepare(
          `INSERT INTO projects (id, name, base_url, config_json, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          projectId2,
          'Project 2',
          'http://example.com',
          JSON.stringify({ crawl: false }),
          'new',
          new Date().toISOString(),
          new Date().toISOString(),
        );

      // Same normalized URL in different projects
      await repo.create({
        projectId: projectId1,
        normalizedUrl: 'http://localhost:3456/page',
        originalUrl: 'http://localhost:3456/page',
      });
      await repo.create({
        projectId: projectId2,
        normalizedUrl: 'http://localhost:3456/page',
        originalUrl: 'http://localhost:3456/page',
      });

      const found1 = await repo.findByNormalizedUrl(projectId1, 'http://localhost:3456/page');
      const found2 = await repo.findByNormalizedUrl(projectId2, 'http://localhost:3456/page');

      expect(found1).not.toBeNull();
      expect(found2).not.toBeNull();
      expect(found1?.id).not.toBe(found2?.id); // Different records
      expect(found1?.projectId).toBe(projectId1);
      expect(found2?.projectId).toBe(projectId2);
    });
  });

  describe('findOrCreate', () => {
    it('should return existing page if found', async () => {
      const projectId = 'test-project-id';
      sqliteDb
        .prepare(
          `INSERT INTO projects (id, name, base_url, config_json, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

      const created = await repo.create({
        projectId,
        normalizedUrl: 'http://localhost:3456/page',
        originalUrl: 'http://localhost:3456/page',
      });

      const foundOrCreated = await repo.findOrCreate({
        projectId,
        normalizedUrl: 'http://localhost:3456/page',
        originalUrl: 'http://localhost:3456/page?new=param',
      });

      expect(foundOrCreated.id).toBe(created.id); // Same ID - found existing
      expect(foundOrCreated.normalizedUrl).toBe('http://localhost:3456/page');
    });

    it('should create new page if not found', async () => {
      const projectId = 'test-project-id';
      sqliteDb
        .prepare(
          `INSERT INTO projects (id, name, base_url, config_json, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

      const page = await repo.findOrCreate({
        projectId,
        normalizedUrl: 'http://localhost:3456/new-page',
        originalUrl: 'http://localhost:3456/new-page',
      });

      expect(page.id).toBeDefined();
      expect(page.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(page.normalizedUrl).toBe('http://localhost:3456/new-page');

      // Verify it was actually created in database
      const found = await repo.findById(page.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(page.id);
    });

    it('should be idempotent - multiple calls return same page', async () => {
      const projectId = 'test-project-id';
      sqliteDb
        .prepare(
          `INSERT INTO projects (id, name, base_url, config_json, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

      const page1 = await repo.findOrCreate({
        projectId,
        normalizedUrl: 'http://localhost:3456/idempotent',
        originalUrl: 'http://localhost:3456/idempotent',
      });

      const page2 = await repo.findOrCreate({
        projectId,
        normalizedUrl: 'http://localhost:3456/idempotent',
        originalUrl: 'http://localhost:3456/idempotent?different=param',
      });

      const page3 = await repo.findOrCreate({
        projectId,
        normalizedUrl: 'http://localhost:3456/idempotent',
        originalUrl: 'http://localhost:3456/idempotent#hash',
      });

      expect(page1.id).toBe(page2.id);
      expect(page2.id).toBe(page3.id);

      // Verify only one record in database
      const allPages = await repo.findByProjectId(projectId);
      expect(allPages).toHaveLength(1);
    });
  });

  describe('date handling', () => {
    it('should correctly convert ISO string timestamps to Date objects', async () => {
      const projectId = 'test-project-id';
      sqliteDb
        .prepare(
          `INSERT INTO projects (id, name, base_url, config_json, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

      const beforeCreate = new Date();
      const page = await repo.create({
        projectId,
        normalizedUrl: 'http://localhost:3456/',
        originalUrl: 'http://localhost:3456',
      });
      const afterCreate = new Date();

      expect(page.createdAt).toBeInstanceOf(Date);
      expect(page.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(page.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());

      // Verify it persists correctly
      const found = await repo.findById(page.id);
      expect(found?.createdAt).toBeInstanceOf(Date);
      expect(found?.createdAt.getTime()).toBe(page.createdAt.getTime());
    });
  });
});
