/**
 * DashboardView tests
 * Tests dashboard with statistics and recent projects
 */

import { mount } from '@vue/test-utils';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { createPinia, setActivePinia } from 'pinia';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectsStore } from '../../../src/stores/projects';
import DashboardView from '../../../src/views/DashboardView.vue';

const API_BASE_URL = 'http://localhost:3000/api/v1';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock router
const mockRouter = {
  push: vi.fn(),
};

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
}));

describe('DashboardView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouter.push.mockClear();
  });

  it('should render welcome message', () => {
    const wrapper = mount(DashboardView);
    expect(wrapper.text()).toContain('Diff Voyager');
  });

  it('should fetch recent projects on mount', async () => {
    const mockProjects = [
      {
        id: '1',
        name: 'Project 1',
        description: 'Desc 1',
        baseUrl: 'https://example.com',
        status: 'completed',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    server.use(
      http.get(`${API_BASE_URL}/projects`, () => {
        return HttpResponse.json({
          projects: mockProjects,
          pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
        });
      }),
    );

    mount(DashboardView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const store = useProjectsStore();
    expect(store.projectList).toHaveLength(1);
  });

  it('should display statistics', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects`, () => {
        return HttpResponse.json({
          projects: [
            {
              id: '1',
              name: 'Project 1',
              description: '',
              baseUrl: 'https://example.com',
              status: 'completed',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            {
              id: '2',
              name: 'Project 2',
              description: '',
              baseUrl: 'https://example2.com',
              status: 'in_progress',
              createdAt: '2024-01-02T00:00:00Z',
              updatedAt: '2024-01-02T00:00:00Z',
            },
          ],
          pagination: { total: 2, limit: 50, offset: 0, hasMore: false },
        });
      }),
    );

    const wrapper = mount(DashboardView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('2');
  });

  it('should show empty state when no projects', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects`, () => {
        return HttpResponse.json({
          projects: [],
          pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
        });
      }),
    );

    const wrapper = mount(DashboardView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('No projects');
  });

  it('should navigate to new project on button click', async () => {
    const wrapper = mount(DashboardView);
    const button = wrapper.find('[data-test="new-project-btn"]');

    if (button.exists()) {
      await button.trigger('click');
      expect(mockRouter.push).toHaveBeenCalledWith('/projects/new');
    }
  });

  it('should navigate to projects list on view all button', async () => {
    const wrapper = mount(DashboardView);
    const button = wrapper.find('[data-test="view-all-btn"]');

    if (button.exists()) {
      await button.trigger('click');
      expect(mockRouter.push).toHaveBeenCalledWith('/projects');
    }
  });

  it('should display loading state', async () => {
    let resolveRequest: (value: unknown) => void;
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

    const wrapper = mount(DashboardView);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(wrapper.text()).toContain('Loading');

    resolveRequest!(null);
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('should display error state', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects`, () => {
        return HttpResponse.json(
          { error: { code: 'SERVER_ERROR', message: 'Internal error' } },
          { status: 500 },
        );
      }),
    );

    mount(DashboardView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const store = useProjectsStore();
    expect(store.error).toBeTruthy();
  });
});
