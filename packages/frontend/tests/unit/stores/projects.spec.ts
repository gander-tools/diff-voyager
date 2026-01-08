import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { createPinia, setActivePinia } from 'pinia';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { useProjectsStore } from '@/stores/projects';

const API_BASE_URL = 'http://localhost:3000/api/v1';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Projects Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should fetch projects list', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects`, () => {
        return HttpResponse.json([
          { id: 'project-1', name: 'Test Project 1' },
          { id: 'project-2', name: 'Test Project 2' },
        ]);
      }),
    );

    const store = useProjectsStore();
    await store.fetchProjects();

    expect(store.projects).toHaveLength(2);
    expect(store.projectsCount).toBe(2);
    expect(store.hasProjects).toBe(true);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should fetch a single project', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/project-123`, () => {
        return HttpResponse.json({
          id: 'project-123',
          name: 'Test Project',
          baseUrl: 'https://example.com',
        });
      }),
    );

    const store = useProjectsStore();
    await store.fetchProject('project-123');

    expect(store.currentProject).not.toBeNull();
    expect(store.currentProject?.id).toBe('project-123');
    expect(store.loading).toBe(false);
  });

  it('should handle fetch errors', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects`, () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      }),
    );

    const store = useProjectsStore();

    await expect(store.fetchProjects()).rejects.toThrow();
    expect(store.error).toBeTruthy();
    expect(store.loading).toBe(false);
  });

  it('should clear current project', () => {
    const store = useProjectsStore();
    store.currentProject = { id: 'test', name: 'Test', config: {} } as ProjectEntity;

    store.clearCurrentProject();
    expect(store.currentProject).toBeNull();
  });

  it('should clear error', () => {
    const store = useProjectsStore();
    store.error = 'Some error';

    store.clearError();
    expect(store.error).toBeNull();
  });
});
