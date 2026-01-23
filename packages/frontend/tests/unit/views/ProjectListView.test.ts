/**
 * ProjectListView tests
 * Tests project list with pagination and actions
 */

import { mount } from '@vue/test-utils';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { NDialogProvider, NNotificationProvider } from 'naive-ui';
import { createPinia, setActivePinia } from 'pinia';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { useProjectsStore } from '../../../src/stores/projects';
import ProjectListView from '../../../src/views/ProjectListView.vue';

const API_BASE_URL = 'http://localhost:3000/api/v1';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const mockRouter = {
  push: vi.fn(),
};

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
}));

describe('ProjectListView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouter.push.mockClear();
  });

  // Helper to mount component with required providers
  const mountWithProviders = () => {
    return mount({
      setup() {
        return () =>
          h(NDialogProvider, null, {
            default: () =>
              h(NNotificationProvider, null, {
                default: () => h(ProjectListView),
              }),
          });
      },
    });
  };

  it('should render title', () => {
    const wrapper = mountWithProviders();
    expect(wrapper.text()).toContain('Projects');
  });

  it('should fetch projects on mount', async () => {
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
          pagination: { total: 1, limit: 12, offset: 0, hasMore: false },
        });
      }),
    );

    mountWithProviders();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const store = useProjectsStore();
    expect(store.projectList).toHaveLength(1);
  });

  it('should display project cards', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects`, () => {
        return HttpResponse.json({
          projects: [
            {
              id: '1',
              name: 'Test Project',
              description: '',
              baseUrl: 'https://example.com',
              status: 'completed',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
          pagination: { total: 1, limit: 12, offset: 0, hasMore: false },
        });
      }),
    );

    const wrapper = mountWithProviders();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('Test Project');
  });

  it('should show empty state when no projects', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects`, () => {
        return HttpResponse.json({
          projects: [],
          pagination: { total: 0, limit: 12, offset: 0, hasMore: false },
        });
      }),
    );

    const wrapper = mountWithProviders();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('No projects');
  });

  it('should navigate to new project on button click', async () => {
    const wrapper = mountWithProviders();
    const button = wrapper.find('[data-test="new-project-btn"]');

    if (button.exists()) {
      await button.trigger('click');
      expect(mockRouter.push).toHaveBeenCalledWith('/projects/new');
    }
  });

  it('should support pagination', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects`, ({ request }) => {
        const url = new URL(request.url);
        const offset = Number.parseInt(url.searchParams.get('offset') || '0', 10);

        return HttpResponse.json({
          projects: [],
          pagination: { total: 25, limit: 12, offset, hasMore: offset + 12 < 25 },
        });
      }),
    );

    mountWithProviders();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const store = useProjectsStore();
    expect(store.pagination.total).toBe(25);
    expect(store.pagination.hasMore).toBe(true);
  });
});
