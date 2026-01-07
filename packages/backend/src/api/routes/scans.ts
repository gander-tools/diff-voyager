/**
 * Scan API routes (POST /scans)
 */

import {
  type CreateScanAsyncResponse,
  type CreateScanRequest,
  DEFAULT_VIEWPORT,
  DEFAULT_VISUAL_THRESHOLD,
  DEFAULT_WAIT_AFTER_LOAD,
} from '@gander-tools/diff-voyager-shared';
import type { Database } from 'better-sqlite3';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ScanProcessor } from '../../services/scan-processor.js';
import { PageRepository } from '../../storage/repositories/page-repository.js';
import { ProjectRepository } from '../../storage/repositories/project-repository.js';
import { RunRepository } from '../../storage/repositories/run-repository.js';
import { SnapshotRepository } from '../../storage/repositories/snapshot-repository.js';
import { EXPENSIVE_OPERATION_RATE_LIMIT } from '../middleware/rate-limiting.js';

interface ScanRoutesOptions extends FastifyPluginOptions {
  db: Database;
  artifactsDir: string;
}

export async function registerScanRoutes(
  app: FastifyInstance,
  options: ScanRoutesOptions,
): Promise<void> {
  const { db, artifactsDir } = options;
  const projectRepo = new ProjectRepository(db);
  const runRepo = new RunRepository(db);
  const pageRepo = new PageRepository(db);
  const snapshotRepo = new SnapshotRepository(db);

  app.post<{ Body: CreateScanRequest }>(
    '/scans',
    {
      config: EXPENSIVE_OPERATION_RATE_LIMIT,
      schema: {
        tags: ['scans'],
        description: 'Create a new scan or crawl',
        body: {
          type: 'object',
          required: ['url'],
          properties: {
            url: {
              type: 'string',
              format: 'uri',
              description: 'URL to scan or crawl',
            },
            sync: {
              type: 'boolean',
              description: 'Wait for scan to complete before returning',
              default: false,
            },
            name: {
              type: 'string',
              description: 'Project name',
            },
            description: {
              type: 'string',
              description: 'Project description',
            },
            crawl: {
              type: 'boolean',
              description: 'Crawl entire site instead of single page',
              default: false,
            },
            maxPages: {
              type: 'integer',
              description: 'Maximum pages to crawl',
              minimum: 1,
            },
            viewport: {
              type: 'object',
              properties: {
                width: { type: 'integer', minimum: 320 },
                height: { type: 'integer', minimum: 240 },
              },
            },
            collectHar: {
              type: 'boolean',
              description: 'Collect HAR files for performance analysis',
              default: false,
            },
            waitAfterLoad: {
              type: 'integer',
              description: 'Milliseconds to wait after page load',
              minimum: 0,
            },
            visualDiffThreshold: {
              type: 'number',
              description: 'Visual diff pixel threshold (0-1)',
              minimum: 0,
              maximum: 1,
            },
          },
        },
        response: {
          200: {
            description: 'Sync scan completed - returns full project details',
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              baseUrl: { type: 'string' },
              config: {
                type: 'object',
                properties: {
                  crawl: { type: 'boolean' },
                  viewport: {
                    type: 'object',
                    properties: {
                      width: { type: 'integer' },
                      height: { type: 'integer' },
                    },
                  },
                  visualDiffThreshold: { type: 'number' },
                  maxPages: { type: 'integer' },
                },
              },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              statistics: {
                type: 'object',
                properties: {
                  totalPages: { type: 'integer' },
                  completedPages: { type: 'integer' },
                  errorPages: { type: 'integer' },
                  changedPages: { type: 'integer' },
                  unchangedPages: { type: 'integer' },
                  totalDifferences: { type: 'integer' },
                  criticalDifferences: { type: 'integer' },
                  acceptedDifferences: { type: 'integer' },
                  mutedDifferences: { type: 'integer' },
                },
              },
              pages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    url: { type: 'string' },
                    originalUrl: { type: 'string' },
                    status: { type: 'string' },
                    httpStatus: { type: 'integer' },
                    capturedAt: { type: 'string', format: 'date-time' },
                    seoData: { type: 'object' },
                    httpHeaders: { type: 'object' },
                    performanceData: { type: 'object' },
                    artifacts: { type: 'object' },
                    diff: { type: 'object', nullable: true },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  totalPages: { type: 'integer' },
                  limit: { type: 'integer' },
                  offset: { type: 'integer' },
                  hasMore: { type: 'boolean' },
                },
              },
            },
          },
          202: {
            description: 'Async scan accepted',
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              status: { type: 'string' },
              projectUrl: { type: 'string' },
            },
          },
          400: {
            description: 'Validation error',
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
      const body = request.body;

      // URL is validated by Fastify schema
      const url = new URL(body.url);
      const viewport = body.viewport || DEFAULT_VIEWPORT;
      const visualDiffThreshold = body.visualDiffThreshold ?? DEFAULT_VISUAL_THRESHOLD;

      // Create project
      const project = await projectRepo.create({
        name: body.name || `Scan: ${url.hostname}`,
        description: body.description,
        baseUrl: url.origin,
        config: {
          crawl: body.crawl || false,
          viewport,
          visualDiffThreshold,
          maxPages: body.maxPages,
        },
      });

      // Create baseline run
      const run = await runRepo.create({
        projectId: project.id,
        isBaseline: true,
        config: {
          viewport,
          captureScreenshots: true,
          captureHar: body.collectHar || false,
        },
      });

      // For sync mode - process immediately and return full result
      if (body.sync) {
        const processor = new ScanProcessor({
          db,
          artifactsDir,
          projectRepo,
          runRepo,
          pageRepo,
          snapshotRepo,
        });

        const result = await processor.processScan({
          projectId: project.id,
          runId: run.id,
          url: body.url,
          crawl: body.crawl || false,
          viewport,
          waitAfterLoad: body.waitAfterLoad ?? DEFAULT_WAIT_AFTER_LOAD,
          collectHar: body.collectHar || false,
        });

        return reply.status(200).send(result);
      }

      // For async mode - return immediately
      const response: CreateScanAsyncResponse = {
        projectId: project.id,
        status: 'PENDING',
        projectUrl: `/api/v1/projects/${project.id}`,
      };

      return reply.status(202).send(response);
    },
  );
}
