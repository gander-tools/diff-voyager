/**
 * DiffRepository Comparison Tests - FINAL MIGRATION!
 * Verifies SQL and Drizzle implementations behave identically
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../../src/storage/database.js';
import { createDrizzleDb, type DrizzleDb } from '../../../src/storage/drizzle/db.js';
import { DiffRepositoryDrizzle } from '../../../src/storage/repositories/diff-repository.drizzle.js';
import {
  type CreateDiffInput,
  DiffRepository,
} from '../../../src/storage/repositories/diff-repository.js';
import { cleanupTestDb, createTestDb, type TestDatabase } from '../../helpers/test-db.js';

describe('DiffRepository Comparison - SQL vs Drizzle', () => {
  let sqliteDb: TestDatabase;
  let drizzleDb: DrizzleDb;
  let sqlRepo: DiffRepository;
  let drizzleRepo: DiffRepositoryDrizzle;
  let projectId: string;
  let baselineRunId: string;
  let comparisonRunId: string;
  let pageId: string;
  let baselineSnapshotId: string;
  let runSnapshotId: string;

  beforeEach(async () => {
    sqliteDb = await createTestDb();
    createDatabase({ dbPath: sqliteDb.name, baseDir: '', artifactsDir: '' });
    sqliteDb.close();
    sqliteDb = (await import('better-sqlite3')).default(sqliteDb.name);
    drizzleDb = createDrizzleDb(sqliteDb);

    sqlRepo = new DiffRepository(sqliteDb);
    drizzleRepo = new DiffRepositoryDrizzle(drizzleDb);

    // Create test data
    projectId = 'test-project-id';
    baselineRunId = 'baseline-run-id';
    comparisonRunId = 'comparison-run-id';
    pageId = 'test-page-id';
    baselineSnapshotId = 'baseline-snapshot-id';
    runSnapshotId = 'run-snapshot-id';

    const now = new Date().toISOString();

    // Create project
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

    // Create baseline and comparison runs
    sqliteDb
      .prepare(
        'INSERT INTO runs (id, project_id, is_baseline, status, config_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(
        baselineRunId,
        projectId,
        1,
        'new',
        JSON.stringify({ viewport: { width: 1920, height: 1080 } }),
        now,
      );

    sqliteDb
      .prepare(
        'INSERT INTO runs (id, project_id, is_baseline, status, config_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(
        comparisonRunId,
        projectId,
        0,
        'new',
        JSON.stringify({ viewport: { width: 1920, height: 1080 } }),
        now,
      );

    // Create page
    sqliteDb
      .prepare(
        'INSERT INTO pages (id, project_id, normalized_url, original_url, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .run(pageId, projectId, 'http://example.com', 'http://example.com', now);

    // Create snapshots
    sqliteDb
      .prepare(
        `INSERT INTO snapshots (id, page_id, run_id, status, http_status, html_hash, headers_json, seo_data_json, captured_at, is_baseline)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        baselineSnapshotId,
        pageId,
        baselineRunId,
        'completed',
        200,
        'hash1',
        JSON.stringify({}),
        JSON.stringify({ title: 'Baseline' }),
        now,
        1,
      );

    sqliteDb
      .prepare(
        `INSERT INTO snapshots (id, page_id, run_id, status, http_status, html_hash, headers_json, seo_data_json, captured_at, is_baseline)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        runSnapshotId,
        pageId,
        comparisonRunId,
        'completed',
        200,
        'hash2',
        JSON.stringify({}),
        JSON.stringify({ title: 'Run' }),
        now,
        0,
      );
  });

  afterEach(async () => {
    await cleanupTestDb(sqliteDb);
  });

  describe('create', () => {
    it('should create identical diff records', async () => {
      const input: CreateDiffInput = {
        pageId,
        runId: comparisonRunId,
        baselineSnapshotId,
        runSnapshotId,
        summary: {
          hasChanges: true,
          totalChanges: 3,
          visualChanges: 1,
          seoChanges: 1,
          performanceChanges: 1,
        },
        changes: [
          { type: 'html', path: 'h1', oldValue: 'Old', newValue: 'New' },
          { type: 'seo', path: 'title', oldValue: 'Old Title', newValue: 'New Title' },
          { type: 'performance', path: 'loadTime', oldValue: 1000, newValue: 2000 },
        ],
      };

      // Create with SQL repo
      const sqlDiff = await sqlRepo.create(input);

      // Read back with both repos
      const sqlRead = await sqlRepo.findByPageAndRun(pageId, comparisonRunId);
      const drizzleRead = await drizzleRepo.findByPageAndRun(pageId, comparisonRunId);

      // Both should have same UUID ID
      expect(sqlDiff.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(sqlRead?.id).toBe(sqlDiff.id);
      expect(drizzleRead?.id).toBe(sqlDiff.id);

      // All fields should match
      expect(sqlRead?.pageId).toBe(drizzleRead?.pageId);
      expect(sqlRead?.runId).toBe(drizzleRead?.runId);
      expect(sqlRead?.baselineSnapshotId).toBe(drizzleRead?.baselineSnapshotId);
      expect(sqlRead?.runSnapshotId).toBe(drizzleRead?.runSnapshotId);
      expect(sqlRead?.summary).toEqual(drizzleRead?.summary);
      expect(sqlRead?.changes).toEqual(drizzleRead?.changes);
    });

    it('should handle empty changes array identically', async () => {
      const input: CreateDiffInput = {
        pageId,
        runId: comparisonRunId,
        baselineSnapshotId,
        runSnapshotId,
        summary: {
          hasChanges: false,
          totalChanges: 0,
          visualChanges: 0,
          seoChanges: 0,
          performanceChanges: 0,
        },
        changes: [],
      };

      // Create with SQL repo
      await sqlRepo.create(input);

      // Read back with both repos
      const sqlRead = await sqlRepo.findByPageAndRun(pageId, comparisonRunId);
      const drizzleRead = await drizzleRepo.findByPageAndRun(pageId, comparisonRunId);

      expect(sqlRead?.changes).toEqual([]);
      expect(drizzleRead?.changes).toEqual([]);
      expect(sqlRead?.summary.hasChanges).toBe(false);
      expect(drizzleRead?.summary.hasChanges).toBe(false);
    });

    it('should serialize complex nested JSON identically', async () => {
      const input: CreateDiffInput = {
        pageId,
        runId: comparisonRunId,
        baselineSnapshotId,
        runSnapshotId,
        summary: {
          hasChanges: true,
          totalChanges: 1,
          visualChanges: 0,
          seoChanges: 0,
          performanceChanges: 1,
          customMetrics: {
            nested: {
              deep: {
                value: 123,
                array: [1, 2, 3],
              },
            },
          },
        },
        changes: [
          {
            type: 'performance',
            path: 'loadTime',
            oldValue: { value: 1000, unit: 'ms', breakdown: { dns: 100, tcp: 200 } },
            newValue: { value: 2000, unit: 'ms', breakdown: { dns: 150, tcp: 250 } },
            metadata: {
              delta: 1000,
              percentChange: 100,
              tags: ['slow', 'needs-optimization'],
            },
          },
        ],
      };

      // Create with SQL repo
      await sqlRepo.create(input);

      // Read back with both repos
      const sqlRead = await sqlRepo.findByPageAndRun(pageId, comparisonRunId);
      const drizzleRead = await drizzleRepo.findByPageAndRun(pageId, comparisonRunId);

      expect(sqlRead?.summary).toEqual(drizzleRead?.summary);
      expect(sqlRead?.changes).toEqual(drizzleRead?.changes);
    });
  });

  describe('findByPageAndRun', () => {
    it('should return identical results', async () => {
      const input: CreateDiffInput = {
        pageId,
        runId: comparisonRunId,
        baselineSnapshotId,
        runSnapshotId,
        summary: {
          hasChanges: true,
          totalChanges: 2,
          visualChanges: 1,
          seoChanges: 1,
          performanceChanges: 0,
        },
        changes: [
          { type: 'visual', path: 'screenshot', oldValue: 'old.png', newValue: 'new.png' },
          { type: 'seo', path: 'description', oldValue: 'Old desc', newValue: 'New desc' },
        ],
      };

      // Create with SQL repo
      await sqlRepo.create(input);

      const sqlFound = await sqlRepo.findByPageAndRun(pageId, comparisonRunId);
      const drizzleFound = await drizzleRepo.findByPageAndRun(pageId, comparisonRunId);

      expect(sqlFound).not.toBeNull();
      expect(drizzleFound).not.toBeNull();
      expect(sqlFound?.id).toBe(drizzleFound?.id);
      expect(sqlFound?.summary).toEqual(drizzleFound?.summary);
      expect(sqlFound?.changes).toEqual(drizzleFound?.changes);
    });

    it('should both return null when not exists', async () => {
      const sqlFound = await sqlRepo.findByPageAndRun('non-existent', comparisonRunId);
      const drizzleFound = await drizzleRepo.findByPageAndRun('non-existent', comparisonRunId);

      expect(sqlFound).toBeNull();
      expect(drizzleFound).toBeNull();
    });

    it('should deserialize JSON identically', async () => {
      const input: CreateDiffInput = {
        pageId,
        runId: comparisonRunId,
        baselineSnapshotId,
        runSnapshotId,
        summary: {
          hasChanges: true,
          totalChanges: 3,
          visualChanges: 1,
          seoChanges: 1,
          performanceChanges: 1,
        },
        changes: [
          { type: 'html', path: 'h1', oldValue: 'A', newValue: 'B' },
          { type: 'seo', path: 'title', oldValue: 'C', newValue: 'D' },
          { type: 'performance', path: 'loadTime', oldValue: 100, newValue: 200 },
        ],
      };

      await sqlRepo.create(input);

      const sqlFound = await sqlRepo.findByPageAndRun(pageId, comparisonRunId);
      const drizzleFound = await drizzleRepo.findByPageAndRun(pageId, comparisonRunId);

      expect(sqlFound?.summary.totalChanges).toBe(3);
      expect(drizzleFound?.summary.totalChanges).toBe(3);
      expect(sqlFound?.changes).toHaveLength(3);
      expect(drizzleFound?.changes).toHaveLength(3);
      expect(sqlFound?.changes).toEqual(drizzleFound?.changes);
    });
  });

  describe('findByRun', () => {
    it('should return identical results for multiple diffs', async () => {
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

      // Create snapshots for second page
      const baseline2Id = 'baseline-2';
      const run2Id = 'run-2';
      const now = new Date().toISOString();

      sqliteDb
        .prepare(
          `INSERT INTO snapshots (id, page_id, run_id, status, http_status, html_hash, headers_json, seo_data_json, captured_at, is_baseline)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          baseline2Id,
          page2Id,
          baselineRunId,
          'completed',
          200,
          'hash3',
          JSON.stringify({}),
          JSON.stringify({}),
          now,
          1,
        );

      sqliteDb
        .prepare(
          `INSERT INTO snapshots (id, page_id, run_id, status, http_status, html_hash, headers_json, seo_data_json, captured_at, is_baseline)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          run2Id,
          page2Id,
          comparisonRunId,
          'completed',
          200,
          'hash4',
          JSON.stringify({}),
          JSON.stringify({}),
          now,
          0,
        );

      // Create diffs
      await sqlRepo.create({
        pageId,
        runId: comparisonRunId,
        baselineSnapshotId,
        runSnapshotId,
        summary: {
          hasChanges: true,
          totalChanges: 1,
          visualChanges: 1,
          seoChanges: 0,
          performanceChanges: 0,
        },
        changes: [{ type: 'visual', path: 'page1' }],
      });

      await sqlRepo.create({
        pageId: page2Id,
        runId: comparisonRunId,
        baselineSnapshotId: baseline2Id,
        runSnapshotId: run2Id,
        summary: {
          hasChanges: true,
          totalChanges: 1,
          visualChanges: 1,
          seoChanges: 0,
          performanceChanges: 0,
        },
        changes: [{ type: 'visual', path: 'page2' }],
      });

      const sqlDiffs = await sqlRepo.findByRun(comparisonRunId);
      const drizzleDiffs = await drizzleRepo.findByRun(comparisonRunId);

      expect(sqlDiffs).toHaveLength(2);
      expect(drizzleDiffs).toHaveLength(2);
      expect(sqlDiffs.map((d) => d.id).sort()).toEqual(drizzleDiffs.map((d) => d.id).sort());
      expect(sqlDiffs.map((d) => d.pageId).sort()).toEqual(
        drizzleDiffs.map((d) => d.pageId).sort(),
      );
    });

    it('should both return empty array when no diffs', async () => {
      const sqlDiffs = await sqlRepo.findByRun('non-existent-run');
      const drizzleDiffs = await drizzleRepo.findByRun('non-existent-run');

      expect(sqlDiffs).toEqual([]);
      expect(drizzleDiffs).toEqual([]);
    });

    it('should order by created_at DESC identically', async () => {
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

      const baseline2Id = 'baseline-2';
      const run2Id = 'run-2';
      const now = new Date().toISOString();

      sqliteDb
        .prepare(
          `INSERT INTO snapshots (id, page_id, run_id, status, http_status, html_hash, headers_json, seo_data_json, captured_at, is_baseline)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          baseline2Id,
          page2Id,
          baselineRunId,
          'completed',
          200,
          'hash',
          JSON.stringify({}),
          JSON.stringify({}),
          now,
          1,
        );

      sqliteDb
        .prepare(
          `INSERT INTO snapshots (id, page_id, run_id, status, http_status, html_hash, headers_json, seo_data_json, captured_at, is_baseline)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          run2Id,
          page2Id,
          comparisonRunId,
          'completed',
          200,
          'hash',
          JSON.stringify({}),
          JSON.stringify({}),
          now,
          0,
        );

      const diff1 = await sqlRepo.create({
        pageId,
        runId: comparisonRunId,
        baselineSnapshotId,
        runSnapshotId,
        summary: {
          hasChanges: false,
          totalChanges: 0,
          visualChanges: 0,
          seoChanges: 0,
          performanceChanges: 0,
        },
        changes: [],
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const diff2 = await sqlRepo.create({
        pageId: page2Id,
        runId: comparisonRunId,
        baselineSnapshotId: baseline2Id,
        runSnapshotId: run2Id,
        summary: {
          hasChanges: false,
          totalChanges: 0,
          visualChanges: 0,
          seoChanges: 0,
          performanceChanges: 0,
        },
        changes: [],
      });

      const sqlDiffs = await sqlRepo.findByRun(comparisonRunId);
      const drizzleDiffs = await drizzleRepo.findByRun(comparisonRunId);

      // Both should return newest first
      expect(sqlDiffs[0].id).toBe(diff2.id);
      expect(drizzleDiffs[0].id).toBe(diff2.id);
      expect(sqlDiffs[1].id).toBe(diff1.id);
      expect(drizzleDiffs[1].id).toBe(diff1.id);
    });
  });
});
