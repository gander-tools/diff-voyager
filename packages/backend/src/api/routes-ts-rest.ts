/**
 * @ts-rest/fastify route handlers
 *
 * This file implements Fastify route handlers using the @ts-rest API contract
 * from packages/shared. This is the backend implementation of the contract.
 */

import { apiContract, PageStatus } from '@gander-tools/diff-voyager-shared';
import { initServer } from '@ts-rest/fastify';
import type { TaskQueue } from '../queue/task-queue.js';
import { ScanProcessor } from '../services/scan-processor.js';
import type { DatabaseInstance } from '../storage/database.js';
import type { DrizzleDb } from '../storage/drizzle/db.js';
import { PageRepositoryDrizzle } from '../storage/repositories/page-repository.drizzle.js';
import { ProjectRepositoryDrizzle } from '../storage/repositories/project-repository.drizzle.js';
import { RunRepositoryDrizzle } from '../storage/repositories/run-repository.drizzle.js';
import { SnapshotRepositoryDrizzle } from '../storage/repositories/snapshot-repository.drizzle.js';

export interface TsRestRoutesConfig {
  db: DatabaseInstance;
  drizzleDb: DrizzleDb;
  artifactsDir: string;
  taskQueue: TaskQueue;
}

export function createTsRestRoutes(config: TsRestRoutesConfig) {
  const { db, drizzleDb, artifactsDir, taskQueue } = config;
  const projectRepo = new ProjectRepositoryDrizzle(drizzleDb);
  const runRepo = new RunRepositoryDrizzle(drizzleDb);
  const pageRepo = new PageRepositoryDrizzle(drizzleDb);
  const snapshotRepo = new SnapshotRepositoryDrizzle(drizzleDb);

  const s = initServer();

  const router = s.router(apiContract, {
    // ========== SCANS ==========

    createScan: {
      handler: async ({ body }) => {
        // URL is validated by Zod schema in contract
        const url = new URL(body.url);

        // Create project (use hostname as fallback if name not provided)
        const project = await projectRepo.create({
          name: body.name || url.hostname,
          description: body.description ?? '',
          baseUrl: url.origin,
          config: {
            crawl: body.crawl || false,
            viewport: body.viewport || { width: 1920, height: 1080 },
            visualDiffThreshold: body.visualDiffThreshold ?? 0.1,
            maxPages: body.maxPages,
          },
        });

        // Create baseline run
        const run = await runRepo.create({
          projectId: project.id,
          isBaseline: true,
          config: {
            viewport: body.viewport || { width: 1920, height: 1080 },
            captureScreenshots: true,
            captureHar: body.collectHar || false,
          },
        });

        // Sync vs async mode
        if (body.sync) {
          // Sync mode - process immediately and return full result
          const processor = new ScanProcessor({
            db,
            artifactsDir,
            projectRepo,
            runRepo,
            pageRepo,
            snapshotRepo,
          });

          await processor.processScan({
            projectId: project.id,
            runId: run.id,
            url: body.url,
            crawl: body.crawl || false,
            maxPages: body.maxPages,
            viewport: body.viewport || { width: 1920, height: 1080 },
            waitAfterLoad: body.waitAfterLoad ?? 1000,
            collectHar: body.collectHar || false,
          });

          // Fetch complete project details after processing
          const fullProject = await projectRepo.findById(project.id);
          if (!fullProject) {
            throw new Error('Project not found after creation');
          }

          const runs = await runRepo.findByProjectId(project.id);
          const latestRun = runs[0];
          const pages = await pageRepo.findByProjectId(project.id);
          const snapshots = latestRun ? await snapshotRepo.findByRunId(latestRun.id) : [];
          const snapshotByPageId = new Map(snapshots.map((s) => [s.pageId, s]));

          // Build pages response
          const pagesResponse = pages.map((page) => {
            const snapshot = snapshotByPageId.get(page.id);
            return {
              id: page.id,
              projectId: page.projectId,
              url: page.normalizedUrl,
              originalUrl: page.originalUrl,
              status: snapshot?.status || PageStatus.PENDING,
              httpStatus: snapshot?.httpStatus,
              capturedAt: snapshot?.capturedAt?.toISOString(),
              seoData: snapshot?.seoData,
              httpHeaders: snapshot?.headers,
              performanceData: snapshot?.performanceData,
              artifacts: {
                screenshotUrl: snapshot?.screenshotPath
                  ? `/api/v1/artifacts/${page.id}/screenshot`
                  : undefined,
                harUrl: snapshot?.harPath ? `/api/v1/artifacts/${page.id}/har` : undefined,
                htmlUrl: snapshot?.htmlPath ? `/api/v1/artifacts/${page.id}/html` : undefined,
              },
              diff: null, // TODO: implement diffs
            };
          });

          // Build statistics
          const completedPages = snapshots.filter((s) => s.status === PageStatus.COMPLETED).length;
          const errorPages = snapshots.filter((s) => s.status === PageStatus.ERROR).length;

          return {
            status: 200 as const,
            body: {
              id: fullProject.id,
              name: fullProject.name,
              description: fullProject.description || '',
              baseUrl: fullProject.baseUrl,
              config: {
                crawl: fullProject.config.crawl,
                viewport: fullProject.config.viewport,
                visualDiffThreshold: fullProject.config.visualDiffThreshold,
                maxPages: fullProject.config.maxPages,
              },
              status: fullProject.status,
              createdAt: fullProject.createdAt.toISOString(),
              updatedAt: fullProject.updatedAt.toISOString(),
              statistics: {
                totalPages: pages.length,
                completedPages,
                errorPages,
                changedPages: 0,
                unchangedPages: completedPages,
                totalDifferences: 0,
                criticalDifferences: 0,
                acceptedDifferences: 0,
                mutedDifferences: 0,
              },
              pages: pagesResponse,
              pagination: {
                total: pages.length,
                totalPages: pages.length,
                limit: pages.length,
                offset: 0,
                hasMore: false,
              },
            },
          };
        }

        // Async mode - return immediately
        return {
          status: 202 as const,
          body: {
            projectId: project.id,
            status: 'PENDING',
            projectUrl: `/api/v1/projects/${project.id}`,
          },
        };
      },
      // Add rate limiting configuration (EXPENSIVE_OPERATION_RATE_LIMIT from middleware)
    },

    // ========== PROJECTS ==========

    listProjects: {
      handler: async ({ query }) => {
        const { projects, total } = await projectRepo.findAll({
          limit: query.limit || 50,
          offset: query.offset || 0,
        });

        return {
          status: 200 as const,
          body: {
            projects: projects.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description || '',
              baseUrl: p.baseUrl,
              status: p.status,
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.updatedAt.toISOString(),
            })),
            pagination: {
              total,
              limit: query.limit || 50,
              offset: query.offset || 0,
              hasMore: (query.offset || 0) + (query.limit || 50) < total,
            },
          },
        };
      },
    },

    getProject: {
      handler: async ({ params, query }) => {
        const project = await projectRepo.findById(params.projectId);
        if (!project) {
          return {
            status: 404 as const,
            body: {
              error: {
                code: 'NOT_FOUND',
                message: 'Project not found',
              },
            },
          };
        }

        const runs = await runRepo.findByProjectId(params.projectId);
        const latestRun = runs[0];
        const pages = await pageRepo.findByProjectId(params.projectId);
        const snapshots = latestRun ? await snapshotRepo.findByRunId(latestRun.id) : [];
        const snapshotByPageId = new Map(snapshots.map((s) => [s.pageId, s]));

        // Build pages response
        const includePages = query.includePages !== false;
        const pageLimit = query.pageLimit || 50;
        const pageOffset = query.pageOffset || 0;

        const pagesResponse = [];
        if (includePages && latestRun) {
          const paginatedPages = pages.slice(pageOffset, pageOffset + pageLimit);

          for (const page of paginatedPages) {
            const snapshot = snapshotByPageId.get(page.id);
            pagesResponse.push({
              id: page.id,
              projectId: page.projectId,
              url: page.normalizedUrl,
              originalUrl: page.originalUrl,
              status: snapshot?.status || PageStatus.PENDING,
              httpStatus: snapshot?.httpStatus,
              capturedAt: snapshot?.capturedAt?.toISOString(),
              seoData: snapshot?.seoData,
              httpHeaders: snapshot?.headers,
              performanceData: snapshot?.performanceData,
              artifacts: {
                screenshotUrl: snapshot?.screenshotPath
                  ? `/api/v1/artifacts/${page.id}/screenshot`
                  : undefined,
                harUrl: snapshot?.harPath ? `/api/v1/artifacts/${page.id}/har` : undefined,
                htmlUrl: snapshot?.htmlPath ? `/api/v1/artifacts/${page.id}/html` : undefined,
              },
              diff: null, // TODO: implement diffs
            });
          }
        }

        // Build statistics
        const completedPages = snapshots.filter((s) => s.status === PageStatus.COMPLETED).length;
        const errorPages = snapshots.filter((s) => s.status === PageStatus.ERROR).length;

        return {
          status: 200 as const,
          body: {
            id: project.id,
            name: project.name,
            description: project.description || '',
            baseUrl: project.baseUrl,
            config: {
              crawl: project.config.crawl,
              viewport: project.config.viewport,
              visualDiffThreshold: project.config.visualDiffThreshold,
              maxPages: project.config.maxPages,
            },
            status: project.status,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
            statistics: {
              totalPages: pages.length,
              completedPages,
              errorPages,
              changedPages: 0,
              unchangedPages: completedPages,
              totalDifferences: 0,
              criticalDifferences: 0,
              acceptedDifferences: 0,
              mutedDifferences: 0,
            },
            pages: pagesResponse,
            pagination: {
              total: pages.length,
              totalPages: pages.length,
              limit: pageLimit,
              offset: pageOffset,
              hasMore: pageOffset + pageLimit < pages.length,
            },
          },
        };
      },
    },

    deleteProject: {
      handler: async ({ params }) => {
        const deleted = await projectRepo.delete(params.projectId);

        if (!deleted) {
          return {
            status: 404 as const,
            body: {
              error: {
                code: 'NOT_FOUND',
                message: 'Project not found',
              },
            },
          };
        }

        return {
          status: 204 as const,
          body: undefined,
        };
      },
    },

    // ========== RUNS ==========

    listProjectRuns: {
      handler: async ({ params, query }) => {
        // Verify project exists
        const project = await projectRepo.findById(params.projectId);
        if (!project) {
          return {
            status: 404 as const,
            body: {
              error: {
                code: 'NOT_FOUND',
                message: 'Project not found',
              },
            },
          };
        }

        // Get all runs for this project
        const allRuns = await runRepo.findByProjectId(params.projectId);

        // Apply pagination
        const actualLimit = query.limit || 50;
        const actualOffset = query.offset || 0;
        const paginatedRuns = allRuns.slice(actualOffset, actualOffset + actualLimit);

        return {
          status: 200 as const,
          body: {
            runs: paginatedRuns.map((run) => ({
              id: run.id,
              projectId: run.projectId,
              isBaseline: run.isBaseline,
              status: run.status,
              createdAt: run.createdAt.toISOString(),
            })),
            pagination: {
              total: allRuns.length,
              limit: actualLimit,
              offset: actualOffset,
              hasMore: actualOffset + actualLimit < allRuns.length,
            },
          },
        };
      },
    },

    createProjectRun: {
      handler: async ({ params, body }) => {
        // Verify project exists
        const project = await projectRepo.findById(params.projectId);
        if (!project) {
          return {
            status: 404 as const,
            body: {
              error: {
                code: 'NOT_FOUND',
                message: 'Project not found',
              },
            },
          };
        }

        // Create comparison run (not baseline)
        const run = await runRepo.create({
          projectId: params.projectId,
          isBaseline: false,
          config: {
            viewport: body.viewport || { width: 1920, height: 1080 },
            captureScreenshots: true,
            captureHar: body.collectHar || false,
          },
        });

        return {
          status: 202 as const,
          body: {
            runId: run.id,
            status: 'PENDING',
            runUrl: `/api/v1/projects/${params.projectId}/runs/${run.id}`,
          },
        };
      },
    },

    getRunDetails: {
      handler: async ({ params }) => {
        const run = await runRepo.findById(params.runId);
        if (!run) {
          return {
            status: 404 as const,
            body: {
              error: {
                code: 'NOT_FOUND',
                message: 'Run not found',
              },
            },
          };
        }

        // Get snapshots for statistics
        const snapshots = await snapshotRepo.findByRunId(params.runId);
        const completedPages = snapshots.filter((s) => s.status === PageStatus.COMPLETED).length;
        const errorPages = snapshots.filter((s) => s.status === PageStatus.ERROR).length;

        return {
          status: 200 as const,
          body: {
            id: run.id,
            projectId: run.projectId,
            isBaseline: run.isBaseline,
            status: run.status,
            createdAt: run.createdAt.toISOString(),
            config: run.config,
            statistics: {
              totalPages: snapshots.length,
              completedPages,
              errorPages,
            },
          },
        };
      },
    },

    // ========== PAGES ==========

    getPageDetails: {
      handler: async ({ params }) => {
        const page = await pageRepo.findById(params.pageId);
        if (!page) {
          return {
            status: 404 as const,
            body: {
              error: {
                code: 'NOT_FOUND',
                message: 'Page not found',
              },
            },
          };
        }

        // Get latest snapshot for this page
        const runs = await runRepo.findByProjectId(page.projectId);
        const latestRun = runs[0];
        const snapshots = latestRun ? await snapshotRepo.findByRunId(latestRun.id) : [];
        const snapshot = snapshots.find((s) => s.pageId === page.id);

        return {
          status: 200 as const,
          body: {
            id: page.id,
            projectId: page.projectId,
            url: page.normalizedUrl,
            originalUrl: page.originalUrl,
            status: snapshot?.status || PageStatus.PENDING,
            httpStatus: snapshot?.httpStatus,
            capturedAt: snapshot?.capturedAt?.toISOString(),
            seoData: snapshot?.seoData,
            httpHeaders: snapshot?.headers,
            performanceData: snapshot?.performanceData,
            artifacts: {
              screenshotUrl: snapshot?.screenshotPath
                ? `/api/v1/artifacts/${page.id}/screenshot`
                : undefined,
              harUrl: snapshot?.harPath ? `/api/v1/artifacts/${page.id}/har` : undefined,
              htmlUrl: snapshot?.htmlPath ? `/api/v1/artifacts/${page.id}/html` : undefined,
            },
            diff: null, // TODO: implement diffs
          },
        };
      },
    },

    getPageDiff: {
      handler: async ({ params }) => {
        const page = await pageRepo.findById(params.pageId);
        if (!page) {
          return {
            status: 404 as const,
            body: {
              error: {
                code: 'NOT_FOUND',
                message: 'Page not found',
              },
            },
          };
        }

        // Get baseline and comparison runs
        const runs = await runRepo.findByProjectId(page.projectId);
        const baselineRun = runs.find((r) => r.isBaseline);
        const comparisonRun = runs.find((r) => !r.isBaseline);

        if (!baselineRun || !comparisonRun) {
          return {
            status: 404 as const,
            body: {
              error: {
                code: 'NOT_FOUND',
                message: 'No comparison run found',
              },
            },
          };
        }

        // Get snapshots for both runs
        const baselineSnapshots = await snapshotRepo.findByRunId(baselineRun.id);
        const comparisonSnapshots = await snapshotRepo.findByRunId(comparisonRun.id);

        const baselineSnapshot = baselineSnapshots.find((s) => s.pageId === page.id);
        const comparisonSnapshot = comparisonSnapshots.find((s) => s.pageId === page.id);

        // Compare SEO
        const seoChanges = [];
        if (baselineSnapshot?.seoData && comparisonSnapshot?.seoData) {
          const baselineSeo = baselineSnapshot.seoData;
          const comparisonSeo = comparisonSnapshot.seoData;

          if (baselineSeo.title !== comparisonSeo.title) {
            seoChanges.push({
              field: 'title',
              baseline: baselineSeo.title,
              current: comparisonSeo.title,
            });
          }
          if (baselineSeo.metaDescription !== comparisonSeo.metaDescription) {
            seoChanges.push({
              field: 'metaDescription',
              baseline: baselineSeo.metaDescription,
              current: comparisonSeo.metaDescription,
            });
          }
        }

        // Compare headers
        const headerChanges = [];
        if (baselineSnapshot?.headers && comparisonSnapshot?.headers) {
          const allHeaders = new Set([
            ...Object.keys(baselineSnapshot.headers),
            ...Object.keys(comparisonSnapshot.headers),
          ]);

          for (const header of allHeaders) {
            const baselineValue = baselineSnapshot.headers[header];
            const comparisonValue = comparisonSnapshot.headers[header];
            if (baselineValue !== comparisonValue) {
              headerChanges.push({
                header,
                baseline: baselineValue,
                current: comparisonValue,
              });
            }
          }
        }

        // Compare performance
        const performanceChanges = [];
        if (baselineSnapshot?.performanceData && comparisonSnapshot?.performanceData) {
          const baselinePerf = baselineSnapshot.performanceData;
          const comparisonPerf = comparisonSnapshot.performanceData;

          if (baselinePerf.loadTimeMs !== comparisonPerf.loadTimeMs) {
            performanceChanges.push({
              metric: 'loadTimeMs',
              baseline: baselinePerf.loadTimeMs,
              current: comparisonPerf.loadTimeMs,
            });
          }
        }

        const hasChanges =
          seoChanges.length > 0 || headerChanges.length > 0 || performanceChanges.length > 0;

        return {
          status: 200 as const,
          body: {
            pageId: page.id,
            hasChanges,
            seoChanges,
            headerChanges,
            performanceChanges,
          },
        };
      },
    },

    listRunPages: {
      handler: async ({ params, query }) => {
        const run = await runRepo.findById(params.runId);
        if (!run) {
          return {
            status: 404 as const,
            body: {
              error: {
                code: 'NOT_FOUND',
                message: 'Run not found',
              },
            },
          };
        }

        const snapshots = await snapshotRepo.findByRunId(params.runId);
        const pages = await pageRepo.findByProjectId(run.projectId);
        const snapshotByPageId = new Map(snapshots.map((s) => [s.pageId, s]));

        // Filter by status if provided
        let filteredPages = pages;
        if (query.status) {
          filteredPages = pages.filter((page) => {
            const snapshot = snapshotByPageId.get(page.id);
            return snapshot?.status === query.status;
          });
        }

        // Pagination
        const limit = query.limit || 50;
        const offset = query.offset || 0;
        const paginatedPages = filteredPages.slice(offset, offset + limit);

        const pagesResponse = paginatedPages.map((page) => {
          const snapshot = snapshotByPageId.get(page.id);
          return {
            id: page.id,
            projectId: page.projectId,
            url: page.normalizedUrl,
            originalUrl: page.originalUrl,
            status: snapshot?.status || PageStatus.PENDING,
            httpStatus: snapshot?.httpStatus,
            capturedAt: snapshot?.capturedAt?.toISOString(),
            seoData: snapshot?.seoData,
            httpHeaders: snapshot?.headers,
            performanceData: snapshot?.performanceData,
            artifacts: {
              screenshotUrl: snapshot?.screenshotPath
                ? `/api/v1/artifacts/${page.id}/screenshot`
                : undefined,
              harUrl: snapshot?.harPath ? `/api/v1/artifacts/${page.id}/har` : undefined,
              htmlUrl: snapshot?.htmlPath ? `/api/v1/artifacts/${page.id}/html` : undefined,
            },
            diff: null,
          };
        });

        return {
          status: 200 as const,
          body: {
            pages: pagesResponse,
            pagination: {
              total: filteredPages.length,
              limit,
              offset,
              hasMore: offset + limit < filteredPages.length,
            },
          },
        };
      },
    },

    getTaskStatus: {
      handler: async ({ params }) => {
        const task = taskQueue.findById(params.taskId);
        if (!task) {
          return {
            status: 404 as const,
            body: {
              error: {
                code: 'NOT_FOUND',
                message: 'Task not found',
              },
            },
          };
        }

        return {
          status: 200 as const,
          body: {
            id: task.id,
            type: task.type,
            status: task.status,
            createdAt: task.createdAt.toISOString(),
            startedAt: task.startedAt?.toISOString(),
            completedAt: task.completedAt?.toISOString(),
            attempts: task.attempts,
            error: task.error,
            payload: task.payload,
          },
        };
      },
    },
  });

  return { router, s };
}
