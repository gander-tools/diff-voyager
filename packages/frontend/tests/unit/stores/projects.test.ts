/**
 * ProjectsStore unit tests
 * Tests Pinia store with MSW-mocked API responses
 */

import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { createPinia, setActivePinia } from 'pinia';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { useProjectsStore } from '../../../src/stores/projects';

const API_BASE_URL = 'http://localhost:3000/api/v1';

// MSW server setup
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('projectsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('fetchProjects', () => {
    it('should fetch projects list with pagination', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'Project 1',
          description: 'Description 1',
          baseUrl: 'https://example.com',
          status: 'completed',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Project 2',
          description: 'Description 2',
          baseUrl: 'https://example2.com',
          status: 'in_progress',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      ];

      server.use(
        http.get(`${API_BASE_URL}/projects`, () => {
          return HttpResponse.json({
            projects: mockProjects,
            pagination: {
              total: 2,
              limit: 50,
              offset: 0,
              hasMore: false,
            },
          });
        }),
      );

      const store = useProjectsStore();
      await store.fetchProjects();

      expect(store.projectList).toHaveLength(2);
      expect(store.projectList[0].name).toBe('Project 1');
      expect(store.pagination.total).toBe(2);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle pagination parameters', async () => {
      server.use(
        http.get(`${API_BASE_URL}/projects`, ({ request }) => {
          const url = new URL(request.url);
          const limit = url.searchParams.get('limit');
          const offset = url.searchParams.get('offset');

          expect(limit).toBe('10');
          expect(offset).toBe('5');

          return HttpResponse.json({
            projects: [],
            pagination: {
              total: 100,
              limit: 10,
              offset: 5,
              hasMore: true,
            },
          });
        }),
      );

      const store = useProjectsStore();
      await store.fetchProjects({ limit: 10, offset: 5 });

      expect(store.pagination.limit).toBe(10);
      expect(store.pagination.offset).toBe(5);
      expect(store.pagination.hasMore).toBe(true);
    });

    it('should handle fetch errors', async () => {
      server.use(
        http.get(`${API_BASE_URL}/projects`, () => {
          return HttpResponse.json(
            { error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
            { status: 500 },
          );
        }),
      );

      const store = useProjectsStore();
      await expect(store.fetchProjects()).rejects.toThrow();

      expect(store.loading).toBe(false);
      expect(store.error).toBeTruthy();
    });

    it('should set loading state during fetch', async () => {
      let resolveRequest: ((value: unknown) => void) | undefined;
      const requestPromise = new Promise((resolve) => {
        resolveRequest = resolve;
      });

      server.use(
        http.get(`${API_BASE_URL}/projects`, async () => {
          await requestPromise;
          return HttpResponse.json({
            projects: [],
            pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
          });
        }),
      );

      const store = useProjectsStore();
      const fetchPromise = store.fetchProjects();

      expect(store.loading).toBe(true);

      resolveRequest?.(null);
      await fetchPromise;

      expect(store.loading).toBe(false);
    });
  });

  describe('fetchProjectById', () => {
    it('should fetch single project by ID', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test description',
        baseUrl: 'https://example.com',
        config: {
          crawl: true,
          viewport: { width: 1920, height: 1080 },
          visualDiffThreshold: 0.01,
          maxPages: 100,
        },
        status: 'completed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        statistics: {
          totalPages: 10,
          completedPages: 10,
          errorPages: 0,
          changedPages: 0,
          unchangedPages: 10,
          totalDifferences: 0,
          criticalDifferences: 0,
          acceptedDifferences: 0,
          mutedDifferences: 0,
        },
        pages: [],
        pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
      };

      server.use(
        http.get(`${API_BASE_URL}/projects/project-1`, () => {
          return HttpResponse.json(mockProject);
        }),
      );

      const store = useProjectsStore();
      await store.fetchProjectById('project-1');

      expect(store.currentProject).toBeTruthy();
      expect(store.currentProject?.name).toBe('Test Project');
      expect(store.currentProject?.config.crawl).toBe(true);
    });

    it('should handle 404 for non-existent project', async () => {
      server.use(
        http.get(`${API_BASE_URL}/projects/non-existent`, () => {
          return HttpResponse.json(
            { error: { code: 'NOT_FOUND', message: 'Project not found' } },
            { status: 404 },
          );
        }),
      );

      const store = useProjectsStore();
      await expect(store.fetchProjectById('non-existent')).rejects.toThrow();

      expect(store.error).toBeTruthy();
    });
  });

  describe('createProject', () => {
    it('should create new project', async () => {
      const newProjectData = {
        name: 'New Project',
        url: 'https://newproject.com',
        description: 'New description',
        crawl: true,
        viewport: { width: 1920, height: 1080 },
        collectHar: false,
        waitAfterLoad: 1000,
        visualDiffThreshold: 0.01,
        maxPages: 50,
      };

      server.use(
        http.post(`${API_BASE_URL}/scans`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.name).toBe('New Project');
          expect(body.sync).toBe(true); // Should request sync mode

          return HttpResponse.json({
            id: 'new-project-id',
            name: 'New Project',
            description: 'New description',
            baseUrl: 'https://newproject.com',
            config: {
              crawl: true,
              viewport: { width: 1920, height: 1080 },
              visualDiffThreshold: 0.01,
              maxPages: 50,
            },
            status: 'completed',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            statistics: {
              totalPages: 0,
              completedPages: 0,
              errorPages: 0,
              changedPages: 0,
              unchangedPages: 0,
              totalDifferences: 0,
              criticalDifferences: 0,
              acceptedDifferences: 0,
              mutedDifferences: 0,
            },
            pages: [],
            pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
          });
        }),
      );

      const store = useProjectsStore();
      const project = await store.createProject(newProjectData);

      expect(project.id).toBe('new-project-id');
      expect(project.name).toBe('New Project');
    });

    it('should handle validation errors', async () => {
      server.use(
        http.post(`${API_BASE_URL}/scans`, () => {
          return HttpResponse.json(
            {
              bodyErrors: {
                url: { message: 'Invalid URL' },
              },
            },
            { status: 400 },
          );
        }),
      );

      const store = useProjectsStore();
      await expect(
        store.createProject({
          name: 'Test',
          url: 'invalid-url',
        }),
      ).rejects.toThrow();
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/projects/project-1`, () => {
          return new HttpResponse(null, { status: 204 });
        }),
      );

      const store = useProjectsStore();

      // Add project to store first
      store.items.set('project-1', {
        id: 'project-1',
        name: 'Project 1',
        description: '',
        baseUrl: 'https://example.com',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      store.list.push('project-1');

      await store.deleteProject('project-1');

      expect(store.items.has('project-1')).toBe(false);
      expect(store.list).not.toContain('project-1');
    });

    it('should handle delete errors', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/projects/non-existent`, () => {
          return HttpResponse.json(
            { error: { code: 'NOT_FOUND', message: 'Project not found' } },
            { status: 404 },
          );
        }),
      );

      const store = useProjectsStore();
      await expect(store.deleteProject('non-existent')).rejects.toThrow();
    });
  });

  describe('getters', () => {
    it('should return project list in order', () => {
      const store = useProjectsStore();

      store.items.set('1', {
        id: '1',
        name: 'Project 1',
        description: '',
        baseUrl: 'https://example.com',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      store.items.set('2', {
        id: '2',
        name: 'Project 2',
        description: '',
        baseUrl: 'https://example2.com',
        status: 'in_progress',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      store.list = ['1', '2'];

      expect(store.projectList).toHaveLength(2);
      expect(store.projectList[0].id).toBe('1');
      expect(store.projectList[1].id).toBe('2');
    });

    it('should return current project', () => {
      const store = useProjectsStore();

      const project = {
        id: '1',
        name: 'Current Project',
        description: '',
        baseUrl: 'https://example.com',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.items.set('1', project);
      store.currentId = '1';

      expect(store.currentProject).toEqual(project);
    });

    it('should return null for current project if not set', () => {
      const store = useProjectsStore();
      expect(store.currentProject).toBeNull();
    });

    it('should return recent projects with limit', () => {
      const store = useProjectsStore();

      for (let i = 1; i <= 10; i++) {
        store.items.set(`${i}`, {
          id: `${i}`,
          name: `Project ${i}`,
          description: '',
          baseUrl: 'https://example.com',
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        store.list.push(`${i}`);
      }

      const recent = store.recentProjects(5);
      expect(recent).toHaveLength(5);
      expect(recent[0].id).toBe('1');
    });

    it('should return all projects if limit exceeds count', () => {
      const store = useProjectsStore();

      store.items.set('1', {
        id: '1',
        name: 'Project 1',
        description: '',
        baseUrl: 'https://example.com',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      store.list = ['1'];

      const recent = store.recentProjects(10);
      expect(recent).toHaveLength(1);
    });
  });

  describe('state management', () => {
    it('should initialize with correct default state', () => {
      const store = useProjectsStore();

      expect(store.items.size).toBe(0);
      expect(store.list).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.currentId).toBeNull();
      expect(store.pagination).toEqual({
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      });
    });

    it('should clear error on successful operation', async () => {
      server.use(
        http.get(`${API_BASE_URL}/projects`, () => {
          return HttpResponse.json({
            projects: [],
            pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
          });
        }),
      );

      const store = useProjectsStore();
      store.error = 'Previous error';

      await store.fetchProjects();

      expect(store.error).toBeNull();
    });
  });
});
