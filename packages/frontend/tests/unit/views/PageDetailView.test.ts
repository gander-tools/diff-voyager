/**
 * PageDetailView tests
 * Tests page detail view with tabs for SEO, visual diff, performance, and headers
 */

import { mount } from '@vue/test-utils';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { createPinia, setActivePinia } from 'pinia';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import PageDetailView from '../../../src/views/PageDetailView.vue';

const API_BASE_URL = 'http://localhost:3000/api/v1';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
};

const mockRoute = {
  params: { pageId: 'page-123' },
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

const mockPageDetails = {
  id: 'page-123',
  projectId: 'proj-123',
  url: 'https://example.com/test-page',
  originalUrl: 'https://example.com/test-page',
  status: 'completed',
  httpStatus: 200,
  capturedAt: '2024-01-01T10:00:00Z',
  seoData: {
    title: 'Test Page',
    metaDescription: 'A test page description',
    canonical: 'https://example.com/test-page',
    robots: 'index, follow',
    h1: ['Main Heading'],
    h2: ['Subheading 1', 'Subheading 2'],
    lang: 'en',
  },
  httpHeaders: {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-cache',
  },
  performanceData: {
    loadTimeMs: 1234,
    requestCount: 15,
    totalSizeBytes: 524288,
  },
  artifacts: {
    screenshotUrl: 'http://localhost:3000/api/v1/artifacts/page-123/screenshot',
    baselineScreenshotUrl: 'http://localhost:3000/api/v1/artifacts/page-123/baseline-screenshot',
    diffImageUrl: 'http://localhost:3000/api/v1/artifacts/page-123/diff',
    harUrl: 'http://localhost:3000/api/v1/artifacts/page-123/har',
    htmlUrl: 'http://localhost:3000/api/v1/artifacts/page-123/html',
  },
};

const mockPageDiff = {
  summary: {
    totalChanges: 3,
    criticalChanges: 1,
    warningChanges: 1,
    infoChanges: 1,
  },
  seoChanges: [
    {
      field: 'title',
      severity: 'critical',
      baselineValue: 'Old Title',
      currentValue: 'Test Page',
    },
  ],
  headerChanges: [
    {
      headerName: 'cache-control',
      severity: 'warning',
      baselineValue: 'max-age=3600',
      currentValue: 'no-cache',
    },
  ],
  performanceChanges: [
    {
      metric: 'loadTimeMs',
      severity: 'info',
      baselineValue: 1000,
      currentValue: 1234,
      percentageChange: 23.4,
    },
  ],
  visualDiff: {
    diffPercentage: 0.05,
    diffPixels: 5000,
    thresholdExceeded: true,
  },
};

describe('PageDetailView', () => {
  let i18n: ReturnType<typeof createI18n>;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouter.push.mockClear();
    mockRouter.back.mockClear();
    mockMessage.error.mockClear();
    mockMessage.success.mockClear();
    mockMessage.info.mockClear();

    i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {
          common: {
            error: 'Error',
            loading: 'Loading',
            retry: 'Retry',
          },
        },
      },
    });
  });

  it('should render page details', async () => {
    server.use(
      http.get(`${API_BASE_URL}/pages/:pageId`, () => {
        return HttpResponse.json(mockPageDetails);
      }),
      http.get(`${API_BASE_URL}/pages/:pageId/diff`, () => {
        return HttpResponse.json(mockPageDiff);
      }),
    );

    const wrapper = mount(PageDetailView, {
      global: {
        plugins: [i18n],
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('https://example.com/test-page');
    expect(wrapper.text()).toContain('200');
  });

  it('should display change summary', async () => {
    server.use(
      http.get(`${API_BASE_URL}/pages/:pageId`, () => {
        return HttpResponse.json(mockPageDetails);
      }),
      http.get(`${API_BASE_URL}/pages/:pageId/diff`, () => {
        return HttpResponse.json(mockPageDiff);
      }),
    );

    const wrapper = mount(PageDetailView, {
      global: {
        plugins: [i18n],
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('1 critical');
    expect(wrapper.text()).toContain('1 warnings');
    expect(wrapper.text()).toContain('1 info');
  });

  it('should display diff actions when changes exist', async () => {
    server.use(
      http.get(`${API_BASE_URL}/pages/:pageId`, () => {
        return HttpResponse.json(mockPageDetails);
      }),
      http.get(`${API_BASE_URL}/pages/:pageId/diff`, () => {
        return HttpResponse.json(mockPageDiff);
      }),
    );

    const wrapper = mount(PageDetailView, {
      global: {
        plugins: [i18n],
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('Accept Changes');
    expect(wrapper.text()).toContain('Mute');
    expect(wrapper.text()).toContain('Create Rule');
  });

  it('should not display diff actions when no changes', async () => {
    const noDiffResponse = {
      ...mockPageDiff,
      summary: {
        totalChanges: 0,
        criticalChanges: 0,
        warningChanges: 0,
        infoChanges: 0,
      },
    };

    server.use(
      http.get(`${API_BASE_URL}/pages/:pageId`, () => {
        return HttpResponse.json(mockPageDetails);
      }),
      http.get(`${API_BASE_URL}/pages/:pageId/diff`, () => {
        return HttpResponse.json(noDiffResponse);
      }),
    );

    const wrapper = mount(PageDetailView, {
      global: {
        plugins: [i18n],
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).not.toContain('Accept Changes');
  });

  it('should render all four tabs', async () => {
    server.use(
      http.get(`${API_BASE_URL}/pages/:pageId`, () => {
        return HttpResponse.json(mockPageDetails);
      }),
      http.get(`${API_BASE_URL}/pages/:pageId/diff`, () => {
        return HttpResponse.json(mockPageDiff);
      }),
    );

    const wrapper = mount(PageDetailView, {
      global: {
        plugins: [i18n],
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('SEO & Content');
    expect(wrapper.text()).toContain('Visual Diff');
    expect(wrapper.text()).toContain('Performance');
    expect(wrapper.text()).toContain('Headers');
  });

  it('should handle navigation back', async () => {
    server.use(
      http.get(`${API_BASE_URL}/pages/:pageId`, () => {
        return HttpResponse.json(mockPageDetails);
      }),
      http.get(`${API_BASE_URL}/pages/:pageId/diff`, () => {
        return HttpResponse.json(mockPageDiff);
      }),
    );

    const wrapper = mount(PageDetailView, {
      global: {
        plugins: [i18n],
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const backButton = wrapper.find('button');
    await backButton.trigger('click');

    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('should handle error when loading page fails', async () => {
    server.use(
      http.get(`${API_BASE_URL}/pages/:pageId`, () => {
        return HttpResponse.json({ error: { message: 'Page not found' } }, { status: 404 });
      }),
      http.get(`${API_BASE_URL}/pages/:pageId/diff`, () => {
        return HttpResponse.json(mockPageDiff);
      }),
    );

    const wrapper = mount(PageDetailView, {
      global: {
        plugins: [i18n],
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('Failed to get page');
  });

  it('should handle missing diff gracefully', async () => {
    server.use(
      http.get(`${API_BASE_URL}/pages/:pageId`, () => {
        return HttpResponse.json(mockPageDetails);
      }),
      http.get(`${API_BASE_URL}/pages/:pageId/diff`, () => {
        return HttpResponse.json({ error: { message: 'Diff not found' } }, { status: 404 });
      }),
    );

    const wrapper = mount(PageDetailView, {
      global: {
        plugins: [i18n],
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should still show page details even without diff
    expect(wrapper.text()).toContain('https://example.com/test-page');
  });

  it('should eventually load and display page details', async () => {
    server.use(
      http.get(`${API_BASE_URL}/pages/:pageId`, () => {
        return HttpResponse.json(mockPageDetails);
      }),
      http.get(`${API_BASE_URL}/pages/:pageId/diff`, () => {
        return HttpResponse.json(mockPageDiff);
      }),
    );

    const wrapper = mount(PageDetailView, {
      global: {
        plugins: [i18n],
      },
    });

    // Wait for loading to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should show page details after loading
    expect(wrapper.text()).toContain('https://example.com/test-page');
  });
});
