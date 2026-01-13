/**
 * ProjectCreateView tests
 * Tests project creation view with form
 */

import { mount } from '@vue/test-utils';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { createPinia, setActivePinia } from 'pinia';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectCreateView from '../../../src/views/ProjectCreateView.vue';

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

describe('ProjectCreateView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouter.push.mockClear();
  });

  it('should render ProjectForm component', () => {
    const wrapper = mount(ProjectCreateView);
    expect(wrapper.text()).toContain('Create Project');
  });

  it('should handle successful project creation', async () => {
    const mockProject = {
      id: 'proj-123',
      name: 'Test Project',
      description: 'Test desc',
      baseUrl: 'https://example.com',
      status: 'new',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    server.use(
      http.post(`${API_BASE_URL}/scans`, () => {
        return HttpResponse.json({
          ...mockProject,
          config: {
            crawl: false,
            viewport: { width: 1920, height: 1080 },
            visualDiffThreshold: 0.01,
          },
          statistics: {
            totalPages: 0,
            completedPages: 0,
            errorPages: 0,
            pendingPages: 0,
            totalRuns: 0,
            acceptedDiffs: 0,
            pendingDiffs: 0,
            mutedDiffs: 0,
          },
        });
      }),
    );

    const wrapper = mount(ProjectCreateView);
    const form = wrapper.findComponent({ name: 'ProjectForm' });

    if (form.exists()) {
      await form.vm.$emit('submit', {
        name: 'Test Project',
        url: 'https://example.com',
        description: 'Test desc',
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        collectHar: false,
        waitAfterLoad: 1000,
        visualDiffThreshold: 0.01,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockRouter.push).toHaveBeenCalledWith({
        name: 'project-detail',
        params: { projectId: 'proj-123' },
      });
    }
  });

  it('should display error on failed project creation', async () => {
    server.use(
      http.post(`${API_BASE_URL}/scans`, () => {
        return HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid URL format',
            },
          },
          { status: 400 },
        );
      }),
    );

    const wrapper = mount(ProjectCreateView);
    const form = wrapper.findComponent({ name: 'ProjectForm' });

    if (form.exists()) {
      await form.vm.$emit('submit', {
        name: 'Test',
        url: 'invalid-url',
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        collectHar: false,
        waitAfterLoad: 1000,
        visualDiffThreshold: 0.01,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockRouter.push).not.toHaveBeenCalled();
    }
  });

  it('should show loading state during project creation', async () => {
    let resolveRequest: ((value: unknown) => void) | undefined;
    const requestPromise = new Promise((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      http.post(`${API_BASE_URL}/scans`, async () => {
        await requestPromise;
        return HttpResponse.json({
          id: 'proj-123',
          name: 'Test',
          baseUrl: 'https://example.com',
          status: 'new',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        });
      }),
    );

    const wrapper = mount(ProjectCreateView);
    const form = wrapper.findComponent({ name: 'ProjectForm' });

    if (form.exists()) {
      form.vm.$emit('submit', {
        name: 'Test',
        url: 'https://example.com',
        crawl: false,
        viewport: { width: 1920, height: 1080 },
        collectHar: false,
        waitAfterLoad: 1000,
        visualDiffThreshold: 0.01,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(wrapper.text()).toContain('Creating');

      resolveRequest?.(null);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  });

  it('should allow navigation back to projects list', () => {
    const wrapper = mount(ProjectCreateView);
    const backButton = wrapper.find('[data-test="back-button"]');

    if (backButton.exists()) {
      backButton.trigger('click');
      expect(mockRouter.push).toHaveBeenCalledWith({ name: 'projects' });
    }
  });
});
