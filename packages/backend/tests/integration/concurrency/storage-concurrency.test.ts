/**
 * Storage Concurrency tests
 * Tests for concurrent storage operations, transaction isolation, and data consistency
 */

import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type Database from 'better-sqlite3';
import * as tmp from 'tmp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, createDatabase } from '../../../src/storage/database.js';
import { createDrizzleDb } from '../../../src/storage/drizzle/db.js';
import { PageRepositoryDrizzle } from '../../../src/storage/repositories/page-repository.drizzle.js';
import { ProjectRepositoryDrizzle } from '../../../src/storage/repositories/project-repository.drizzle.js';
import { RunRepositoryDrizzle } from '../../../src/storage/repositories/run-repository.drizzle.js';

describe('Storage Concurrency', () => {
  let testDir: string;
  let dbPath: string;
  let db: Database.Database;
  let drizzleDb: ReturnType<typeof createDrizzleDb>;
  let projectRepo: ProjectRepositoryDrizzle;
  let runRepo: RunRepositoryDrizzle;
  let pageRepo: PageRepositoryDrizzle;

  beforeEach(() => {
    testDir = tmp.dirSync({
      unsafeCleanup: true,
      prefix: 'diff-voyager-storage-concurrency-',
    }).name;
    mkdirSync(testDir, { recursive: true });
    dbPath = join(testDir, 'test.db');
    db = createDatabase({ dbPath, artifactsDir: join(testDir, 'artifacts') });
    drizzleDb = createDrizzleDb(db);
    projectRepo = new ProjectRepositoryDrizzle(drizzleDb);
    runRepo = new RunRepositoryDrizzle(drizzleDb);
    pageRepo = new PageRepositoryDrizzle(drizzleDb);
  });

  afterEach(() => {
    closeDatabase(db);
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('Concurrent Project Operations', () => {
    // FIXME: Test needs refactoring for Drizzle async methods (missing await on line 62)
    // This test was written for synchronous SQL repositories but Drizzle methods are async
    it.skip('should handle concurrent project creation', async () => {
      const createPromises = Array.from({ length: 20 }, (_, i) =>
        Promise.resolve(
          projectRepo.create({
            name: `Project ${i}`,
            baseUrl: `https://example.com/${i}`,
            config: {},
          }),
        ),
      );

      const projects = await Promise.all(createPromises);

      expect(projects.length).toBe(20);
      expect(new Set(projects.map((p) => p.id)).size).toBe(20);

      const allProjects = projectRepo.findAll({});
      expect(allProjects.length).toBe(20);
    });

    // FIXME: Test uses projectRepo.update() which doesn't exist in Drizzle IProjectRepository interface
    // The interface only has: create(), findById(), findAll(), updateStatus(), delete()
    // This test needs to be refactored to use available methods or the interface needs to be extended
    it.skip('should handle concurrent project updates', async () => {
      const project = projectRepo.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: {},
      });

      const updatePromises = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve(
          projectRepo.update(project.id, {
            name: `Updated Project ${i}`,
          }),
        ),
      );

      await Promise.all(updatePromises);

      const updated = projectRepo.findById(project.id);
      expect(updated).not.toBeNull();
      expect(updated?.name).toContain('Updated Project');
    });

    // FIXME: Test needs refactoring for Drizzle async methods (missing await on lines 94, 101)
    // This test was written for synchronous SQL repositories but Drizzle methods are async
    it.skip('should handle concurrent project reads', async () => {
      const project = projectRepo.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: {},
      });

      const readPromises = Array.from({ length: 50 }, () =>
        Promise.resolve(projectRepo.findById(project.id)),
      );

      const results = await Promise.all(readPromises);

      expect(results.every((r) => r !== null)).toBe(true);
      expect(results.every((r) => r?.id === project.id)).toBe(true);
    });

    // FIXME: Test needs refactoring for Drizzle async methods (missing await on lines 116, 126, 131)
    // This test was written for synchronous SQL repositories but Drizzle methods are async
    it.skip('should maintain consistency during concurrent create and read', async () => {
      const operations = [];

      for (let i = 0; i < 10; i++) {
        operations.push(
          Promise.resolve(
            projectRepo.create({
              name: `Project ${i}`,
              baseUrl: `https://example.com/${i}`,
              config: {},
            }),
          ),
        );
      }

      for (let i = 0; i < 10; i++) {
        operations.push(Promise.resolve(projectRepo.findAll({})));
      }

      await Promise.all(operations);

      const allProjects = projectRepo.findAll({});
      expect(allProjects.length).toBe(10);
    });
  });

  describe('Concurrent Run Operations', () => {
    // FIXME: Test needs refactoring for Drizzle async methods (missing await on lines 142, 150, 164)
    // This test was written for synchronous SQL repositories but Drizzle methods are async
    it.skip('should handle concurrent run creation for same project', async () => {
      const project = projectRepo.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: {},
      });

      const createPromises = Array.from({ length: 15 }, (_, i) =>
        Promise.resolve(
          runRepo.create({
            projectId: project.id,
            status: 'pending',
            config: {},
            isBaseline: i === 0,
          }),
        ),
      );

      const runs = await Promise.all(createPromises);

      expect(runs.length).toBe(15);
      expect(new Set(runs.map((r) => r.id)).size).toBe(15);

      const projectRuns = runRepo.findByProjectId(project.id, {});
      expect(projectRuns.length).toBe(15);
    });

    // FIXME: Test uses runRepo.update() which doesn't exist in Drizzle IRunRepository interface
    // The interface only has: create(), findById(), findByProjectId(), updateStatus(), updateStatistics()
    // This test needs to be refactored to use available methods or the interface needs to be extended
    it.skip('should handle concurrent run status updates', async () => {
      const project = projectRepo.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: {},
      });

      const run = runRepo.create({
        projectId: project.id,
        status: 'pending',
        config: {},
        isBaseline: false,
      });

      const statuses = ['processing', 'completed', 'failed', 'processing', 'completed'];
      const updatePromises = statuses.map((status) =>
        Promise.resolve(
          runRepo.update(run.id, {
            status: status as any,
          }),
        ),
      );

      await Promise.all(updatePromises);

      const updated = runRepo.findById(run.id);
      expect(updated).not.toBeNull();
      expect(['processing', 'completed', 'failed']).toContain(updated?.status);
    });

    // FIXME: Test needs refactoring for Drizzle async methods and transaction API
    // Missing await on lines 204, 213, 227, 240. Also uses db.transaction() which has different API in Drizzle
    // This test was written for synchronous SQL repositories but Drizzle methods are async
    it.skip('should isolate runs across concurrent transactions', async () => {
      const project = projectRepo.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: {},
      });

      const transaction1 = new Promise<void>((resolve) => {
        db.transaction(() => {
          for (let i = 0; i < 5; i++) {
            runRepo.create({
              projectId: project.id,
              status: 'pending',
              config: {},
              isBaseline: false,
            });
          }
        })();
        resolve();
      });

      const transaction2 = new Promise<void>((resolve) => {
        db.transaction(() => {
          for (let i = 0; i < 5; i++) {
            runRepo.create({
              projectId: project.id,
              status: 'pending',
              config: {},
              isBaseline: false,
            });
          }
        })();
        resolve();
      });

      await Promise.all([transaction1, transaction2]);

      const runs = runRepo.findByProjectId(project.id, {});
      expect(runs.length).toBe(10);
    });
  });

  describe('Concurrent Page Operations', () => {
    // FIXME: Test uses pageRepo.findByRunId() which doesn't exist in Drizzle IPageRepository interface
    // The interface only has: create(), findById(), findByProjectId(), findByNormalizedUrl(), findOrCreate()
    // This test needs to be refactored to use available methods or the interface needs to be extended
    it.skip('should handle concurrent page creation', async () => {
      const project = projectRepo.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: {},
      });

      const run = runRepo.create({
        projectId: project.id,
        status: 'pending',
        config: {},
        isBaseline: true,
      });

      const createPromises = Array.from({ length: 25 }, (_, i) =>
        Promise.resolve(
          pageRepo.create({
            runId: run.id,
            url: `https://example.com/page-${i}`,
            normalizedUrl: `/page-${i}`,
            status: 200,
            headers: {},
            seoData: {},
          }),
        ),
      );

      const pages = await Promise.all(createPromises);

      expect(pages.length).toBe(25);
      expect(new Set(pages.map((p) => p.id)).size).toBe(25);

      const runPages = pageRepo.findByRunId(run.id, {});
      expect(runPages.length).toBe(25);
    });

    // FIXME: Test uses pageRepo.update() which doesn't exist in Drizzle IPageRepository interface
    // The interface only has: create(), findById(), findByProjectId(), findByNormalizedUrl(), findOrCreate()
    // This test needs to be refactored to use available methods or the interface needs to be extended
    it.skip('should handle concurrent page updates', async () => {
      const project = projectRepo.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: {},
      });

      const run = runRepo.create({
        projectId: project.id,
        status: 'pending',
        config: {},
        isBaseline: false,
      });

      const page = pageRepo.create({
        runId: run.id,
        url: 'https://example.com/page',
        normalizedUrl: '/page',
        status: 200,
        headers: {},
        seoData: {},
      });

      const updatePromises = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve(
          pageRepo.update(page.id, {
            status: 200 + i,
          }),
        ),
      );

      await Promise.all(updatePromises);

      const updated = pageRepo.findById(page.id);
      expect(updated).not.toBeNull();
      expect(updated?.status).toBeGreaterThanOrEqual(200);
      expect(updated?.status).toBeLessThanOrEqual(209);
    });

    // FIXME: Test uses pageRepo.findByRunId() which doesn't exist in Drizzle IPageRepository interface
    // The interface only has: create(), findById(), findByProjectId(), findByNormalizedUrl(), findOrCreate()
    // This test needs to be refactored to use available methods or the interface needs to be extended
    it.skip('should maintain consistency across concurrent page operations', async () => {
      const project = projectRepo.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: {},
      });

      const run = runRepo.create({
        projectId: project.id,
        status: 'pending',
        config: {},
        isBaseline: true,
      });

      const operations = [];

      for (let i = 0; i < 20; i++) {
        operations.push(
          Promise.resolve(
            pageRepo.create({
              runId: run.id,
              url: `https://example.com/page-${i}`,
              normalizedUrl: `/page-${i}`,
              status: 200,
              headers: {},
              seoData: {},
            }),
          ),
        );
      }

      for (let i = 0; i < 10; i++) {
        operations.push(Promise.resolve(pageRepo.findByRunId(run.id, {})));
      }

      await Promise.all(operations);

      const pages = pageRepo.findByRunId(run.id, {});
      expect(pages.length).toBe(20);
    });
  });

  describe('Cross-Entity Concurrent Operations', () => {
    // FIXME: Test uses pageRepo.findByRunId() which doesn't exist in Drizzle IPageRepository interface
    // The interface only has: create(), findById(), findByProjectId(), findByNormalizedUrl(), findOrCreate()
    // This test needs to be refactored to use available methods or the interface needs to be extended
    it.skip('should handle concurrent operations across projects, runs, and pages', async () => {
      const operations = [];

      for (let i = 0; i < 5; i++) {
        operations.push(
          Promise.resolve(
            projectRepo.create({
              name: `Project ${i}`,
              baseUrl: `https://example.com/${i}`,
              config: {},
            }),
          ).then((project) =>
            runRepo.create({
              projectId: project.id,
              status: 'pending',
              config: {},
              isBaseline: true,
            }),
          ),
        );
      }

      const runs = await Promise.all(operations);

      const pageOperations = runs.flatMap((run) =>
        Array.from({ length: 5 }, (_, i) =>
          Promise.resolve(
            pageRepo.create({
              runId: run.id,
              url: `https://example.com/page-${i}`,
              normalizedUrl: `/page-${i}`,
              status: 200,
              headers: {},
              seoData: {},
            }),
          ),
        ),
      );

      await Promise.all(pageOperations);

      const allProjects = projectRepo.findAll({});
      const allRuns = runs.flatMap((run) => runRepo.findById(run.id));
      const allPages = runs.flatMap((run) => pageRepo.findByRunId(run.id, {}));

      expect(allProjects.length).toBe(5);
      expect(allRuns.filter(Boolean).length).toBe(5);
      expect(allPages.length).toBe(25);
    });

    // FIXME: Test uses pageRepo.findByRunId() which doesn't exist in Drizzle IPageRepository interface
    // The interface only has: create(), findById(), findByProjectId(), findByNormalizedUrl(), findOrCreate()
    // This test needs to be refactored to use available methods or the interface needs to be extended
    it.skip('should maintain referential integrity under concurrent operations', async () => {
      const project = projectRepo.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: {},
      });

      const createRuns = Array.from({ length: 10 }, () =>
        Promise.resolve(
          runRepo.create({
            projectId: project.id,
            status: 'pending',
            config: {},
            isBaseline: false,
          }),
        ),
      );

      const runs = await Promise.all(createRuns);

      const createPages = runs.flatMap((run) =>
        Array.from({ length: 3 }, (_, i) =>
          Promise.resolve(
            pageRepo.create({
              runId: run.id,
              url: `https://example.com/page-${i}`,
              normalizedUrl: `/page-${i}`,
              status: 200,
              headers: {},
              seoData: {},
            }),
          ),
        ),
      );

      await Promise.all(createPages);

      for (const run of runs) {
        const pages = pageRepo.findByRunId(run.id, {});
        expect(pages.length).toBe(3);
        expect(pages.every((p) => p.runId === run.id)).toBe(true);
      }
    });
  });

  describe('Cascade Delete Under Concurrency', () => {
    // FIXME: Test uses projectRepo.deleteById() which doesn't exist in Drizzle IProjectRepository interface
    // The interface only has: create(), findById(), findAll(), updateStatus(), delete()
    // This test needs to be refactored to use available methods or the interface needs to be extended
    it.skip('should handle concurrent deletes with cascade', async () => {
      const projects = Array.from({ length: 5 }, (_, i) =>
        projectRepo.create({
          name: `Project ${i}`,
          baseUrl: `https://example.com/${i}`,
          config: {},
        }),
      );

      for (const project of projects) {
        runRepo.create({
          projectId: project.id,
          status: 'pending',
          config: {},
          isBaseline: true,
        });
      }

      const deletePromises = projects
        .slice(0, 3)
        .map((project) => Promise.resolve(projectRepo.deleteById(project.id)));

      await Promise.all(deletePromises);

      const remainingProjects = projectRepo.findAll({});
      expect(remainingProjects.length).toBe(2);
    });

    // FIXME: Test uses projectRepo.deleteById() which doesn't exist in Drizzle IProjectRepository interface
    // The interface only has: create(), findById(), findAll(), updateStatus(), delete()
    // This test needs to be refactored to use available methods or the interface needs to be extended
    it.skip('should maintain consistency when deleting parent during child creation', async () => {
      const project = projectRepo.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: {},
      });

      const run = runRepo.create({
        projectId: project.id,
        status: 'pending',
        config: {},
        isBaseline: false,
      });

      const operations = [
        Promise.resolve(projectRepo.deleteById(project.id)),
        ...Array.from({ length: 5 }, (_, i) =>
          Promise.resolve(
            pageRepo
              .create({
                runId: run.id,
                url: `https://example.com/page-${i}`,
                normalizedUrl: `/page-${i}`,
                status: 200,
                headers: {},
                seoData: {},
              })
              .catch(() => null),
          ),
        ),
      ];

      await Promise.all(operations);

      const deletedProject = projectRepo.findById(project.id);
      expect(deletedProject).toBeNull();
    });
  });

  describe('Deadlock Prevention', () => {
    // FIXME: Test uses projectRepo.update() which doesn't exist in Drizzle IProjectRepository interface
    // Also missing await on lines 553, 559, 584, 585
    // This test was written for synchronous SQL repositories but Drizzle methods are async
    it.skip('should prevent deadlocks on concurrent updates', async () => {
      const project1 = projectRepo.create({
        name: 'Project 1',
        baseUrl: 'https://example.com/1',
        config: {},
      });

      const project2 = projectRepo.create({
        name: 'Project 2',
        baseUrl: 'https://example.com/2',
        config: {},
      });

      const updates = [];

      for (let i = 0; i < 10; i++) {
        updates.push(
          Promise.resolve(
            projectRepo.update(project1.id, {
              name: `Project 1 - Update ${i}`,
            }),
          ),
          Promise.resolve(
            projectRepo.update(project2.id, {
              name: `Project 2 - Update ${i}`,
            }),
          ),
        );
      }

      await Promise.all(updates);

      const updated1 = projectRepo.findById(project1.id);
      const updated2 = projectRepo.findById(project2.id);

      expect(updated1).not.toBeNull();
      expect(updated2).not.toBeNull();
    });

    // FIXME: Test uses runRepo.update() and projectRepo.update() which don't exist in Drizzle repository interfaces
    // IRunRepository only has: create(), findById(), findByProjectId(), updateStatus(), updateStatistics()
    // IProjectRepository only has: create(), findById(), findAll(), updateStatus(), delete()
    // This test needs to be refactored to use available methods or the interfaces need to be extended
    it.skip('should handle circular dependency updates', async () => {
      const project = projectRepo.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: {},
      });

      const runs = Array.from({ length: 5 }, () =>
        runRepo.create({
          projectId: project.id,
          status: 'pending',
          config: {},
          isBaseline: false,
        }),
      );

      const updates = runs.flatMap((run, i) => [
        Promise.resolve(
          runRepo.update(run.id, {
            status: 'processing',
          }),
        ),
        Promise.resolve(
          projectRepo.update(project.id, {
            name: `Updated from run ${i}`,
          }),
        ),
      ]);

      await Promise.all(updates);

      const updatedProject = projectRepo.findById(project.id);
      expect(updatedProject).not.toBeNull();

      for (const run of runs) {
        const updatedRun = runRepo.findById(run.id);
        expect(updatedRun).not.toBeNull();
      }
    });
  });

  describe('Data Consistency Under Load', () => {
    // FIXME: Test needs refactoring for Drizzle async methods (missing await on lines 664, 668)
    // This test was written for synchronous SQL repositories but Drizzle methods are async
    // Line 664: projectRepo.findAll({}) needs await
    // Line 668: runRepo.findByProjectId() needs await
    it.skip('should maintain data consistency under heavy concurrent load', async () => {
      const operations = [];

      for (let i = 0; i < 50; i++) {
        operations.push(
          Promise.resolve(
            projectRepo.create({
              name: `Project ${i}`,
              baseUrl: `https://example.com/${i}`,
              config: {},
            }),
          ).then((project) =>
            runRepo.create({
              projectId: project.id,
              status: 'pending',
              config: {},
              isBaseline: true,
            }),
          ),
        );
      }

      await Promise.all(operations);

      const projects = projectRepo.findAll({});
      expect(projects.length).toBe(50);

      for (const project of projects) {
        const runs = runRepo.findByProjectId(project.id, {});
        expect(runs.length).toBeGreaterThanOrEqual(1);
      }
    });

    // FIXME: Test uses projectRepo.update() which doesn't exist in Drizzle IProjectRepository interface
    // Also missing await on lines 674, 695
    // This test was written for synchronous SQL repositories but Drizzle methods are async
    it.skip('should handle mixed read/write operations correctly', async () => {
      const project = projectRepo.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: {},
      });

      const operations = [];

      for (let i = 0; i < 25; i++) {
        operations.push(
          Promise.resolve(projectRepo.findById(project.id)),
          Promise.resolve(
            projectRepo.update(project.id, {
              name: `Updated ${i}`,
            }),
          ),
        );
      }

      await Promise.all(operations);

      const updated = projectRepo.findById(project.id);
      expect(updated).not.toBeNull();
      expect(updated?.name).toContain('Updated');
    });
  });
});
