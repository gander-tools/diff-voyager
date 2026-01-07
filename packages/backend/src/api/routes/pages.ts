/**
 * Page API routes
 */

import type { Database } from 'better-sqlite3';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { PageRepository } from '../../storage/repositories/page-repository.js';
import { SnapshotRepository } from '../../storage/repositories/snapshot-repository.js';
import { DATABASE_READ_RATE_LIMIT } from '../middleware/rate-limiting.js';

interface PageRoutesOptions extends FastifyPluginOptions {
  db: Database;
}

/**
 * Register page routes
 */
export async function registerPageRoutes(
  app: FastifyInstance,
  options: PageRoutesOptions,
): Promise<void> {
  const { db } = options;
  const pageRepo = new PageRepository(db);
  const snapshotRepo = new SnapshotRepository(db);

  /**
   * GET /pages/:pageId
   *
   * Get page details with latest snapshot data
   */
  app.get(
    '/pages/:pageId',
    {
      config: DATABASE_READ_RATE_LIMIT,
      schema: {
        tags: ['pages'],
        description: 'Get page details with latest snapshot data',
        params: {
          type: 'object',
          properties: {
            pageId: {
              type: 'string',
              format: 'uuid',
              description: 'Page ID',
            },
          },
          required: ['pageId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              projectId: { type: 'string', format: 'uuid' },
              url: { type: 'string' },
              originalUrl: { type: 'string' },
              httpStatus: { type: 'integer', nullable: true },
              capturedAt: { type: 'string', format: 'date-time', nullable: true },
              seoData: { type: 'object', nullable: true },
              httpHeaders: { type: 'object', nullable: true },
              performanceData: { type: 'object', nullable: true },
              artifacts: {
                type: 'object',
                properties: {
                  screenshotUrl: { type: 'string', nullable: true },
                  harUrl: { type: 'string', nullable: true },
                  htmlUrl: { type: 'string', nullable: true },
                },
              },
            },
            required: ['id', 'projectId', 'url', 'originalUrl', 'artifacts'],
          },
          404: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { pageId } = request.params as { pageId: string };

      // Find page
      const page = await pageRepo.findById(pageId);

      if (!page) {
        return reply.code(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Page not found',
          },
        });
      }

      // Get all snapshots for this page across all runs
      // and find the most recent one
      const allSnapshots = await snapshotRepo.findByPageId(pageId);

      // Sort by captured_at descending to get the latest
      const sortedSnapshots = allSnapshots.sort((a, b) => {
        if (!a.capturedAt || !b.capturedAt) return 0;
        return b.capturedAt.getTime() - a.capturedAt.getTime();
      });
      const latestSnapshot = sortedSnapshots[0];

      // Return page details
      return reply.send({
        id: page.id,
        projectId: page.projectId,
        url: page.normalizedUrl,
        originalUrl: page.originalUrl,
        httpStatus: latestSnapshot?.httpStatus,
        capturedAt: latestSnapshot?.capturedAt?.toISOString(),
        seoData: latestSnapshot?.seoData,
        httpHeaders: latestSnapshot?.headers,
        performanceData: latestSnapshot?.performanceData,
        artifacts: {
          screenshotUrl: `/api/v1/artifacts/${page.id}/screenshot`,
          harUrl: `/api/v1/artifacts/${page.id}/har`,
          htmlUrl: `/api/v1/artifacts/${page.id}/html`,
        },
      });
    },
  );
}
