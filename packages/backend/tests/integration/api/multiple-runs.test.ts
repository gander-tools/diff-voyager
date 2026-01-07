/**
 * Multiple runs integration test
 *
 * Tests the scenario where:
 * 1. First scan creates a project + baseline run
 * 2. Subsequent scans of the same URL create new comparison runs
 * 3. Each run creates new snapshots that are stored in DB and on disk
 */

import { randomUUID } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RunStatus } from '@gander-tools/diff-voyager-shared';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../../src/api/app.js';
import {
  closeDatabase,
  createDatabase,
  type DatabaseInstance,
} from '../../../src/storage/database.js';
import { PageRepository } from '../../../src/storage/repositories/page-repository.js';
import { RunRepository } from '../../../src/storage/repositories/run-repository.js';
import { SnapshotRepository } from '../../../src/storage/repositories/snapshot-repository.js';
import { HTML_FIXTURES } from '../../fixtures/html/index.js';
import { MockServer } from '../../helpers/mock-server.js';

describe('Multiple runs scenario', () => {
  let app: FastifyInstance;
  let db: DatabaseInstance;
  let mockServer: MockServer;
  let baseUrl: string;
  let testDir: string;
  let artifactsDir: string;

  let runRepo: RunRepository;
  let pageRepo: PageRepository;
  let snapshotRepo: SnapshotRepository;

  beforeAll(async () => {
    // Setup test directory
    testDir = join(tmpdir(), `diff-voyager-test-${randomUUID()}`);
    await mkdir(testDir, { recursive: true });

    const dbPath = join(testDir, 'test.db');
    artifactsDir = join(testDir, 'artifacts');
    await mkdir(artifactsDir, { recursive: true });

    // Create database
    db = createDatabase({ dbPath, baseDir: testDir, artifactsDir });

    // Create repositories
    runRepo = new RunRepository(db);
    pageRepo = new PageRepository(db);
    snapshotRepo = new SnapshotRepository(db);

    // Create app
    app = await createApp({ db, artifactsDir });

    // Start mock server with two different HTML versions
    mockServer = new MockServer({
      routes: [{ path: '/test-page', body: HTML_FIXTURES.baseline.simple }],
    });
    baseUrl = await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
    closeDatabase(db);
    await rm(testDir, { recursive: true, force: true });
  });

  it('should create baseline run on first scan (async)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/scans',
      payload: {
        url: `${baseUrl}/test-page`,
        name: 'Test Project',
      },
    });

    expect(response.statusCode).toBe(202);
    const body = JSON.parse(response.body);

    // Verify project created
    expect(body.projectId).toBeDefined();
    expect(body.status).toBe('PENDING');

    const projectId = body.projectId;

    // Verify baseline run created
    const runs = await runRepo.findByProjectId(projectId);
    expect(runs).toHaveLength(1);
    expect(runs[0].isBaseline).toBe(true);
    expect(runs[0].status).toBe(RunStatus.NEW);

    // Note: In async mode, the scan is not executed immediately
    // The page capture would be done by a background worker
  });

  it('should create comparison run on second request to same project', async () => {
    // First scan - baseline (async)
    const baselineResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/scans',
      payload: {
        url: `${baseUrl}/test-page`,
        name: 'Multi-run Project',
      },
    });

    expect(baselineResponse.statusCode).toBe(202);
    const baselineBody = JSON.parse(baselineResponse.body);
    const projectId = baselineBody.projectId;

    // Second scan - comparison run (NEW ENDPOINT TO BE IMPLEMENTED)
    const comparisonResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/runs`,
      payload: {
        url: `${baseUrl}/test-page`,
      },
    });

    expect(comparisonResponse.statusCode).toBe(202);
    const comparisonBody = JSON.parse(comparisonResponse.body);

    // Verify response structure
    expect(comparisonBody.runId).toBeDefined();
    expect(comparisonBody.status).toBe('PENDING');

    // Verify we have 2 runs now (1 baseline + 1 comparison)
    const runs = await runRepo.findByProjectId(projectId);
    expect(runs).toHaveLength(2);

    const baselineRun = runs.find((r) => r.isBaseline);
    const comparisonRun = runs.find((r) => !r.isBaseline);

    expect(baselineRun).toBeDefined();
    expect(comparisonRun).toBeDefined();
    expect(comparisonRun?.id).toBe(comparisonBody.runId);
    expect(comparisonRun?.status).toBe(RunStatus.NEW);
  });

  it('should support multiple sequential comparison runs', async () => {
    // Baseline
    const baselineResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/scans',
      payload: {
        url: `${baseUrl}/test-page`,
      },
    });

    const projectId = JSON.parse(baselineResponse.body).projectId;

    // Create 3 comparison runs
    for (let i = 1; i <= 3; i++) {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${projectId}/runs`,
        payload: {
          url: `${baseUrl}/test-page`,
        },
      });

      expect(response.statusCode).toBe(202);
    }

    // Verify we have 4 runs total (1 baseline + 3 comparisons)
    const runs = await runRepo.findByProjectId(projectId);
    expect(runs).toHaveLength(4);
    expect(runs.filter((r) => r.isBaseline)).toHaveLength(1);
    expect(runs.filter((r) => !r.isBaseline)).toHaveLength(3);
  });
});
