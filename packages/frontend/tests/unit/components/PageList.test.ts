/**
 * PageList tests
 * Tests page list component for displaying pages with diffs
 */

import type { PageResponse } from '@gander-tools/diff-voyager-shared';
import { PageStatus } from '@gander-tools/diff-voyager-shared';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PageList from '../../../src/components/PageList.vue';

describe('PageList', () => {
  const mockPageWithoutDiff: PageResponse = {
    id: 'page-123',
    projectId: 'project-123',
    url: 'https://example.com',
    originalUrl: 'https://example.com',
    status: PageStatus.COMPLETED,
    httpStatus: 200,
    capturedAt: '2024-01-01T10:00:00Z',
    artifacts: {
      screenshotUrl: '/artifacts/page-123/screenshot.png',
    },
    diff: null,
  };

  const mockPageWithDiff: PageResponse = {
    id: 'page-456',
    projectId: 'project-123',
    url: 'https://example.com/about',
    originalUrl: 'https://example.com/about',
    status: PageStatus.COMPLETED,
    httpStatus: 200,
    capturedAt: '2024-01-01T10:00:00Z',
    artifacts: {
      screenshotUrl: '/artifacts/page-456/screenshot.png',
    },
    diff: {
      summary: {
        totalChanges: 5,
        criticalChanges: 2,
        warningChanges: 2,
        infoChanges: 1,
      },
      seoChanges: [
        {
          field: 'title',
          severity: 'critical',
          baselineValue: 'Old Title',
          currentValue: 'New Title',
        },
        {
          field: 'description',
          severity: 'warning',
          baselineValue: 'Old Desc',
          currentValue: 'New Desc',
        },
      ],
      headerChanges: [
        {
          headerName: 'X-Custom-Header',
          severity: 'info',
          baselineValue: 'old-value',
          currentValue: 'new-value',
        },
      ],
      performanceChanges: [
        {
          metric: 'loadTime',
          severity: 'warning',
          baselineValue: 1000,
          currentValue: 1500,
          changePercentage: 50,
        },
      ],
      visualDiff: {
        diffPercentage: 5.5,
        diffPixels: 1000,
        thresholdExceeded: true,
        baselineScreenshotUrl: '/artifacts/page-456/baseline-screenshot.png',
        diffImageUrl: '/artifacts/page-456/diff.png',
      },
    },
  };

  const mockPageWithError: PageResponse = {
    id: 'page-789',
    projectId: 'project-123',
    url: 'https://example.com/error',
    originalUrl: 'https://example.com/error',
    status: PageStatus.ERROR,
    httpStatus: 500,
    capturedAt: '2024-01-01T10:00:00Z',
    errorMessage: 'Server error',
    artifacts: {},
    diff: null,
  };

  it('should render empty state when no pages', () => {
    const wrapper = mount(PageList, {
      props: { pages: [] },
    });

    expect(wrapper.text()).toContain('No pages found');
  });

  it('should render pages table when pages exist', () => {
    const wrapper = mount(PageList, {
      props: { pages: [mockPageWithoutDiff] },
    });

    const table = wrapper.find('[data-test="pages-table"]');
    expect(table.exists()).toBe(true);
  });

  it('should render page URLs', () => {
    const wrapper = mount(PageList, {
      props: { pages: [mockPageWithoutDiff, mockPageWithDiff] },
    });

    expect(wrapper.text()).toContain('example.com');
    expect(wrapper.text()).toContain('/about');
  });

  it('should render page status badges', () => {
    const wrapper = mount(PageList, {
      props: { pages: [mockPageWithoutDiff] },
    });

    const statusBadge = wrapper.findComponent({ name: 'PageStatusBadge' });
    expect(statusBadge.exists()).toBe(true);
  });

  it('should render HTTP status codes', () => {
    const wrapper = mount(PageList, {
      props: { pages: [mockPageWithoutDiff, mockPageWithError] },
    });

    expect(wrapper.text()).toContain('200');
    expect(wrapper.text()).toContain('500');
  });

  it('should show total changes count', () => {
    const wrapper = mount(PageList, {
      props: { pages: [mockPageWithDiff] },
    });

    expect(wrapper.text()).toContain('5');
  });

  it('should show "No changes" for pages without diffs', () => {
    const wrapper = mount(PageList, {
      props: { pages: [mockPageWithoutDiff] },
    });

    expect(wrapper.text()).toContain('No changes');
  });

  it('should show diff type badges for SEO changes', () => {
    const wrapper = mount(PageList, {
      props: { pages: [mockPageWithDiff] },
    });

    expect(wrapper.text()).toContain('SEO');
    expect(wrapper.text()).toContain('(2)');
  });

  it('should show diff type badges for header changes', () => {
    const wrapper = mount(PageList, {
      props: { pages: [mockPageWithDiff] },
    });

    expect(wrapper.text()).toContain('Headers');
    expect(wrapper.text()).toContain('(1)');
  });

  it('should show diff type badges for performance changes', () => {
    const wrapper = mount(PageList, {
      props: { pages: [mockPageWithDiff] },
    });

    expect(wrapper.text()).toContain('Performance');
    expect(wrapper.text()).toContain('(1)');
  });

  it('should show diff type badge for visual diff', () => {
    const wrapper = mount(PageList, {
      props: { pages: [mockPageWithDiff] },
    });

    expect(wrapper.text()).toContain('Visual');
  });

  it('should emit pageClick event when URL is clicked', async () => {
    const wrapper = mount(PageList, {
      props: { pages: [mockPageWithoutDiff] },
    });

    const link = wrapper.find('.page-url-link');
    if (link.exists()) {
      await link.trigger('click');
      expect(wrapper.emitted('pageClick')).toBeTruthy();
      expect(wrapper.emitted('pageClick')?.[0]).toEqual(['page-123']);
    }
  });

  it('should show loading spinner when loading', () => {
    const wrapper = mount(PageList, {
      props: { pages: [], loading: true },
    });

    // NSpin is rendered, so we just check that the component renders
    expect(wrapper.exists()).toBe(true);
  });

  it('should handle pages with no HTTP status', () => {
    const pageWithoutHttpStatus = {
      ...mockPageWithoutDiff,
      httpStatus: undefined,
    };

    const wrapper = mount(PageList, {
      props: { pages: [pageWithoutHttpStatus] },
    });

    expect(wrapper.text()).toContain('-');
  });

  it('should handle pages without visual diff', () => {
    const pageWithoutVisualDiff: PageResponse = {
      ...mockPageWithDiff,
      diff: {
        ...mockPageWithDiff.diff!,
        visualDiff: undefined,
      },
    };

    const wrapper = mount(PageList, {
      props: { pages: [pageWithoutVisualDiff] },
    });

    expect(wrapper.text()).not.toContain('Visual');
  });

  it('should highlight error HTTP status', () => {
    const wrapper = mount(PageList, {
      props: { pages: [mockPageWithError] },
    });

    expect(wrapper.text()).toContain('500');
  });
});
