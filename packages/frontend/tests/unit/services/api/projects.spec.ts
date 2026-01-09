import type { CreateScanRequest } from '@gander-tools/diff-voyager-shared';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createScan, getProject, listProjects } from '@/services/api/projects';

const API_BASE_URL = 'http://localhost:3000/api/v1';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Projects API', () => {
  describe('createScan', () => {
    it('should create a scan and return projectId', async () => {
      const mockRequest: CreateScanRequest = {
        url: 'https://example.com',
        crawl: false,
      };

      server.use(
        http.post(`${API_BASE_URL}/scans`, async ({ request }) => {
          const _body = await request.json();
          return HttpResponse.json(
            {
              projectId: 'project-123',
              message: 'Scan created',
            },
            { status: 202 },
          );
        }),
      );

      const result = await createScan(mockRequest);
      expect('projectId' in result && result.projectId).toBe('project-123');
    });
  });

  describe('listProjects', () => {
    it('should list all projects', async () => {
      server.use(
        http.get(`${API_BASE_URL}/projects`, () => {
          return HttpResponse.json({
            projects: [
              {
                id: 'project-1',
                name: 'Test Project 1',
                baseUrl: 'https://example1.com',
                description: '',
                status: 'COMPLETED',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
              },
              {
                id: 'project-2',
                name: 'Test Project 2',
                baseUrl: 'https://example2.com',
                description: '',
                status: 'COMPLETED',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
              },
            ],
            pagination: {
              total: 2,
              limit: 50,
              offset: 0,
              hasMore: false,
            },
          });
        }),
      );

      const projects = await listProjects();
      expect(projects).toHaveLength(2);
      expect(projects[0]?.id).toBe('project-1');
    });

    it('should support pagination parameters', async () => {
      let capturedUrl = '';

      server.use(
        http.get(`${API_BASE_URL}/projects`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            projects: [],
            pagination: {
              total: 0,
              limit: 10,
              offset: 20,
              hasMore: false,
            },
          });
        }),
      );

      await listProjects({ limit: 10, offset: 20 });
      expect(capturedUrl).toContain('limit=10');
      expect(capturedUrl).toContain('offset=20');
    });
  });

  describe('getProject', () => {
    it('should get project details', async () => {
      server.use(
        http.get(`${API_BASE_URL}/projects/project-123`, () => {
          return HttpResponse.json({
            id: 'project-123',
            name: 'Test Project',
            baseUrl: 'https://example.com',
            config: {},
            statistics: { totalPages: 10 },
          });
        }),
      );

      const project = await getProject('project-123');
      expect(project.id).toBe('project-123');
      expect(project.name).toBe('Test Project');
    });

    it('should support includePages parameter', async () => {
      let capturedUrl = '';

      server.use(
        http.get(`${API_BASE_URL}/projects/project-123`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({
            id: 'project-123',
            name: 'Test',
            pages: [],
          });
        }),
      );

      await getProject('project-123', { includePages: true, pageLimit: 50 });
      expect(capturedUrl).toContain('includePages=true');
      expect(capturedUrl).toContain('pageLimit=50');
    });
  });
});
