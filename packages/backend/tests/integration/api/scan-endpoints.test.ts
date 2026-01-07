/**
 * Scan API endpoint integration tests
 *
 * NOTE: Tests requiring Playwright (sync scans) are skipped in CI environments
 * where browser binaries are not available.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Check if Playwright browsers are available
const PLAYWRIGHT_AVAILABLE = await checkPlaywrightAvailable();

async function checkPlaywrightAvailable(): Promise<boolean> {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    return true;
  } catch {
    return false;
  }
}
import { createApp } from '../../../src/api/app.js';
import { createDatabase, closeDatabase, type DatabaseInstance } from '../../../src/storage/database.js';
import { MockServer } from '../../helpers/mock-server.js';
import { HTML_FIXTURES } from '../../fixtures/html/index.js';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import type { FastifyInstance } from 'fastify';

describe('POST /api/v1/scans', () => {
  let app: FastifyInstance;
  let db: DatabaseInstance;
  let mockServer: MockServer;
  let baseUrl: string;
  let testDir: string;

  beforeAll(async () => {
    // Setup test directory
    testDir = join(tmpdir(), `diff-voyager-test-${randomUUID()}`);
    await mkdir(testDir, { recursive: true });

    const dbPath = join(testDir, 'test.db');
    const artifactsDir = join(testDir, 'artifacts');
    await mkdir(artifactsDir, { recursive: true });

    // Create database
    db = createDatabase({ dbPath, baseDir: testDir, artifactsDir });

    // Create app
    app = await createApp({ db, artifactsDir });

    // Start mock server
    mockServer = new MockServer({
      routes: [
        { path: '/test-page', body: HTML_FIXTURES.baseline.simple },
      ],
    });
    baseUrl = await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
    closeDatabase(db);
    await rm(testDir, { recursive: true, force: true });
  });

  it('should return 400 when URL is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/scans',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('URL is required');
  });

  it('should return 400 for invalid URL format', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/scans',
      payload: { url: 'not-a-url' },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('Invalid URL format');
  });

  it('should return 202 for async scan request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/scans',
      payload: {
        url: `${baseUrl}/test-page`,
      },
    });

    expect(response.statusCode).toBe(202);
    const body = JSON.parse(response.body);
    expect(body.projectId).toBeDefined();
    expect(body.status).toBe('PENDING');
    expect(body.projectUrl).toContain('/api/v1/projects/');
  });

  it.skipIf(!PLAYWRIGHT_AVAILABLE)('should return 200 with full result for sync scan', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/scans',
      payload: {
        url: `${baseUrl}/test-page`,
        sync: true,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBeDefined();
    expect(body.status).toBe('completed');
    expect(body.pages).toHaveLength(1);
    expect(body.pages[0].status).toBe('completed');
    expect(body.pages[0].seoData?.title).toBe('Test Page Title');
  });

  it.skipIf(!PLAYWRIGHT_AVAILABLE)('should accept optional configuration', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/scans',
      payload: {
        url: `${baseUrl}/test-page`,
        name: 'Custom Name',
        description: 'Test description',
        viewport: { width: 1280, height: 720 },
        sync: true,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.name).toBe('Custom Name');
    expect(body.description).toBe('Test description');
    expect(body.config.viewport.width).toBe(1280);
  });
});

describe('GET /api/v1/projects/:projectId', () => {
  let app: FastifyInstance;
  let db: DatabaseInstance;
  let mockServer: MockServer;
  let baseUrl: string;
  let testDir: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `diff-voyager-test-${randomUUID()}`);
    await mkdir(testDir, { recursive: true });

    const dbPath = join(testDir, 'test.db');
    const artifactsDir = join(testDir, 'artifacts');
    await mkdir(artifactsDir, { recursive: true });

    db = createDatabase({ dbPath, baseDir: testDir, artifactsDir });
    app = await createApp({ db, artifactsDir });

    mockServer = new MockServer({
      routes: [
        { path: '/test-page', body: HTML_FIXTURES.baseline.simple },
      ],
    });
    baseUrl = await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
    closeDatabase(db);
    await rm(testDir, { recursive: true, force: true });
  });

  it('should return 404 for non-existent project', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/non-existent-id',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it.skipIf(!PLAYWRIGHT_AVAILABLE)('should return project details after scan', async () => {
    // Create a scan first
    const scanResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/scans',
      payload: {
        url: `${baseUrl}/test-page`,
        sync: true,
      },
    });

    const scanBody = JSON.parse(scanResponse.body);
    const projectId = scanBody.id;

    // Get project details
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBe(projectId);
    expect(body.pages).toHaveLength(1);
    expect(body.statistics.totalPages).toBe(1);
    expect(body.statistics.completedPages).toBe(1);
  });
});
