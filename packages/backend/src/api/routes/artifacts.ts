/**
 * Artifact API routes (GET /artifacts/:pageId/*)
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

interface ArtifactRoutesOptions extends FastifyPluginOptions {
  artifactsDir: string;
}

export async function registerArtifactRoutes(
  app: FastifyInstance,
  options: ArtifactRoutesOptions
): Promise<void> {
  const { artifactsDir } = options;

  // Screenshot
  app.get<{ Params: { pageId: string } }>(
    '/artifacts/:pageId/screenshot',
    {
      config: {
        rateLimit: {
          max: 50,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
    const { pageId } = request.params;
    const filePath = join(artifactsDir, pageId, 'screenshot.png');

    if (!existsSync(filePath)) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Screenshot not found',
        },
      });
    }

      const content = await readFile(filePath);
      return reply
        .header('Content-Type', 'image/png')
        .header('Content-Disposition', 'inline; filename="screenshot.png"')
        .send(content);
    }
  );

  // Baseline screenshot
  app.get<{ Params: { pageId: string } }>(
    '/artifacts/:pageId/baseline-screenshot',
    {
      config: {
        rateLimit: {
          max: 50,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const { pageId } = request.params;
      const filePath = join(artifactsDir, pageId, 'baseline-screenshot.png');

      if (!existsSync(filePath)) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Baseline screenshot not found',
          },
        });
      }

      const content = await readFile(filePath);
      return reply.header('Content-Type', 'image/png').send(content);
    }
  );

  // Diff image
  app.get<{ Params: { pageId: string } }>(
    '/artifacts/:pageId/diff',
    {
      config: {
        rateLimit: {
          max: 50,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
    const { pageId } = request.params;
    const filePath = join(artifactsDir, pageId, 'diff.png');

    if (!existsSync(filePath)) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Diff image not found',
        },
      });
    }

      const content = await readFile(filePath);
      return reply
        .header('Content-Type', 'image/png')
        .header('Content-Disposition', 'inline; filename="diff.png"')
        .send(content);
    }
  );

  // HAR file
  app.get<{ Params: { pageId: string } }>(
    '/artifacts/:pageId/har',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
    const { pageId } = request.params;
    const filePath = join(artifactsDir, pageId, 'page.har');

    if (!existsSync(filePath)) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'HAR file not found',
        },
      });
    }

      const content = await readFile(filePath, 'utf-8');
      return reply
        .header('Content-Type', 'application/json')
        .header('Content-Disposition', 'attachment; filename="page.har"')
        .send(content);
    }
  );

  // HTML
  app.get<{ Params: { pageId: string } }>(
    '/artifacts/:pageId/html',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
    const { pageId } = request.params;
    const filePath = join(artifactsDir, pageId, 'page.html');

    if (!existsSync(filePath)) {
      return reply.status(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'HTML file not found',
        },
      });
    }

      const content = await readFile(filePath, 'utf-8');
      return reply.header('Content-Type', 'text/html; charset=utf-8').send(content);
    }
  );
}
