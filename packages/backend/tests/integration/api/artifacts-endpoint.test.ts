/**
 * Artifact endpoints integration tests
 */

import { randomUUID } from 'node:crypto';
import { mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { PNG } from 'pngjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../../src/api/app.js';
import {
  closeDatabase,
  createDatabase,
  type DatabaseInstance,
} from '../../../src/storage/database.js';

// Helper to create a test PNG buffer
function createTestImage(
  width: number,
  height: number,
  color: [number, number, number, number],
): Buffer {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = color[0]; // R
      png.data[idx + 1] = color[1]; // G
      png.data[idx + 2] = color[2]; // B
      png.data[idx + 3] = color[3]; // A
    }
  }
  return PNG.sync.write(png);
}

describe('Artifact Endpoints', () => {
  let app: FastifyInstance;
  let db: DatabaseInstance;
  let testDir: string;
  let artifactsDir: string;
  let testPageId: string;

  beforeAll(async () => {
    // Setup test directory
    testDir = join(tmpdir(), `diff-voyager-artifacts-test-${randomUUID()}`);
    await mkdir(testDir, { recursive: true });

    const dbPath = join(testDir, 'test.db');
    artifactsDir = join(testDir, 'artifacts');
    await mkdir(artifactsDir, { recursive: true });

    // Create a test page directory with artifacts
    testPageId = randomUUID();
    const pageDir = join(artifactsDir, testPageId);
    await mkdir(pageDir, { recursive: true });

    // Create test artifacts
    const screenshotBuffer = createTestImage(100, 100, [255, 255, 255, 255]);
    await writeFile(join(pageDir, 'screenshot.png'), screenshotBuffer);
    await writeFile(join(pageDir, 'baseline-screenshot.png'), screenshotBuffer);
    await writeFile(join(pageDir, 'diff.png'), screenshotBuffer);
    await writeFile(join(pageDir, 'page.har'), JSON.stringify({ log: { version: '1.2' } }));
    await writeFile(join(pageDir, 'page.html'), '<html><body>Test Page</body></html>');

    // Create database
    db = createDatabase({ dbPath, baseDir: testDir, artifactsDir });

    // Create app
    app = await createApp({ db, artifactsDir });
    await app.ready();
  });

  afterAll(async () => {
    closeDatabase(db);
    await rm(testDir, { recursive: true, force: true });
  });

  describe('GET /api/v1/artifacts/:pageId/screenshot', () => {
    it('should return screenshot image', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/artifacts/${testPageId}/screenshot`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
      expect(response.headers['content-disposition']).toContain('screenshot.png');
      expect(response.rawPayload.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent page', async () => {
      const nonExistentId = randomUUID();
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/artifacts/${nonExistentId}/screenshot`,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return error for path traversal attempt', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/artifacts/../../../etc/passwd/screenshot',
      });

      // Fastify normalizes URL paths, so path traversal gets normalized
      // and results in 404 (not found) instead of 400
      expect([400, 404]).toContain(response.statusCode);
    });
  });

  describe('GET /api/v1/artifacts/:pageId/baseline-screenshot', () => {
    it('should return baseline screenshot image', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/artifacts/${testPageId}/baseline-screenshot`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
      expect(response.rawPayload.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent baseline', async () => {
      const nonExistentId = randomUUID();
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/artifacts/${nonExistentId}/baseline-screenshot`,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/artifacts/:pageId/diff', () => {
    it('should return diff image', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/artifacts/${testPageId}/diff`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
      expect(response.headers['content-disposition']).toContain('diff.png');
      expect(response.rawPayload.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent diff', async () => {
      const nonExistentId = randomUUID();
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/artifacts/${nonExistentId}/diff`,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/artifacts/:pageId/har', () => {
    it('should return HAR file as JSON', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/artifacts/${testPageId}/har`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('page.har');
      expect(response.body).toContain('log');
    });

    it('should return 404 for non-existent HAR', async () => {
      const nonExistentId = randomUUID();
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/artifacts/${nonExistentId}/har`,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/artifacts/:pageId/html', () => {
    it('should return HTML content', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/artifacts/${testPageId}/html`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
      expect(response.body).toContain('<html>');
      expect(response.body).toContain('Test Page');
    });

    it('should return 404 for non-existent HTML', async () => {
      const nonExistentId = randomUUID();
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/artifacts/${nonExistentId}/html`,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Security: Path Traversal Prevention', () => {
    it('should reject pageId with null bytes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/artifacts/test%00evil/screenshot`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject empty pageId', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/artifacts//screenshot',
      });

      // Can be 400 (validation error) or 404 (route not found) depending on how Fastify handles empty path segments
      expect([400, 404]).toContain(response.statusCode);
    });

    it('should reject path with double dots', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/artifacts/..%2F..%2Fetc%2Fpasswd/screenshot',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Security: Symlink Attack Prevention', () => {
    it('should reject symlinks pointing outside artifacts directory', async () => {
      // Create a page directory with a symlink to /etc
      const maliciousPageId = randomUUID();
      const maliciousPageDir = join(artifactsDir, maliciousPageId);
      await mkdir(maliciousPageDir, { recursive: true });

      // Create symlink to /etc/passwd (if it exists)
      const symlinkPath = join(maliciousPageDir, 'screenshot.png');
      try {
        await symlink('/etc/passwd', symlinkPath);
      } catch {
        // Symlink creation might fail in some environments
        return;
      }

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/artifacts/${maliciousPageId}/screenshot`,
      });

      // Should be rejected with 400 (symlink attack detected)
      expect(response.statusCode).toBe(400);
    });
  });
});
