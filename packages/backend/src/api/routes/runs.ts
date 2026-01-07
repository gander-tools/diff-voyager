/**
 * Run API routes
 */

import type { Database } from 'better-sqlite3';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { PageRepository } from '../../storage/repositories/page-repository.js';
import { RunRepository } from '../../storage/repositories/run-repository.js';
import { SnapshotRepository } from '../../storage/repositories/snapshot-repository.js';
import { DATABASE_READ_RATE_LIMIT } from '../middleware/rate-limiting.js';

interface RunRoutesOptions extends FastifyPluginOptions {
  db: Database;
}

/**
 * Register run routes
 */
export async function registerRunRoutes(
  app: FastifyInstance,
  options: RunRoutesOptions,
): Promise<void> {
  const { db } = options;
  const runRepo = new RunRepository(db);
  const snapshotRepo = new SnapshotRepository(db);
  const pageRepo = new PageRepository(db);

  /**
   * GET /runs/:runId
   *
   * Get run details with statistics
   */
  app.get(
    '/runs/:runId',
    {
      config: DATABASE_READ_RATE_LIMIT,
      schema: {
        tags: ['runs'],
        description: 'Get run details with statistics',
        params: {
          type: 'object',
          properties: {
            runId: {
              type: 'string',
              format: 'uuid',
              description: 'Run ID',
            },
          },
          required: ['runId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              projectId: { type: 'string', format: 'uuid' },
              isBaseline: { type: 'boolean' },
              status: { type: 'string' },
              config: { type: 'object' },
              createdAt: { type: 'string', format: 'date-time' },
              startedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              completedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              statistics: {
                type: 'object',
                properties: {
                  totalPages: { type: 'integer' },
                  completedPages: { type: 'integer' },
                  errorPages: { type: 'integer' },
                },
                required: ['totalPages', 'completedPages', 'errorPages'],
              },
            },
            required: [
              'id',
              'projectId',
              'isBaseline',
              'status',
              'config',
              'createdAt',
              'statistics',
            ],
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
      const { runId } = request.params as { runId: string };

      // Find run
      const run = await runRepo.findById(runId);

      if (!run) {
        return reply.code(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Run not found',
          },
        });
      }

      // Get snapshots for this run to calculate statistics
      const snapshots = await snapshotRepo.findByRunId(runId);

      const statistics = {
        totalPages: snapshots.length,
        completedPages: snapshots.filter((s) => s.status === 'completed').length,
        errorPages: snapshots.filter((s) => s.status === 'error').length,
      };

      // Return run details
      return reply.send({
        id: run.id,
        projectId: run.projectId,
        isBaseline: run.isBaseline,
        status: run.status,
        config: run.config,
        createdAt: run.createdAt.toISOString(),
        startedAt: run.startedAt ? run.startedAt.toISOString() : null,
        completedAt: run.completedAt ? run.completedAt.toISOString() : null,
        statistics,
      });
    },
  );

  /**
   * GET /runs/:runId/pages
   *
   * List all pages for a run with optional filtering
   */
  app.get<{
    Params: { runId: string };
    Querystring: {
      limit?: number;
      offset?: number;
      status?: string;
    };
  }>(
    '/runs/:runId/pages',
    {
      config: DATABASE_READ_RATE_LIMIT,
      schema: {
        tags: ['runs'],
        description: 'List all pages for a run with optional filtering',
        params: {
          type: 'object',
          properties: {
            runId: {
              type: 'string',
              format: 'uuid',
              description: 'Run ID',
            },
          },
          required: ['runId'],
        },
        querystring: {
          type: 'object',
          properties: {
            limit: {
              type: 'integer',
              description: 'Maximum number of pages to return',
              minimum: 1,
              maximum: 100,
              default: 50,
            },
            offset: {
              type: 'integer',
              description: 'Number of pages to skip',
              minimum: 0,
              default: 0,
            },
            status: {
              type: 'string',
              description: 'Filter by page status',
              enum: ['pending', 'processing', 'completed', 'error'],
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              pages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    url: { type: 'string' },
                    originalUrl: { type: 'string' },
                    status: { type: 'string' },
                    httpStatus: { type: 'integer', nullable: true },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                  limit: { type: 'integer' },
                  offset: { type: 'integer' },
                  hasMore: { type: 'boolean' },
                },
                required: ['total', 'limit', 'offset', 'hasMore'],
              },
            },
            required: ['pages', 'pagination'],
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
      const { runId } = request.params;
      const { limit, offset, status } = request.query;

      // Verify run exists
      const run = await runRepo.findById(runId);
      if (!run) {
        return reply.code(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Run not found',
          },
        });
      }

      // Get all snapshots for this run
      let snapshots = await snapshotRepo.findByRunId(runId);

      // Apply status filter if provided
      if (status) {
        snapshots = snapshots.filter((s) => s.status === status);
      }

      // Get page details for each snapshot
      const pageIds = snapshots.map((s) => s.pageId);
      const pagesMap = new Map();
      for (const pageId of pageIds) {
        const page = await pageRepo.findById(pageId);
        if (page) {
          pagesMap.set(pageId, page);
        }
      }

      // Build combined page + snapshot data
      const allPages = snapshots
        .map((snapshot) => {
          const page = pagesMap.get(snapshot.pageId);
          if (!page) return null;
          return {
            id: page.id,
            url: page.normalizedUrl,
            originalUrl: page.originalUrl,
            status: snapshot.status,
            httpStatus: snapshot.httpStatus,
          };
        })
        .filter((p) => p !== null);

      // Apply pagination
      const actualLimit = limit || 50;
      const actualOffset = offset || 0;
      const paginatedPages = allPages.slice(actualOffset, actualOffset + actualLimit);

      return reply.send({
        pages: paginatedPages,
        pagination: {
          total: allPages.length,
          limit: actualLimit,
          offset: actualOffset,
          hasMore: actualOffset + actualLimit < allPages.length,
        },
      });
    },
  );
}
