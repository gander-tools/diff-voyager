/**
 * Scan API routes (POST /scans)
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { Database } from 'better-sqlite3';
import {
  DEFAULT_VIEWPORT,
  DEFAULT_VISUAL_THRESHOLD,
  DEFAULT_WAIT_AFTER_LOAD,
  type CreateScanRequest,
  type CreateScanAsyncResponse,
} from '@gander-tools/diff-voyager-shared';
import { ProjectRepository } from '../../storage/repositories/project-repository.js';
import { RunRepository } from '../../storage/repositories/run-repository.js';
import { PageRepository } from '../../storage/repositories/page-repository.js';
import { SnapshotRepository } from '../../storage/repositories/snapshot-repository.js';
import { ScanProcessor } from '../../services/scan-processor.js';

interface ScanRoutesOptions extends FastifyPluginOptions {
  db: Database;
  artifactsDir: string;
}

export async function registerScanRoutes(
  app: FastifyInstance,
  options: ScanRoutesOptions
): Promise<void> {
  const { db, artifactsDir } = options;
  const projectRepo = new ProjectRepository(db);
  const runRepo = new RunRepository(db);
  const pageRepo = new PageRepository(db);
  const snapshotRepo = new SnapshotRepository(db);

  app.post<{ Body: CreateScanRequest }>('/scans', async (request, reply) => {
    const body = request.body;

    // Validation
    if (!body.url) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'URL is required',
        },
      });
    }

    try {
      new URL(body.url);
    } catch {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid URL format',
        },
      });
    }

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
  });
}
