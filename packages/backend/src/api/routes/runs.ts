/**
 * Run API routes
 */

import type { Database } from 'better-sqlite3';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
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
}
