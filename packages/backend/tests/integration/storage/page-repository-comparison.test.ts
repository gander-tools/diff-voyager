/**
 * PageRepository Comparison Tests
 * Verify behavioral equivalence between SQL and Drizzle implementations
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../../src/storage/database.js';
import { createDrizzleDb, type DrizzleDb } from '../../../src/storage/drizzle/db.js';
import { PageRepositoryDrizzle } from '../../../src/storage/repositories/page-repository.drizzle.js';
import { PageRepository } from '../../../src/storage/repositories/page-repository.js';
import { cleanupTestDb, createTestDb, type TestDatabase } from '../../helpers/test-db.js';

describe('PageRepository Comparison (SQL vs Drizzle)', () => {
  let sqliteDb: TestDatabase;
  let drizzleDb: DrizzleDb;
  let sqlRepo: PageRepository;
  let drizzleRepo: PageRepositoryDrizzle;
  let projectId: string;

  beforeEach(async () => {
    sqliteDb = await createTestDb();
    createDatabase({ dbPath: sqliteDb.name, baseDir: '', artifactsDir: '' });
    sqliteDb.close();
    sqliteDb = (await import('better-sqlite3')).default(sqliteDb.name);
    drizzleDb = createDrizzleDb(sqliteDb);

    sqlRepo = new PageRepository(sqliteDb);
    drizzleRepo = new PageRepositoryDrizzle(drizzleDb);

    // Create test project
    projectId = 'test-project-comparison';
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
  });

  afterEach(async () => {
    await cleanupTestDb(sqliteDb);
  });

  describe('create()', () => {
    it('should produce identical results', async () => {
      const input = {
        projectId,
        normalizedUrl: 'http://localhost:3456/test',
        originalUrl: 'http://localhost:3456/test?utm=source',
      };

      const sqlResult = await sqlRepo.create(input);
      const drizzleResult = await drizzleRepo.create({
        ...input,
        normalizedUrl: 'http://localhost:3456/test2',
      });

      // Both should return same structure
      expect(sqlResult).toHaveProperty('id');
      expect(drizzleResult).toHaveProperty('id');
      expect(sqlResult.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(drizzleResult.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(sqlResult.projectId).toBe(drizzleResult.projectId);
      expect(sqlResult.createdAt).toBeInstanceOf(Date);
      expect(drizzleResult.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('findById()', () => {
    it('should return same result for existing page', async () => {
      const created = await sqlRepo.create({
        projectId,
        normalizedUrl: 'http://localhost:3456/findbyid',
        originalUrl: 'http://localhost:3456/findbyid',
      });

      const sqlResult = await sqlRepo.findById(created.id);
      const drizzleResult = await drizzleRepo.findById(created.id);

      expect(sqlResult).toEqual(drizzleResult);
      expect(sqlResult?.id).toBe(drizzleResult?.id);
    });

    it('should both return null for non-existent page', async () => {
      const sqlResult = await sqlRepo.findById('non-existent');
      const drizzleResult = await drizzleRepo.findById('non-existent');

      expect(sqlResult).toBeNull();
      expect(drizzleResult).toBeNull();
    });
  });

  describe('findByProjectId()', () => {
    it('should return same pages in same order', async () => {
      // Create test pages
      await sqlRepo.create({
        projectId,
        normalizedUrl: 'http://localhost:3456/page1',
        originalUrl: 'http://localhost:3456/page1',
      });
      await sqlRepo.create({
        projectId,
        normalizedUrl: 'http://localhost:3456/page2',
        originalUrl: 'http://localhost:3456/page2',
      });
      await sqlRepo.create({
        projectId,
        normalizedUrl: 'http://localhost:3456/page3',
        originalUrl: 'http://localhost:3456/page3',
      });

      const sqlResults = await sqlRepo.findByProjectId(projectId);
      const drizzleResults = await drizzleRepo.findByProjectId(projectId);

      expect(sqlResults).toHaveLength(3);
      expect(drizzleResults).toHaveLength(3);

      // Compare each page
      for (let i = 0; i < sqlResults.length; i++) {
        expect(sqlResults[i].id).toBe(drizzleResults[i].id);
        expect(sqlResults[i].normalizedUrl).toBe(drizzleResults[i].normalizedUrl);
      }
    });

    it('should both return empty array for non-existent project', async () => {
      const sqlResults = await sqlRepo.findByProjectId('non-existent');
      const drizzleResults = await drizzleRepo.findByProjectId('non-existent');

      expect(sqlResults).toEqual([]);
      expect(drizzleResults).toEqual([]);
    });
  });

  describe('findByNormalizedUrl()', () => {
    it('should return same page', async () => {
      const created = await sqlRepo.create({
        projectId,
        normalizedUrl: 'http://localhost:3456/specific',
        originalUrl: 'http://localhost:3456/specific',
      });

      const sqlResult = await sqlRepo.findByNormalizedUrl(
        projectId,
        'http://localhost:3456/specific',
      );
      const drizzleResult = await drizzleRepo.findByNormalizedUrl(
        projectId,
        'http://localhost:3456/specific',
      );

      expect(sqlResult).toEqual(drizzleResult);
      expect(sqlResult?.id).toBe(created.id);
      expect(drizzleResult?.id).toBe(created.id);
    });

    it('should both return null when not found', async () => {
      const sqlResult = await sqlRepo.findByNormalizedUrl(
        projectId,
        'http://localhost:3456/notfound',
      );
      const drizzleResult = await drizzleRepo.findByNormalizedUrl(
        projectId,
        'http://localhost:3456/notfound',
      );

      expect(sqlResult).toBeNull();
      expect(drizzleResult).toBeNull();
    });
  });

  describe('findOrCreate()', () => {
    it('should both find existing page', async () => {
      const created = await sqlRepo.create({
        projectId,
        normalizedUrl: 'http://localhost:3456/findorcreate',
        originalUrl: 'http://localhost:3456/findorcreate',
      });

      const sqlResult = await sqlRepo.findOrCreate({
        projectId,
        normalizedUrl: 'http://localhost:3456/findorcreate',
        originalUrl: 'http://localhost:3456/findorcreate?new',
      });

      const drizzleResult = await drizzleRepo.findOrCreate({
        projectId,
        normalizedUrl: 'http://localhost:3456/findorcreate',
        originalUrl: 'http://localhost:3456/findorcreate?different',
      });

      expect(sqlResult.id).toBe(created.id);
      expect(drizzleResult.id).toBe(created.id);
      expect(sqlResult).toEqual(drizzleResult);
    });

    it('should both create when not found', async () => {
      const sqlResult = await sqlRepo.findOrCreate({
        projectId,
        normalizedUrl: 'http://localhost:3456/new1',
        originalUrl: 'http://localhost:3456/new1',
      });

      const drizzleResult = await drizzleRepo.findOrCreate({
        projectId,
        normalizedUrl: 'http://localhost:3456/new2',
        originalUrl: 'http://localhost:3456/new2',
      });

      expect(sqlResult.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(drizzleResult.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(sqlResult.createdAt).toBeInstanceOf(Date);
      expect(drizzleResult.createdAt).toBeInstanceOf(Date);

      // Verify both were created
      const foundSql = await sqlRepo.findById(sqlResult.id);
      const foundDrizzle = await drizzleRepo.findById(drizzleResult.id);
      expect(foundSql).not.toBeNull();
      expect(foundDrizzle).not.toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters identically', async () => {
      const specialUrl = "http://localhost:3456/page?query=test&special='chars'";

      const sqlResult = await sqlRepo.create({
        projectId,
        normalizedUrl: specialUrl,
        originalUrl: specialUrl,
      });

      const drizzleResult = await drizzleRepo.findById(sqlResult.id);

      expect(drizzleResult).not.toBeNull();
      expect(drizzleResult?.normalizedUrl).toBe(sqlResult.normalizedUrl);
    });

    it('should handle concurrent operations consistently', async () => {
      const urls = Array.from({ length: 10 }, (_, i) => `http://localhost:3456/concurrent-${i}`);

      // Create pages using SQL
      const sqlPages = await Promise.all(
        urls.map((url) =>
          sqlRepo.create({
            projectId,
            normalizedUrl: url,
            originalUrl: url,
          }),
        ),
      );

      // Retrieve using Drizzle
      const drizzlePages = await drizzleRepo.findByProjectId(projectId);

      expect(drizzlePages).toHaveLength(sqlPages.length);
      expect(drizzlePages.map((p) => p.id).sort()).toEqual(sqlPages.map((p) => p.id).sort());
    });
  });
});
