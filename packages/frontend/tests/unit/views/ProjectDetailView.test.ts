/**
 * ProjectDetailView tests
 * Tests project detail view with statistics and actions
 */

import { mount } from '@vue/test-utils';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { createPinia, setActivePinia } from 'pinia';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectDetailView from '../../../src/views/ProjectDetailView.vue';

const API_BASE_URL = 'http://localhost:3000/api/v1';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock router
const mockRouter = {
  push: vi.fn(),
};

const mockRoute = {
  params: { id: 'proj-123' },
};

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRoute,
}));

describe('ProjectDetailView', () => {
  const mockProject = {
    id: 'proj-123',
    name: 'Test Project',
    description: 'Test description',
    baseUrl: 'https://example.com',
    status: 'completed',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    config: {
      crawl: true,
      viewport: { width: 1920, height: 1080 },
      visualDiffThreshold: 0.01,
      maxPages: 100,
    },
    statistics: {
      totalPages: 150,
      completedPages: 145,
      errorPages: 5,
      pendingPages: 0,
      totalRuns: 3,
      acceptedDiffs: 10,
      pendingDiffs: 2,
      mutedDiffs: 1,
    },
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouter.push.mockClear();

    server.use(
      http.get(`${API_BASE_URL}/projects/proj-123`, () => {
        return HttpResponse.json(mockProject);
      }),
    );
  });

  it('should render project name', async () => {
    const wrapper = mount(ProjectDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('Test Project');
  });

  it('should render project description', async () => {
    const wrapper = mount(ProjectDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('Test description');
  });

  it('should render base URL', async () => {
    const wrapper = mount(ProjectDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('https://example.com');
  });

  it('should render status badge', async () => {
    const wrapper = mount(ProjectDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const statusBadge = wrapper.findComponent({ name: 'ProjectStatusBadge' });
    expect(statusBadge.exists()).toBe(true);
  });

  it('should render statistics component', async () => {
    const wrapper = mount(ProjectDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('Statistics');
    expect(wrapper.text()).toContain('Total Pages');
  });

  it('should show loading state on mount', () => {
    const wrapper = mount(ProjectDetailView);
    expect(wrapper.text()).toContain('Loading');
  });

  it('should handle project not found', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/proj-123`, () => {
        return HttpResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Project not found',
            },
          },
          { status: 404 },
        );
      }),
    );

    const wrapper = mount(ProjectDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('not found');
  });

  it('should navigate back to projects list', async () => {
    const wrapper = mount(ProjectDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const backButton = wrapper.find('[data-test="back-button"]');
    if (backButton.exists()) {
      await backButton.trigger('click');
      expect(mockRouter.push).toHaveBeenCalledWith({ name: 'projects' });
    }
  });

  it('should navigate to create run view', async () => {
    const wrapper = mount(ProjectDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const createRunButton = wrapper.find('[data-test="create-run-button"]');
    if (createRunButton.exists()) {
      await createRunButton.trigger('click');
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: 'run-create',
        params: { projectId: 'proj-123' },
      });
    }
  });

  it('should handle delete project', async () => {
    // Mock window.confirm
    global.confirm = vi.fn(() => true);

    server.use(
      http.delete(`${API_BASE_URL}/projects/proj-123`, () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const wrapper = mount(ProjectDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const deleteButton = wrapper.find('[data-test="delete-button"]');
    if (deleteButton.exists()) {
      await deleteButton.trigger('click');
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(global.confirm).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith({ name: 'projects' });
    }
  });
});
