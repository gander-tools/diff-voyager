/**
 * DiffRepositoryDrizzle unit tests (TDD) - FINAL REPOSITORY!
 * These tests are written BEFORE the implementation
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../../src/storage/database.js';
import { createDrizzleDb, type DrizzleDb } from '../../../src/storage/drizzle/db.js';
import { DiffRepositoryDrizzle } from '../../../src/storage/repositories/diff-repository.drizzle.js';
import type { CreateDiffInput } from '../../../src/storage/repositories/diff-repository.js';
import { cleanupTestDb, createTestDb, type TestDatabase } from '../../helpers/test-db.js';

describe('DiffRepositoryDrizzle - FINAL MIGRATION!', () => {
  let sqliteDb: TestDatabase;
  let drizzleDb: DrizzleDb;
  let repo: DiffRepositoryDrizzle;
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
    repo = new DiffRepositoryDrizzle(drizzleDb);

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

    // Create baseline run
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

    // Create comparison run
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

    // Create baseline snapshot (for baseline run)
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

    // Create comparison snapshot (for comparison run)
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
    it('should insert diff record with all fields', async () => {
      const input: CreateDiffInput = {
        pageId,
        runId: comparisonRunId,
        baselineSnapshotId,
        runSnapshotId,
        summary: {
          hasChanges: true,
          totalChanges: 5,
          visualChanges: 2,
          seoChanges: 1,
          performanceChanges: 2,
        },
        changes: [
          {
            type: 'html',
            path: 'body > h1',
            oldValue: 'Old Heading',
            newValue: 'New Heading',
          },
          {
            type: 'seo',
            path: 'title',
            oldValue: 'Old Title',
            newValue: 'New Title',
          },
        ],
      };

      const diff = await repo.create(input);

      expect(diff.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(diff.pageId).toBe(pageId);
      expect(diff.runId).toBe(comparisonRunId);
      expect(diff.baselineSnapshotId).toBe(baselineSnapshotId);
      expect(diff.runSnapshotId).toBe(runSnapshotId);
      expect(diff.summary).toEqual(input.summary);
      expect(diff.changes).toEqual(input.changes);
      expect(diff.createdAt).toBeInstanceOf(Date);
    });

    it('should handle empty changes array', async () => {
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

      const diff = await repo.create(input);

      expect(diff.changes).toEqual([]);
      expect(diff.summary.hasChanges).toBe(false);
    });

    it('should serialize complex nested JSON', async () => {
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
              },
            },
          },
        },
        changes: [
          {
            type: 'performance',
            path: 'loadTime',
            oldValue: { value: 1000, unit: 'ms' },
            newValue: { value: 2000, unit: 'ms' },
            metadata: {
              delta: 1000,
              percentChange: 100,
            },
          },
        ],
      };

      const diff = await repo.create(input);

      expect(diff.summary).toEqual(input.summary);
      expect(diff.changes).toEqual(input.changes);
    });
  });

  describe('findByPageAndRun', () => {
    it('should return diff for page-run combination', async () => {
      const created = await repo.create({
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
        changes: [
          {
            type: 'visual',
            path: 'screenshot',
            oldValue: 'baseline.png',
            newValue: 'run.png',
          },
        ],
      });

      const found = await repo.findByPageAndRun(pageId, comparisonRunId);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.summary).toEqual(created.summary);
      expect(found?.changes).toEqual(created.changes);
    });

    it('should return null when not exists', async () => {
      const found = await repo.findByPageAndRun('non-existent', comparisonRunId);
      expect(found).toBeNull();
    });

    it('should properly deserialize JSON columns', async () => {
      const _created = await repo.create({
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
      });

      const found = await repo.findByPageAndRun(pageId, comparisonRunId);

      expect(found?.summary.totalChanges).toBe(3);
      expect(found?.changes).toHaveLength(3);
      expect(found?.changes[0].type).toBe('html');
      expect(found?.changes[1].type).toBe('seo');
      expect(found?.changes[2].type).toBe('performance');
    });
  });

  describe('findByRun', () => {
    it('should return all diffs for run', async () => {
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
      await repo.create({
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

      await repo.create({
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

      const diffs = await repo.findByRun(comparisonRunId);

      expect(diffs).toHaveLength(2);
      expect(diffs.map((d) => d.pageId).sort()).toEqual([pageId, page2Id].sort());
    });

    it('should return empty array when no diffs', async () => {
      const diffs = await repo.findByRun('non-existent-run');
      expect(diffs).toEqual([]);
    });

    it('should order by created_at DESC', async () => {
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

      const diff1 = await repo.create({
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

      const diff2 = await repo.create({
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

      const diffs = await repo.findByRun(comparisonRunId);

      // Newest first
      expect(diffs[0].id).toBe(diff2.id);
      expect(diffs[1].id).toBe(diff1.id);
    });
  });
});
