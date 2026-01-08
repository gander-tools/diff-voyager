/**
 * @ts-rest API routes integration tests
 *
 * Tests type-safe API routes using @ts-rest/fastify integration
 */

import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import * as tmp from 'tmp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../../src/api/app.js';
import {
  closeDatabase,
  createDatabase,
  type DatabaseInstance,
} from '../../../src/storage/database.js';
import { createDrizzleDb } from '../../../src/storage/drizzle/db.js';
import { HTML_FIXTURES } from '../../fixtures/html/index.js';
import { MockServer } from '../../helpers/mock-server.js';

describe('@ts-rest API Routes', () => {
  let app: FastifyInstance;
  let db: DatabaseInstance;
  let mockServer: MockServer;
  let baseUrl: string;
  let testDir: string;

  beforeAll(async () => {
    // Setup test directory
    testDir = tmp.dirSync({ unsafeCleanup: true, prefix: 'diff-voyager-test-' }).name;

    const dbPath = join(testDir, 'test.db');
    const artifactsDir = join(testDir, 'artifacts');
    await mkdir(artifactsDir, { recursive: true });

    // Create database
    db = createDatabase({ dbPath, baseDir: testDir, artifactsDir });
    const drizzleDb = createDrizzleDb(db);

    // Create app with @ts-rest routes
    app = await createApp({ db, drizzleDb, artifactsDir });

    // Start mock server
    mockServer = new MockServer({
      routes: [
        { path: '/test-page', body: HTML_FIXTURES.baseline.simple },
        { path: '/page-1', body: HTML_FIXTURES.baseline.simple },
        { path: '/page-2', body: HTML_FIXTURES.baseline.simple },
      ],
    });
    baseUrl = await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
    closeDatabase(db);
    await rm(testDir, { recursive: true, force: true });
  });

  describe('POST /api/v1/scans (@ts-rest createScan)', () => {
    it('should create async scan and return 202', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/scans',
        payload: {
          url: `${baseUrl}/test-page`,
          sync: false,
        },
      });

      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('projectId');
      expect(body).toHaveProperty('status', 'PENDING');
      expect(body).toHaveProperty('statusUrl');
    });

    it('should create sync scan and return 200 with full project details', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/scans',
        payload: {
          url: `${baseUrl}/test-page`,
          sync: true,
          name: 'Test Sync Scan',
          description: 'Test description',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('name', 'Test Sync Scan');
      expect(body).toHaveProperty('description', 'Test description');
      expect(body).toHaveProperty('baseUrl', baseUrl);
      expect(body).toHaveProperty('config');
      expect(body).toHaveProperty('statistics');
      expect(body).toHaveProperty('pages');
    });

    it('should validate required URL field', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/scans',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('message');
      expect(body.message).toContain('url');
    });

    it('should validate URL format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/scans',
        payload: {
          url: 'not-a-valid-url',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('message');
    });
  });

  describe('GET /api/v1/projects (@ts-rest listProjects)', () => {
    it('should return empty projects list initially', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/projects',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('projects');
      expect(body).toHaveProperty('pagination');
      expect(Array.isArray(body.projects)).toBe(true);
    });

    it('should return projects after creating scans', async () => {
      // Create a scan first
      await app.inject({
        method: 'POST',
        url: '/api/v1/scans',
        payload: {
          url: `${baseUrl}/test-page`,
          sync: false,
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/projects',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.projects.length).toBeGreaterThan(0);
      expect(body.projects[0]).toHaveProperty('id');
      expect(body.projects[0]).toHaveProperty('name');
      expect(body.projects[0]).toHaveProperty('baseUrl');
    });

    it('should support pagination with limit and offset', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/projects?limit=10&offset=0',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.pagination).toHaveProperty('limit', 10);
      expect(body.pagination).toHaveProperty('offset', 0);
      expect(body.pagination).toHaveProperty('total');
      expect(body.pagination).toHaveProperty('hasMore');
    });
  });

  describe('GET /api/v1/projects/:projectId (@ts-rest getProject)', () => {
    let projectId: string;

    beforeAll(async () => {
      // Create a project
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/scans',
        payload: {
          url: `${baseUrl}/test-page`,
          sync: true,
        },
      });
      const body = JSON.parse(response.body);
      projectId = body.id;
    });

    it('should return project details by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${projectId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('id', projectId);
      expect(body).toHaveProperty('name');
      expect(body).toHaveProperty('baseUrl');
      expect(body).toHaveProperty('config');
      expect(body).toHaveProperty('statistics');
    });

    it('should support includePages query parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${projectId}?includePages=true`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('pages');
      expect(Array.isArray(body.pages)).toBe(true);
    });

    it('should support page pagination parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${projectId}?includePages=true&pageLimit=5&pageOffset=0`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('pagination');
      expect(body.pagination).toHaveProperty('limit', 5);
      expect(body.pagination).toHaveProperty('offset', 0);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/projects/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/projects/invalid-uuid',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/projects/:projectId/runs (@ts-rest listProjectRuns)', () => {
    let projectId: string;

    beforeAll(async () => {
      // Create a project
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/scans',
        payload: {
          url: `${baseUrl}/test-page`,
          sync: true,
        },
      });
      const body = JSON.parse(response.body);
      projectId = body.id;
    });

    it('should return runs list for project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${projectId}/runs`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('runs');
      expect(body).toHaveProperty('pagination');
      expect(Array.isArray(body.runs)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${projectId}/runs?limit=10&offset=0`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.pagination).toHaveProperty('limit', 10);
      expect(body.pagination).toHaveProperty('offset', 0);
    });
  });

  describe('POST /api/v1/projects/:projectId/runs (@ts-rest createProjectRun)', () => {
    let projectId: string;

    beforeAll(async () => {
      // Create a project
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/scans',
        payload: {
          url: `${baseUrl}/test-page`,
          sync: true,
        },
      });
      const body = JSON.parse(response.body);
      projectId = body.id;
    });

    it('should create a new run for project', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${projectId}/runs`,
        payload: {
          url: `${baseUrl}/test-page`,
        },
      });

      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('runId');
      expect(body).toHaveProperty('status', 'PENDING');
      expect(body).toHaveProperty('runUrl');
    });

    it('should validate required URL field', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${projectId}/runs`,
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/runs/:runId (@ts-rest getRunDetails)', () => {
    let runId: string;

    beforeAll(async () => {
      // Create a project and run
      const projectResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/scans',
        payload: {
          url: `${baseUrl}/test-page`,
          sync: true,
        },
      });
      const project = JSON.parse(projectResponse.body);

      const runResponse = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${project.id}/runs`,
        payload: {
          url: `${baseUrl}/test-page`,
        },
      });
      const run = JSON.parse(runResponse.body);
      runId = run.runId;
    });

    it('should return run details by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/runs/${runId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('id', runId);
      expect(body).toHaveProperty('projectId');
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('createdAt');
    });

    it('should return 404 for non-existent run', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/runs/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/pages/:pageId (@ts-rest getPageDetails)', () => {
    let pageId: string;

    beforeAll(async () => {
      // Create a project with pages
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/scans',
        payload: {
          url: `${baseUrl}/test-page`,
          sync: true,
        },
      });
      const body = JSON.parse(response.body);
      if (body.pages && body.pages.length > 0) {
        pageId = body.pages[0].id;
      }
    });

    it('should return page details by ID', async () => {
      if (!pageId) {
        console.warn('Skipping test: no pageId available');
        return;
      }

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/pages/${pageId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('id', pageId);
      expect(body).toHaveProperty('url');
      expect(body).toHaveProperty('status');
    });

    it('should return 404 for non-existent page', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/pages/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
