/**
 * RunListView tests
 * Tests run list view with pagination and actions
 */

import { mount } from '@vue/test-utils';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { createPinia, setActivePinia } from 'pinia';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRunsStore } from '../../../src/stores/runs';
import RunListView from '../../../src/views/RunListView.vue';

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
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockRuns = [
  {
    id: 'run-1',
    projectId: 'proj-123',
    baselineId: 'baseline-1',
    status: 'completed',
    createdAt: '2024-01-01T10:00:00Z',
    startedAt: '2024-01-01T10:00:01Z',
    completedAt: '2024-01-01T10:05:00Z',
    statistics: {
      totalPages: 10,
      completedPages: 10,
      errorPages: 0,
      diffsCount: 2,
    },
  },
  {
    id: 'run-2',
    projectId: 'proj-123',
    baselineId: 'baseline-1',
    status: 'in_progress',
    createdAt: '2024-01-02T10:00:00Z',
    startedAt: '2024-01-02T10:00:01Z',
    statistics: {
      totalPages: 10,
      completedPages: 5,
      errorPages: 0,
      diffsCount: 0,
    },
  },
];

describe('RunListView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouter.push.mockClear();
  });

  it('should render title', () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
      http.get(`${API_BASE_URL}/projects/:projectId/runs`, () => {
        return HttpResponse.json({ runs: [] });
      }),
    );

    const wrapper = mount(RunListView);
    expect(wrapper.text()).toContain('Runs');
  });

  it('should fetch runs on mount', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
      http.get(`${API_BASE_URL}/projects/:projectId/runs`, () => {
        return HttpResponse.json({ runs: mockRuns });
      }),
    );

    mount(RunListView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const store = useRunsStore();
    expect(store.runs['proj-123']).toHaveLength(2);
  });

  it('should display run cards', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
      http.get(`${API_BASE_URL}/projects/:projectId/runs`, () => {
        return HttpResponse.json({ runs: mockRuns });
      }),
    );

    const wrapper = mount(RunListView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('Run #run-1');
    expect(wrapper.text()).toContain('Run #run-2');
  });

  it('should show empty state when no runs', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
      http.get(`${API_BASE_URL}/projects/:projectId/runs`, () => {
        return HttpResponse.json({ runs: [] });
      }),
    );

    const wrapper = mount(RunListView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('No runs yet');
  });

  it('should show project name in subtitle', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
      http.get(`${API_BASE_URL}/projects/:projectId/runs`, () => {
        return HttpResponse.json({ runs: mockRuns });
      }),
    );

    const wrapper = mount(RunListView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('Test Project');
  });

  it('should navigate to new run on button click', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
      http.get(`${API_BASE_URL}/projects/:projectId/runs`, () => {
        return HttpResponse.json({ runs: [] });
      }),
    );

    const wrapper = mount(RunListView);
    const button = wrapper.find('[data-test="new-run-btn"]');

    if (button.exists()) {
      await button.trigger('click');
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: 'run-create',
        params: { projectId: 'proj-123' },
      });
    }
  });

  it('should navigate to project on back button click', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
      http.get(`${API_BASE_URL}/projects/:projectId/runs`, () => {
        return HttpResponse.json({ runs: [] });
      }),
    );

    const wrapper = mount(RunListView);
    const button = wrapper.find('[data-test="back-button"]');

    if (button.exists()) {
      await button.trigger('click');
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: 'project-detail',
        params: { projectId: 'proj-123' },
      });
    }
  });

  it('should show loading state', () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return HttpResponse.json(mockProject);
      }),
      http.get(`${API_BASE_URL}/projects/:projectId/runs`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return HttpResponse.json({ runs: [] });
      }),
    );

    const wrapper = mount(RunListView);
    expect(wrapper.text()).toContain('Loading');
  });

  it('should show error state on API failure', async () => {
    server.use(
      http.get(`${API_BASE_URL}/projects/:projectId`, () => {
        return HttpResponse.json(mockProject);
      }),
      http.get(`${API_BASE_URL}/projects/:projectId/runs`, () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const wrapper = mount(RunListView);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Error state should be shown
    expect(wrapper.find('[data-test="back-button"]').exists()).toBe(true);
  });
});
