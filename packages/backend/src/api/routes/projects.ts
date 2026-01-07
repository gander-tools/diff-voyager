/**
 * Project API routes (GET /projects/:projectId)
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { Database } from 'better-sqlite3';
import {
  PageStatus,
  type GetProjectQuery,
  type ProjectDetailsResponse,
  type PageResponse,
  type ProjectStatisticsResponse,
  DEFAULT_PAGE_LIMIT,
} from '@gander-tools/diff-voyager-shared';
import { ProjectRepository } from '../../storage/repositories/project-repository.js';
import { RunRepository } from '../../storage/repositories/run-repository.js';
import { PageRepository } from '../../storage/repositories/page-repository.js';
import { SnapshotRepository } from '../../storage/repositories/snapshot-repository.js';

interface ProjectRoutesOptions extends FastifyPluginOptions {
  db: Database;
}

export async function registerProjectRoutes(
  app: FastifyInstance,
  options: ProjectRoutesOptions
): Promise<void> {
  const { db } = options;
  const projectRepo = new ProjectRepository(db);
  const runRepo = new RunRepository(db);
  const pageRepo = new PageRepository(db);
  const snapshotRepo = new SnapshotRepository(db);

  app.get<{
    Params: { projectId: string };
    Querystring: GetProjectQuery;
  }>('/projects/:projectId', async (request, reply) => {
    const { projectId } = request.params;
    const query = request.query;

    const project = await projectRepo.findById(projectId);
    if (!project) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Project not found',
        },
      });
    }

    const runs = await runRepo.findByProjectId(projectId);
    const latestRun = runs[0];
    const pages = await pageRepo.findByProjectId(projectId);

    // Build pages response
    const includePages = query.includePages !== false;
    const pageLimit = query.pageLimit || DEFAULT_PAGE_LIMIT;
    const pageOffset = query.pageOffset || 0;

    const pagesResponse: PageResponse[] = [];

    if (includePages && latestRun) {
      const snapshots = await snapshotRepo.findByRunId(latestRun.id);
      const snapshotByPageId = new Map(snapshots.map((s) => [s.pageId, s]));

      const paginatedPages = pages.slice(pageOffset, pageOffset + pageLimit);

      for (const page of paginatedPages) {
        const snapshot = snapshotByPageId.get(page.id);
        pagesResponse.push({
          id: page.id,
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
    const statistics: ProjectStatisticsResponse = {
      totalPages: pages.length,
      completedPages: pagesResponse.filter((p) => p.status === PageStatus.COMPLETED).length,
      errorPages: pagesResponse.filter((p) => p.status === PageStatus.ERROR).length,
      changedPages: 0,
      unchangedPages: pagesResponse.filter((p) => p.status === PageStatus.COMPLETED).length,
      totalDifferences: 0,
      criticalDifferences: 0,
      acceptedDifferences: 0,
      mutedDifferences: 0,
    };

    const response: ProjectDetailsResponse = {
      id: project.id,
      name: project.name,
      description: project.description,
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
      statistics,
      pages: pagesResponse,
      pagination: {
        totalPages: pages.length,
        limit: pageLimit,
        offset: pageOffset,
        hasMore: pageOffset + pageLimit < pages.length,
      },
    };

    return reply.status(200).send(response);
  });
}
