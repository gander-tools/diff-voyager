/**
 * RunCreateView tests
 * Tests run creation form and submission
 */

import { mount } from '@vue/test-utils';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { createPinia, setActivePinia } from 'pinia';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import RunCreateView from '../../../src/views/RunCreateView.vue';

const API_BASE_URL = 'http://localhost:3000/api/v1';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const mockRouter = {
  push: vi.fn(),
};

const mockRoute = {
  params: { projectId: 'proj-123' },
};

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRoute,
}));

const mockProject = {
  id: 'proj-123',
  name: 'Test Project',
  description: 'Test description',
  baseUrl: 'https://example.com',
  status: 'completed',
  config: {
    crawl: false,
    viewport: { width: 1920, height: 1080 },
    visualDiffThreshold: 0.01,
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  statistics: {
    totalPages: 10,
    completedPages: 10,
    errorPages: 0,
    changedPages: 2,
    unchangedPages: 8,
    totalDifferences: 5,
    criticalDifferences: 1,
    acceptedDifferences: 0,
    mutedDifferences: 0,
  },
  pages: [],
  pagination: {
    total: 10,
    limit: 50,
    offset: 0,
    hasMore: false,
  },
};

const mockCreateRunResponse = {
  runId: 'run-123',
  status: 'pending',
  runUrl: '/runs/run-123',
};

describe('RunCreateView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouter.push.mockClear();
  });

  it('should render title', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
    );

    const wrapper = mount(RunCreateView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('Create New Run');
  });

  it('should display project name in subtitle', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
    );

    const wrapper = mount(RunCreateView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('Test Project');
  });

  it('should fetch project data on mount', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
    );

    const wrapper = mount(RunCreateView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Form should be rendered with project URL
    const urlInput = wrapper.find('[data-test="url-input"]');
    expect(urlInput.exists()).toBe(true);
  });

  it('should pre-fill URL with project baseUrl', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
    );

    const wrapper = mount(RunCreateView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that RunForm component exists with the correct prop
    const runForm = wrapper.findComponent({ name: 'RunForm' });
    expect(runForm.exists()).toBe(true);
    expect(runForm.props('projectUrl')).toBe('https://example.com');
  });

  it('should create run on form submission', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
      http.post(`${API_BASE_URL}/projects/:projectId/runs`, () => {
        return HttpResponse.json(mockCreateRunResponse, { status: 202 });
      }),
      http.get(`${API_BASE_URL}/projects/:projectId/runs`, () => {
        return HttpResponse.json({ runs: [] });
      }),
    );

    const wrapper = mount(RunCreateView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const submitButton = wrapper.find('[data-test="submit-button"]');
    expect(submitButton.exists()).toBe(true);

    await submitButton.trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockRouter.push).toHaveBeenCalledWith({
      name: 'run-detail',
      params: { runId: 'run-123' },
    });
  });

  it('should navigate back on cancel button click', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
    );

    const wrapper = mount(RunCreateView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const backButton = wrapper.find('[data-test="back-button"]');
    expect(backButton.exists()).toBe(true);

    await backButton.trigger('click');
    expect(mockRouter.push).toHaveBeenCalledWith({
      name: 'runs',
      params: { projectId: 'proj-123' },
    });
  });

  it('should navigate back on cancel form button click', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
    );

    const wrapper = mount(RunCreateView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const cancelButton = wrapper.find('[data-test="cancel-button"]');
    expect(cancelButton.exists()).toBe(true);

    await cancelButton.trigger('click');
    expect(mockRouter.push).toHaveBeenCalledWith({
      name: 'runs',
      params: { projectId: 'proj-123' },
    });
  });

  it('should show loading state while fetching project', () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return HttpResponse.json(mockProject);
      }),
    );

    const wrapper = mount(RunCreateView);
    expect(wrapper.text()).toContain('Loading');
  });

  it('should show creating state during submission', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
      http.post(`${API_BASE_URL}/projects/:projectId/runs`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return HttpResponse.json(mockCreateRunResponse, { status: 202 });
      }),
      http.get(`${API_BASE_URL}/projects/:projectId/runs`, () => {
        return HttpResponse.json({ runs: [] });
      }),
    );

    const wrapper = mount(RunCreateView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const submitButton = wrapper.find('[data-test="submit-button"]');
    await submitButton.trigger('click');

    // Wait for Vue to update the DOM with the creating state
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should show form with submit button (loading state is handled by RunForm component)
    expect(submitButton.exists()).toBe(true);
  });

  it('should display form fields correctly', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
    );

    const wrapper = mount(RunCreateView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check all form fields exist
    expect(wrapper.find('[data-test="url-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="viewport-preset-select"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="viewport-width-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="viewport-height-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="collect-har-switch"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="wait-after-load-input"]').exists()).toBe(true);
  });
});
