/**
 * Project list endpoint integration tests
 */

import { randomUUID } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import * as tmp from 'tmp';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../../src/api/app.js';
import {
  closeDatabase,
  createDatabase,
  type DatabaseInstance,
} from '../../../src/storage/database.js';
import { ProjectRepository } from '../../../src/storage/repositories/project-repository.js';

describe('GET /api/v1/projects', () => {
  let app: FastifyInstance;
  let db: DatabaseInstance;
  let projectRepo: ProjectRepository;
  let testDir: string;

  beforeAll(async () => {
    // Setup test directory
    testDir = tmp.dirSync({ unsafeCleanup: true, prefix: 'diff-voyager-test-' }).name;

    const dbPath = join(testDir, 'test.db');
    const artifactsDir = join(testDir, 'artifacts');
    await mkdir(artifactsDir, { recursive: true });

    // Create database
    db = createDatabase({ dbPath, baseDir: testDir, artifactsDir });

    // Create repository
    projectRepo = new ProjectRepository(db);

    // Create app
    app = await createApp({ db, artifactsDir });
    await app.ready();
  });

  afterAll(async () => {
    closeDatabase(db);
    await rm(testDir, { recursive: true, force: true });
  });

  it('should return empty list when no projects exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.projects).toEqual([]);
    expect(body.pagination.total).toBe(0);
    expect(body.pagination.limit).toBe(50); // Default limit
    expect(body.pagination.offset).toBe(0);
    expect(body.pagination.hasMore).toBe(false);
  });

  it('should return all projects with default pagination', async () => {
    // Create 3 projects with small delays to ensure different timestamps
    const project1 = await projectRepo.create({
      name: 'Project 1',
      baseUrl: 'https://example1.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.01,
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 10));

    const project2 = await projectRepo.create({
      name: 'Project 2',
      baseUrl: 'https://example2.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.01,
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 10));

    const project3 = await projectRepo.create({
      name: 'Project 3',
      baseUrl: 'https://example3.com',
      config: {
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        visualDiffThreshold: 0.01,
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.projects).toHaveLength(3);
    expect(body.pagination.total).toBe(3);
    expect(body.pagination.hasMore).toBe(false);

    // Should be sorted by createdAt DESC (newest first)
    expect(body.projects[0].id).toBe(project3.id);
    expect(body.projects[1].id).toBe(project2.id);
    expect(body.projects[2].id).toBe(project1.id);
  });

  it('should support limit parameter', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects?limit=2',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.projects).toHaveLength(2);
    expect(body.pagination.limit).toBe(2);
    expect(body.pagination.hasMore).toBe(true);
  });

  it('should support offset parameter', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects?offset=1',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.projects).toHaveLength(2); // 3 total - 1 offset = 2
    expect(body.pagination.offset).toBe(1);
  });

  it('should support both limit and offset parameters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects?limit=1&offset=1',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.projects).toHaveLength(1);
    expect(body.pagination.limit).toBe(1);
    expect(body.pagination.offset).toBe(1);
  });

  it('should validate limit parameter', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects?limit=invalid',
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should validate offset parameter', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects?offset=-1',
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should include project details', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects?limit=1',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    const project = body.projects[0];

    expect(project.id).toBeDefined();
    expect(project.name).toBeDefined();
    expect(project.baseUrl).toBeDefined();
    expect(project.createdAt).toBeDefined();
  });
});
