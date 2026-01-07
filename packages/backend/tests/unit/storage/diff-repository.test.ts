/**
 * DiffRepository unit tests
 */

import { DiffSeverity, DiffStatus, DiffType } from '@gander-tools/diff-voyager-shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../../src/storage/database.js';
import { DiffRepository } from '../../../src/storage/repositories/diff-repository.js';
import { PageRepository } from '../../../src/storage/repositories/page-repository.js';
import { ProjectRepository } from '../../../src/storage/repositories/project-repository.js';
import { RunRepository } from '../../../src/storage/repositories/run-repository.js';
import { SnapshotRepository } from '../../../src/storage/repositories/snapshot-repository.js';
import { cleanupTestDb, createTestDb, type TestDatabase } from '../../helpers/test-db.js';

describe('DiffRepository', () => {
  let db: TestDatabase;
  let repo: DiffRepository;
  let projectRepo: ProjectRepository;
  let runRepo: RunRepository;
  let pageRepo: PageRepository;
  let snapshotRepo: SnapshotRepository;

  // Test fixture IDs
  let projectId: string;
  let baselineRunId: string;
  let comparisonRunId: string;
  let pageId: string;
  let baselineSnapshotId: string;
  let comparisonSnapshotId: string;

  beforeEach(async () => {
    db = await createTestDb();
    // Run migrations
    createDatabase({ dbPath: db.name, baseDir: '', artifactsDir: '' });
    db.close();
    db = (await import('better-sqlite3')).default(db.name);

    repo = new DiffRepository(db);
    projectRepo = new ProjectRepository(db);
    runRepo = new RunRepository(db);
    pageRepo = new PageRepository(db);
    snapshotRepo = new SnapshotRepository(db);

    // Create test fixtures to satisfy foreign key constraints
    const project = await projectRepo.create({
      name: 'Test Project',
      baseUrl: 'http://localhost:3456',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.01,
      },
    });
    projectId = project.id;

    const baselineRun = await runRepo.create({
      projectId,
      isBaseline: true,
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.01,
      },
    });
    baselineRunId = baselineRun.id;

    const comparisonRun = await runRepo.create({
      projectId,
      isBaseline: false,
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.01,
      },
    });
    comparisonRunId = comparisonRun.id;

    const page = await pageRepo.create({
      projectId,
      normalizedUrl: '/test-page',
      originalUrl: 'http://localhost:3456/test-page',
    });
    pageId = page.id;

    const baselineSnapshot = await snapshotRepo.create({
      pageId,
      runId: baselineRunId,
      isBaseline: true,
      capturedAt: new Date(),
      httpStatus: 200,
      htmlHash: 'hash1',
      headers: {},
      seo: {},
      hasScreenshot: false,
      hasHar: false,
      hasDiff: false,
    });
    baselineSnapshotId = baselineSnapshot.id;

    const comparisonSnapshot = await snapshotRepo.create({
      pageId,
      runId: comparisonRunId,
      isBaseline: false,
      capturedAt: new Date(),
      httpStatus: 200,
      htmlHash: 'hash2',
      headers: {},
      seo: {},
      hasScreenshot: false,
      hasHar: false,
      hasDiff: false,
    });
    comparisonSnapshotId = comparisonSnapshot.id;
  });

  afterEach(async () => {
    await cleanupTestDb(db);
  });

  describe('create', () => {
    it('should create diff with summary and changes', async () => {
      const diff = await repo.create({
        pageId,
        runId: comparisonRunId,
        baselineSnapshotId,
        runSnapshotId: comparisonSnapshotId,
        summary: {
          totalChanges: 2,
          criticalChanges: 1,
          acceptedChanges: 0,
          mutedChanges: 0,
          changesByType: {
            [DiffType.SEO]: 1,
            [DiffType.VISUAL]: 1,
            [DiffType.CONTENT]: 0,
            [DiffType.PERFORMANCE]: 0,
            [DiffType.HEADER]: 0,
          },
          thresholdExceeded: true,
        },
        changes: [
          {
            id: 'change-1',
            type: DiffType.SEO,
            severity: DiffSeverity.CRITICAL,
            status: DiffStatus.NEW,
            description: 'Title changed',
            details: {
              field: 'title',
              oldValue: 'Old Title',
              newValue: 'New Title',
            },
          },
          {
            id: 'change-2',
            type: DiffType.VISUAL,
            severity: DiffSeverity.WARNING,
            status: DiffStatus.NEW,
            description: 'Visual difference detected',
            details: {
              metadata: {
                diffPercentage: 2.5,
                diffPixels: 1200,
              },
            },
          },
        ],
      });

      expect(diff.id).toBeDefined();
      expect(diff.pageId).toBe(pageId);
      expect(diff.runId).toBe(comparisonRunId);
      expect(diff.baselineSnapshotId).toBe(baselineSnapshotId);
      expect(diff.runSnapshotId).toBe(comparisonSnapshotId);
      expect(diff.summary.totalChanges).toBe(2);
      expect(diff.summary.criticalChanges).toBe(1);
      expect(diff.changes).toHaveLength(2);
    });

    it('should generate UUID for new diff', async () => {
      const diff = await repo.create({
        pageId,
        runId: comparisonRunId,
        baselineSnapshotId,
        runSnapshotId: comparisonSnapshotId,
        summary: {
          totalChanges: 0,
          criticalChanges: 0,
          acceptedChanges: 0,
          mutedChanges: 0,
          changesByType: {
            [DiffType.SEO]: 0,
            [DiffType.VISUAL]: 0,
            [DiffType.CONTENT]: 0,
            [DiffType.PERFORMANCE]: 0,
            [DiffType.HEADER]: 0,
          },
          thresholdExceeded: false,
        },
        changes: [],
      });

      expect(diff.id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should serialize summary_json and changes_json', async () => {
      const summary = {
        totalChanges: 1,
        criticalChanges: 0,
        acceptedChanges: 0,
        mutedChanges: 0,
        changesByType: {
          [DiffType.SEO]: 1,
          [DiffType.VISUAL]: 0,
          [DiffType.CONTENT]: 0,
          [DiffType.PERFORMANCE]: 0,
          [DiffType.HEADER]: 0,
        },
        thresholdExceeded: false,
      };

      const changes = [
        {
          id: 'change-1',
          type: DiffType.SEO,
          severity: DiffSeverity.INFO,
          status: DiffStatus.NEW,
          description: 'Meta description changed',
          details: {
            field: 'metaDescription',
            oldValue: 'Old description',
            newValue: 'New description',
          },
        },
      ];

      const diff = await repo.create({
        pageId,
        runId: comparisonRunId,
        baselineSnapshotId,
        runSnapshotId: comparisonSnapshotId,
        summary,
        changes,
      });

      // Verify the data was properly serialized and deserialized
      expect(diff.summary).toEqual(summary);
      expect(diff.changes).toEqual(changes);
    });

    it('should set created_at timestamp', async () => {
      const beforeCreate = new Date();

      const diff = await repo.create({
        pageId,
        runId: comparisonRunId,
        baselineSnapshotId,
        runSnapshotId: comparisonSnapshotId,
        summary: {
          totalChanges: 0,
          criticalChanges: 0,
          acceptedChanges: 0,
          mutedChanges: 0,
          changesByType: {
            [DiffType.SEO]: 0,
            [DiffType.VISUAL]: 0,
            [DiffType.CONTENT]: 0,
            [DiffType.PERFORMANCE]: 0,
            [DiffType.HEADER]: 0,
          },
          thresholdExceeded: false,
        },
        changes: [],
      });

      const afterCreate = new Date();

      expect(diff.createdAt).toBeInstanceOf(Date);
      expect(diff.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(diff.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('findByPageAndRun', () => {
    it('should find diff by pageId and runId', async () => {
      // Create a diff first
      const created = await repo.create({
        pageId,
        runId: comparisonRunId,
        baselineSnapshotId,
        runSnapshotId: comparisonSnapshotId,
        summary: {
          totalChanges: 1,
          criticalChanges: 0,
          acceptedChanges: 0,
          mutedChanges: 0,
          changesByType: {
            [DiffType.SEO]: 1,
            [DiffType.VISUAL]: 0,
            [DiffType.CONTENT]: 0,
            [DiffType.PERFORMANCE]: 0,
            [DiffType.HEADER]: 0,
          },
          thresholdExceeded: false,
        },
        changes: [
          {
            id: 'change-1',
            type: DiffType.SEO,
            severity: DiffSeverity.INFO,
            status: DiffStatus.NEW,
            description: 'Test change',
            details: {},
          },
        ],
      });

      // Find it
      const found = await repo.findByPageAndRun(pageId, comparisonRunId);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.pageId).toBe(pageId);
      expect(found?.runId).toBe(comparisonRunId);
      expect(found?.summary.totalChanges).toBe(1);
      expect(found?.changes).toHaveLength(1);
    });

    it('should return null when diff not found', async () => {
      const found = await repo.findByPageAndRun('non-existent-page', 'non-existent-run');
      expect(found).toBeNull();
    });

    it('should deserialize JSON fields correctly', async () => {
      const summary = {
        totalChanges: 2,
        criticalChanges: 1,
        acceptedChanges: 0,
        mutedChanges: 0,
        changesByType: {
          [DiffType.SEO]: 1,
          [DiffType.VISUAL]: 1,
          [DiffType.CONTENT]: 0,
          [DiffType.PERFORMANCE]: 0,
          [DiffType.HEADER]: 0,
        },
        visualDiffPercentage: 2.5,
        visualDiffPixels: 1200,
        thresholdExceeded: true,
      };

      const changes = [
        {
          id: 'change-1',
          type: DiffType.SEO,
          severity: DiffSeverity.CRITICAL,
          status: DiffStatus.NEW,
          description: 'Title changed',
          details: {
            field: 'title',
            oldValue: 'Old Title',
            newValue: 'New Title',
          },
        },
        {
          id: 'change-2',
          type: DiffType.VISUAL,
          severity: DiffSeverity.WARNING,
          status: DiffStatus.NEW,
          description: 'Visual difference',
          details: {
            metadata: {
              diffPercentage: 2.5,
            },
          },
        },
      ];

      await repo.create({
        pageId,
        runId: comparisonRunId,
        baselineSnapshotId,
        runSnapshotId: comparisonSnapshotId,
        summary,
        changes,
      });

      const found = await repo.findByPageAndRun(pageId, comparisonRunId);

      expect(found?.summary).toEqual(summary);
      expect(found?.changes).toEqual(changes);
    });
  });

  describe('findByRun', () => {
    it('should find all diffs for a run', async () => {
      // Create a second page for testing multiple diffs
      const page2 = await pageRepo.create({
        projectId,
        normalizedUrl: '/test-page-2',
        originalUrl: 'http://localhost:3456/test-page-2',
      });

      const baselineSnapshot2 = await snapshotRepo.create({
        pageId: page2.id,
        runId: baselineRunId,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'hash3',
        headers: {},
        seo: {},
        hasScreenshot: false,
        hasHar: false,
        hasDiff: false,
      });

      const comparisonSnapshot2 = await snapshotRepo.create({
        pageId: page2.id,
        runId: comparisonRunId,
        isBaseline: false,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'hash4',
        headers: {},
        seo: {},
        hasScreenshot: false,
        hasHar: false,
        hasDiff: false,
      });

      // Create two diffs for the same run
      await repo.create({
        pageId,
        runId: comparisonRunId,
        baselineSnapshotId,
        runSnapshotId: comparisonSnapshotId,
        summary: {
          totalChanges: 1,
          criticalChanges: 0,
          acceptedChanges: 0,
          mutedChanges: 0,
          changesByType: {
            [DiffType.SEO]: 1,
            [DiffType.VISUAL]: 0,
            [DiffType.CONTENT]: 0,
            [DiffType.PERFORMANCE]: 0,
            [DiffType.HEADER]: 0,
          },
          thresholdExceeded: false,
        },
        changes: [],
      });

      await repo.create({
        pageId: page2.id,
        runId: comparisonRunId,
        baselineSnapshotId: baselineSnapshot2.id,
        runSnapshotId: comparisonSnapshot2.id,
        summary: {
          totalChanges: 2,
          criticalChanges: 1,
          acceptedChanges: 0,
          mutedChanges: 0,
          changesByType: {
            [DiffType.SEO]: 2,
            [DiffType.VISUAL]: 0,
            [DiffType.CONTENT]: 0,
            [DiffType.PERFORMANCE]: 0,
            [DiffType.HEADER]: 0,
          },
          thresholdExceeded: false,
        },
        changes: [],
      });

      // Find all diffs for the run
      const diffs = await repo.findByRun(comparisonRunId);

      expect(diffs).toHaveLength(2);
      expect(diffs[0].runId).toBe(comparisonRunId);
      expect(diffs[1].runId).toBe(comparisonRunId);
    });

    it('should return empty array when no diffs', async () => {
      const diffs = await repo.findByRun('non-existent-run');
      expect(diffs).toEqual([]);
    });

    it('should order by created_at DESC', async () => {
      // Create first diff
      const diff1 = await repo.create({
        pageId,
        runId: comparisonRunId,
        baselineSnapshotId,
        runSnapshotId: comparisonSnapshotId,
        summary: {
          totalChanges: 1,
          criticalChanges: 0,
          acceptedChanges: 0,
          mutedChanges: 0,
          changesByType: {
            [DiffType.SEO]: 1,
            [DiffType.VISUAL]: 0,
            [DiffType.CONTENT]: 0,
            [DiffType.PERFORMANCE]: 0,
            [DiffType.HEADER]: 0,
          },
          thresholdExceeded: false,
        },
        changes: [],
      });

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create a second page and diff
      const page2 = await pageRepo.create({
        projectId,
        normalizedUrl: '/test-page-2',
        originalUrl: 'http://localhost:3456/test-page-2',
      });

      const baselineSnapshot2 = await snapshotRepo.create({
        pageId: page2.id,
        runId: baselineRunId,
        isBaseline: true,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'hash3',
        headers: {},
        seo: {},
        hasScreenshot: false,
        hasHar: false,
        hasDiff: false,
      });

      const comparisonSnapshot2 = await snapshotRepo.create({
        pageId: page2.id,
        runId: comparisonRunId,
        isBaseline: false,
        capturedAt: new Date(),
        httpStatus: 200,
        htmlHash: 'hash4',
        headers: {},
        seo: {},
        hasScreenshot: false,
        hasHar: false,
        hasDiff: false,
      });

      const diff2 = await repo.create({
        pageId: page2.id,
        runId: comparisonRunId,
        baselineSnapshotId: baselineSnapshot2.id,
        runSnapshotId: comparisonSnapshot2.id,
        summary: {
          totalChanges: 2,
          criticalChanges: 1,
          acceptedChanges: 0,
          mutedChanges: 0,
          changesByType: {
            [DiffType.SEO]: 2,
            [DiffType.VISUAL]: 0,
            [DiffType.CONTENT]: 0,
            [DiffType.PERFORMANCE]: 0,
            [DiffType.HEADER]: 0,
          },
          thresholdExceeded: false,
        },
        changes: [],
      });

      // Find all diffs - should be ordered DESC by created_at
      const diffs = await repo.findByRun(comparisonRunId);

      expect(diffs).toHaveLength(2);
      // Most recent diff (diff2) should be first
      expect(diffs[0].id).toBe(diff2.id);
      expect(diffs[1].id).toBe(diff1.id);
    });
  });
});
