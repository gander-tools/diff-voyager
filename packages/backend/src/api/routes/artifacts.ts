/**
 * Artifact API routes (GET /artifacts/:pageId/*)
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, normalize, sep } from 'node:path';

interface ArtifactRoutesOptions extends FastifyPluginOptions {
  artifactsDir: string;
}

/**
 * Validates and constructs a safe file path within the artifacts directory.
 * Prevents path traversal attacks by ensuring the resolved path stays within artifactsDir.
 *
 * @param artifactsDir - The base artifacts directory
 * @param pageId - The page ID from the request (user input)
 * @param filename - The filename to access
 * @returns The validated absolute file path
 * @throws Error if the path would escape the artifacts directory
 */
function getSafeFilePath(artifactsDir: string, pageId: string, filename: string): string {
  // Normalize and resolve paths
  const baseDir = resolve(normalize(artifactsDir));
  const requestedPath = resolve(baseDir, normalize(pageId), normalize(filename));

  // Check if the requested path starts with the base directory
  // This prevents path traversal attacks (e.g., ../../../etc/passwd)
  if (!requestedPath.startsWith(baseDir + sep) && requestedPath !== baseDir) {
    throw new Error('Invalid path: Path traversal attempt detected');
  }

  return requestedPath;
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

      let filePath: string;
      try {
        filePath = getSafeFilePath(artifactsDir, pageId, 'screenshot.png');
      } catch (error) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid page ID',
          },
        });
      }

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

      let filePath: string;
      try {
        filePath = getSafeFilePath(artifactsDir, pageId, 'baseline-screenshot.png');
      } catch (error) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid page ID',
          },
        });
      }

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

      let filePath: string;
      try {
        filePath = getSafeFilePath(artifactsDir, pageId, 'diff.png');
      } catch (error) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid page ID',
          },
        });
      }

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

      let filePath: string;
      try {
        filePath = getSafeFilePath(artifactsDir, pageId, 'page.har');
      } catch (error) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid page ID',
          },
        });
      }

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

      let filePath: string;
      try {
        filePath = getSafeFilePath(artifactsDir, pageId, 'page.html');
      } catch (error) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid page ID',
          },
        });
      }

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
