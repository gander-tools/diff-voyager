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
          screenshotUrl: latestSnapshot?.screenshotPath
            ? `/api/v1/artifacts/${page.id}/screenshot`
            : undefined,
          harUrl: latestSnapshot?.harPath ? `/api/v1/artifacts/${page.id}/har` : undefined,
          htmlUrl: latestSnapshot?.htmlPath ? `/api/v1/artifacts/${page.id}/html` : undefined,
        },
      });
    },
  );

  /**
   * GET /pages/:pageId/diff
   *
   * Get detailed diff for a page comparing baseline and latest comparison run
   */
  app.get(
    '/pages/:pageId/diff',
    {
      config: DATABASE_READ_RATE_LIMIT,
      schema: {
        tags: ['pages'],
        description: 'Get detailed diff for a page',
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
              hasChanges: { type: 'boolean' },
              seoChanges: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    baseline: { type: 'string' },
                    current: { type: 'string' },
                  },
                },
              },
              headerChanges: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    header: { type: 'string' },
                    baseline: { type: 'string' },
                    current: { type: 'string' },
                  },
                },
              },
              performanceChanges: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    metric: { type: 'string' },
                    baseline: { type: 'number' },
                    current: { type: 'number' },
                  },
                },
              },
              visualDiff: {
                type: 'object',
                nullable: true,
                properties: {
                  diffImageUrl: { type: 'string' },
                  pixelDifference: { type: 'number' },
                },
              },
            },
            required: ['hasChanges', 'seoChanges', 'headerChanges', 'performanceChanges'],
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

      // Get all snapshots for this page
      const allSnapshots = await snapshotRepo.findByPageId(pageId);

      // Find baseline and comparison snapshots
      const baselineSnapshot = allSnapshots.find((s) => s.runId && s.runId !== '');
      const comparisonSnapshot = allSnapshots.find(
        (s) => s.runId && s.runId !== '' && s.runId !== baselineSnapshot?.runId,
      );

      // If no comparison exists, return 404
      if (!comparisonSnapshot) {
        return reply.code(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'No comparison run found for this page',
          },
        });
      }

      // Compare SEO data
      const seoChanges = [];
      if (baselineSnapshot?.seoData && comparisonSnapshot.seoData) {
        const baselineSeo = baselineSnapshot.seoData;
        const currentSeo = comparisonSnapshot.seoData;

        // Check title
        if (baselineSeo.title !== currentSeo.title) {
          seoChanges.push({
            field: 'title',
            baseline: baselineSeo.title || '',
            current: currentSeo.title || '',
          });
        }

        // Check metaDescription
        if (baselineSeo.metaDescription !== currentSeo.metaDescription) {
          seoChanges.push({
            field: 'metaDescription',
            baseline: baselineSeo.metaDescription || '',
            current: currentSeo.metaDescription || '',
          });
        }
      }

      // Compare headers
      const headerChanges = [];
      if (baselineSnapshot?.headers && comparisonSnapshot.headers) {
        const baselineHeaders = baselineSnapshot.headers;
        const currentHeaders = comparisonSnapshot.headers;

        // Get all unique header keys
        const allHeaderKeys = new Set([
          ...Object.keys(baselineHeaders),
          ...Object.keys(currentHeaders),
        ]);

        for (const header of allHeaderKeys) {
          const baselineValue = baselineHeaders[header];
          const currentValue = currentHeaders[header];

          if (baselineValue !== currentValue) {
            headerChanges.push({
              header,
              baseline: baselineValue || '',
              current: currentValue || '',
            });
          }
        }
      }

      // Compare performance data
      const performanceChanges = [];
      if (baselineSnapshot?.performanceData && comparisonSnapshot.performanceData) {
        const baselinePerf = baselineSnapshot.performanceData;
        const currentPerf = comparisonSnapshot.performanceData;

        // Check loadTimeMs
        if (baselinePerf.loadTimeMs !== currentPerf.loadTimeMs) {
          performanceChanges.push({
            metric: 'loadTimeMs',
            baseline: baselinePerf.loadTimeMs || 0,
            current: currentPerf.loadTimeMs || 0,
          });
        }

        // Check requestCount
        if (baselinePerf.requestCount !== currentPerf.requestCount) {
          performanceChanges.push({
            metric: 'requestCount',
            baseline: baselinePerf.requestCount || 0,
            current: currentPerf.requestCount || 0,
          });
        }

        // Check totalSizeBytes
        if (baselinePerf.totalSizeBytes !== currentPerf.totalSizeBytes) {
          performanceChanges.push({
            metric: 'totalSizeBytes',
            baseline: baselinePerf.totalSizeBytes || 0,
            current: currentPerf.totalSizeBytes || 0,
          });
        }
      }

      // Determine if there are any changes
      const hasChanges =
        seoChanges.length > 0 ||
        headerChanges.length > 0 ||
        performanceChanges.length > 0 ||
        baselineSnapshot?.htmlHash !== comparisonSnapshot.htmlHash;

      // Return diff details
      return reply.send({
        hasChanges,
        seoChanges,
        headerChanges,
        performanceChanges,
        visualDiff: comparisonSnapshot.diffImagePath
          ? {
              diffImageUrl: `/api/v1/artifacts/${pageId}/diff`,
              pixelDifference: 0, // TODO: Store this in snapshot
            }
          : null,
      });
    },
  );
}
