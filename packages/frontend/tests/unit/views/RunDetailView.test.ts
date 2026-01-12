/**
 * RunDetailView tests
 * Tests run detail view with pages list, polling, and retry functionality
 */

import { mount } from '@vue/test-utils';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { createPinia, setActivePinia } from 'pinia';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRunsStore } from '../../../src/stores/runs';
import RunDetailView from '../../../src/views/RunDetailView.vue';

const API_BASE_URL = 'http://localhost:3000/api/v1';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const mockRouter = {
  push: vi.fn(),
};

const mockRoute = {
  params: { runId: 'run-123' },
};

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRoute,
}));

// Mock useMessage from naive-ui
const mockMessage = {
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

vi.mock('naive-ui', async () => {
  const actual = await vi.importActual('naive-ui');
  return {
    ...actual,
    useMessage: () => mockMessage,
  };
});

const mockRun = {
  id: 'run-123',
  projectId: 'proj-123',
  isBaseline: false,
  status: 'completed',
  createdAt: '2024-01-01T10:00:00Z',
  config: {
    viewport: {
      width: 1920,
      height: 1080,
    },
    captureScreenshots: true,
    captureHar: false,
  },
  statistics: {
    totalPages: 10,
    completedPages: 8,
    errorPages: 2,
  },
};

const mockInProgressRun = {
  ...mockRun,
  id: 'run-456',
  status: 'in_progress',
  statistics: {
    totalPages: 10,
    completedPages: 5,
    errorPages: 0,
  },
};

const mockPages = [
  {
    id: 'page-1',
    url: 'https://example.com/',
    status: 'completed',
    httpStatus: 200,
  },
  {
    id: 'page-2',
    url: 'https://example.com/about',
    status: 'completed',
    httpStatus: 200,
  },
  {
    id: 'page-3',
    url: 'https://example.com/contact',
    status: 'error',
    httpStatus: 500,
  },
];

describe('RunDetailView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouter.push.mockClear();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should render run details', async () => {
    server.use(
      http.get(`${API_BASE_URL}/runs/:runId`, () => {
        return HttpResponse.json(mockRun);
      }),
      http.get(`${API_BASE_URL}/runs/:runId/pages`, () => {
        return HttpResponse.json({ pages: mockPages, pagination: { total: 3 } });
      }),
    );

    const wrapper = mount(RunDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('Run #run-123');
  });

  it('should display run statistics', async () => {
    server.use(
      http.get(`${API_BASE_URL}/runs/:runId`, () => {
        return HttpResponse.json(mockRun);
      }),
      http.get(`${API_BASE_URL}/runs/:runId/pages`, () => {
        return HttpResponse.json({ pages: mockPages, pagination: { total: 3 } });
      }),
    );

    const wrapper = mount(RunDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('10');
    expect(wrapper.text()).toContain('8');
    expect(wrapper.text()).toContain('2');
  });

  it('should display run configuration', async () => {
    server.use(
      http.get(`${API_BASE_URL}/runs/:runId`, () => {
        return HttpResponse.json(mockRun);
      }),
      http.get(`${API_BASE_URL}/runs/:runId/pages`, () => {
        return HttpResponse.json({ pages: mockPages, pagination: { total: 3 } });
      }),
    );

    const wrapper = mount(RunDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('1920 × 1080');
    expect(wrapper.text()).toContain('Enabled');
    expect(wrapper.text()).toContain('Disabled');
  });

  it('should display pages list', async () => {
    server.use(
      http.get(`${API_BASE_URL}/runs/:runId`, () => {
        return HttpResponse.json(mockRun);
      }),
      http.get(`${API_BASE_URL}/runs/:runId/pages`, () => {
        return HttpResponse.json({ pages: mockPages, pagination: { total: 3 } });
      }),
    );

    const wrapper = mount(RunDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('https://example.com/');
    expect(wrapper.text()).toContain('https://example.com/about');
    expect(wrapper.text()).toContain('https://example.com/contact');
  });

  it('should show progress bar for in-progress runs', async () => {
    server.use(
      http.get(`${API_BASE_URL}/runs/:runId`, () => {
        return HttpResponse.json(mockInProgressRun);
      }),
      http.get(`${API_BASE_URL}/runs/:runId/pages`, () => {
        return HttpResponse.json({ pages: [], pagination: { total: 0 } });
      }),
    );

    const wrapper = mount(RunDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('Progress');
    expect(wrapper.text()).toContain('50%');
  });

  it('should show retry button when errors exist', async () => {
    server.use(
      http.get(`${API_BASE_URL}/runs/:runId`, () => {
        return HttpResponse.json(mockRun);
      }),
      http.get(`${API_BASE_URL}/runs/:runId/pages`, () => {
        return HttpResponse.json({ pages: mockPages, pagination: { total: 3 } });
      }),
    );

    const wrapper = mount(RunDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const retryButton = wrapper.find('[data-test="retry-btn"]');
    expect(retryButton.exists()).toBe(true);
  });

  it('should not show retry button when no errors', async () => {
    const noErrorRun = {
      ...mockRun,
      statistics: {
        totalPages: 10,
        completedPages: 10,
        errorPages: 0,
      },
    };

    server.use(
      http.get(`${API_BASE_URL}/runs/:runId`, () => {
        return HttpResponse.json(noErrorRun);
      }),
      http.get(`${API_BASE_URL}/runs/:runId/pages`, () => {
        return HttpResponse.json({ pages: [], pagination: { total: 0 } });
      }),
    );

    const wrapper = mount(RunDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const retryButton = wrapper.find('[data-test="retry-btn"]');
    expect(retryButton.exists()).toBe(false);
  });

  it('should call retry API when retry button clicked', async () => {
    let retryCalled = false;

    server.use(
      http.get(`${API_BASE_URL}/runs/:runId`, () => {
        return HttpResponse.json(mockRun);
      }),
      http.get(`${API_BASE_URL}/runs/:runId/pages`, () => {
        return HttpResponse.json({ pages: mockPages, pagination: { total: 3 } });
      }),
      http.post(`${API_BASE_URL}/runs/:runId/retry`, () => {
        retryCalled = true;
        return HttpResponse.json({
          runId: 'run-123',
          status: 'pending',
          message: 'Retrying failed pages',
          retryCount: 2,
        });
      }),
    );

    const wrapper = mount(RunDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const retryButton = wrapper.find('[data-test="retry-btn"]');
    await retryButton.trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(retryCalled).toBe(true);
  });

  it('should navigate to runs list on back button click', async () => {
    server.use(
      http.get(`${API_BASE_URL}/runs/:runId`, () => {
        return HttpResponse.json(mockRun);
      }),
      http.get(`${API_BASE_URL}/runs/:runId/pages`, () => {
        return HttpResponse.json({ pages: [], pagination: { total: 0 } });
      }),
    );

    const wrapper = mount(RunDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const backButton = wrapper.find('[data-test="back-to-runs-btn"]');
    await backButton.trigger('click');

    expect(mockRouter.push).toHaveBeenCalledWith({
      name: 'runs',
      params: { projectId: 'proj-123' },
    });
  });

  it('should navigate to project on back button click', async () => {
    server.use(
      http.get(`${API_BASE_URL}/runs/:runId`, () => {
        return HttpResponse.json(mockRun);
      }),
      http.get(`${API_BASE_URL}/runs/:runId/pages`, () => {
        return HttpResponse.json({ pages: [], pagination: { total: 0 } });
      }),
    );

    const wrapper = mount(RunDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const backButton = wrapper.find('[data-test="back-to-project-btn"]');
    await backButton.trigger('click');

    expect(mockRouter.push).toHaveBeenCalledWith({
      name: 'project-detail',
      params: { projectId: 'proj-123' },
    });
  });

  it('should show loading state', () => {
    server.use(
      http.get(`${API_BASE_URL}/runs/:runId`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return HttpResponse.json(mockRun);
      }),
      http.get(`${API_BASE_URL}/runs/:runId/pages`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return HttpResponse.json({ pages: [], pagination: { total: 0 } });
      }),
    );

    const wrapper = mount(RunDetailView);
    expect(wrapper.text()).toContain('Loading run details');
  });

  it('should show error state on API failure', async () => {
    server.use(
      http.get(`${API_BASE_URL}/runs/:runId`, () => {
        return new HttpResponse(null, { status: 500 });
      }),
      http.get(`${API_BASE_URL}/runs/:runId/pages`, () => {
        return HttpResponse.json({ pages: [], pagination: { total: 0 } });
      }),
    );

    const wrapper = mount(RunDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('Retry');
  });

  it('should show empty state when no pages', async () => {
    server.use(
      http.get(`${API_BASE_URL}/runs/:runId`, () => {
        return HttpResponse.json(mockRun);
      }),
      http.get(`${API_BASE_URL}/runs/:runId/pages`, () => {
        return HttpResponse.json({ pages: [], pagination: { total: 0 } });
      }),
    );

    const wrapper = mount(RunDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('No pages found');
  });

  it('should display status badge', async () => {
    server.use(
      http.get(`${API_BASE_URL}/runs/:runId`, () => {
        return HttpResponse.json(mockRun);
      }),
      http.get(`${API_BASE_URL}/runs/:runId/pages`, () => {
        return HttpResponse.json({ pages: [], pagination: { total: 0 } });
      }),
    );

    const wrapper = mount(RunDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.find('[data-test="run-status-badge"]').exists()).toBe(true);
  });

  it('should start polling for in-progress runs', async () => {
    server.use(
      http.get(`${API_BASE_URL}/runs/:runId`, () => {
        return HttpResponse.json(mockInProgressRun);
      }),
      http.get(`${API_BASE_URL}/runs/:runId/pages`, () => {
        return HttpResponse.json({ pages: [], pagination: { total: 0 } });
      }),
    );

    const wrapper = mount(RunDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const store = useRunsStore();
    expect(store.isPolling).toBe(true);

    wrapper.unmount();
  });

  it('should stop polling on unmount', async () => {
    server.use(
      http.get(`${API_BASE_URL}/runs/:runId`, () => {
        return HttpResponse.json(mockInProgressRun);
      }),
      http.get(`${API_BASE_URL}/runs/:runId/pages`, () => {
        return HttpResponse.json({ pages: [], pagination: { total: 0 } });
      }),
    );

    const wrapper = mount(RunDetailView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const store = useRunsStore();
    expect(store.isPolling).toBe(true);

    wrapper.unmount();

    expect(store.isPolling).toBe(false);
  });
});
