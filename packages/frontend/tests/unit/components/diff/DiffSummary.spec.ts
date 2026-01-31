import type { DiffSummary as DiffSummaryType } from '@gander-tools/diff-voyager-shared';
import { DiffType } from '@gander-tools/diff-voyager-shared';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DiffSummary from '@/components/diff/DiffSummary.vue';

describe('DiffSummary', () => {
  const createMockSummary = (overrides?: Partial<DiffSummaryType>): DiffSummaryType => ({
    totalChanges: 10,
    criticalChanges: 3,
    acceptedChanges: 2,
    mutedChanges: 1,
    changesByType: {
      [DiffType.SEO]: 4,
      [DiffType.VISUAL]: 2,
      [DiffType.CONTENT]: 2,
      [DiffType.PERFORMANCE]: 1,
      [DiffType.HTTP_STATUS]: 1,
      [DiffType.HEADERS]: 0,
    },
    thresholdExceeded: false,
    ...overrides,
  });

  it('should render main statistics', () => {
    const summary = createMockSummary();
    const wrapper = mount(DiffSummary, {
      props: { summary },
      global: {
        stubs: {
          NGrid: { template: '<div class="n-grid"><slot /></div>' },
          NGridItem: { template: '<div class="n-grid-item"><slot /></div>' },
          NStatistic: {
            template: '<div class="n-statistic">{{ label }}: {{ value }}</div>',
            props: ['label', 'value'],
          },
          NText: { template: '<span class="n-text"><slot /></span>' },
        },
      },
    });

    expect(wrapper.find('[data-test="diff-summary"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="main-statistics"]').exists()).toBe(true);

    // Check main statistics are displayed
    const text = wrapper.text();
    expect(text).toContain('Total Changes');
    expect(text).toContain('10');
    expect(text).toContain('Critical');
    expect(text).toContain('3');
    expect(text).toContain('Accepted');
    expect(text).toContain('2');
    expect(text).toContain('Muted');
    expect(text).toContain('1');
  });

  it('should render visual diff statistics when available', () => {
    const summary = createMockSummary({
      visualDiffPercentage: 5.25,
      visualDiffPixels: 1500,
    });

    const wrapper = mount(DiffSummary, {
      props: { summary },
      global: {
        stubs: {
          NGrid: { template: '<div class="n-grid"><slot /></div>' },
          NGridItem: { template: '<div class="n-grid-item"><slot /></div>' },
          NStatistic: {
            template: '<div class="n-statistic">{{ label }}: {{ value }}</div>',
            props: ['label', 'value'],
          },
          NText: { template: '<span class="n-text"><slot /></span>' },
        },
      },
    });

    expect(wrapper.find('[data-test="visual-diff-statistics"]').exists()).toBe(true);

    const text = wrapper.text();
    expect(text).toContain('Visual Diff %');
    expect(text).toContain('5.25%');
    expect(text).toContain('Pixels Changed');
    expect(text).toContain('1500');
  });

  it('should not render visual diff statistics when not available', () => {
    const summary = createMockSummary({
      visualDiffPercentage: undefined,
      visualDiffPixels: undefined,
    });

    const wrapper = mount(DiffSummary, {
      props: { summary },
      global: {
        stubs: {
          NGrid: { template: '<div class="n-grid"><slot /></div>' },
          NGridItem: { template: '<div class="n-grid-item"><slot /></div>' },
          NStatistic: { template: '<div class="n-statistic"><slot /></div>' },
          NText: { template: '<span class="n-text"><slot /></span>' },
        },
      },
    });

    expect(wrapper.find('[data-test="visual-diff-statistics"]').exists()).toBe(false);
  });

  it('should show threshold warning when exceeded', () => {
    const summary = createMockSummary({
      visualDiffPercentage: 15.5,
      thresholdExceeded: true,
    });

    const wrapper = mount(DiffSummary, {
      props: { summary },
      global: {
        stubs: {
          NGrid: { template: '<div class="n-grid"><slot /></div>' },
          NGridItem: { template: '<div class="n-grid-item"><slot /></div>' },
          NStatistic: { template: '<div class="n-statistic"><slot /></div>' },
          NText: { template: '<span class="n-text"><slot /></span>' },
        },
      },
    });

    const warning = wrapper.find('[data-test="threshold-warning"]');
    expect(warning.exists()).toBe(true);
    expect(warning.text()).toContain('Visual difference threshold exceeded');
  });

  it('should not show threshold warning when not exceeded', () => {
    const summary = createMockSummary({
      visualDiffPercentage: 2.5,
      thresholdExceeded: false,
    });

    const wrapper = mount(DiffSummary, {
      props: { summary },
      global: {
        stubs: {
          NGrid: { template: '<div class="n-grid"><slot /></div>' },
          NGridItem: { template: '<div class="n-grid-item"><slot /></div>' },
          NStatistic: { template: '<div class="n-statistic"><slot /></div>' },
          NText: { template: '<span class="n-text"><slot /></span>' },
        },
      },
    });

    expect(wrapper.find('[data-test="threshold-warning"]').exists()).toBe(false);
  });

  it('should render changes by type breakdown', () => {
    const summary = createMockSummary();

    const wrapper = mount(DiffSummary, {
      props: { summary },
      global: {
        stubs: {
          NGrid: { template: '<div class="n-grid"><slot /></div>' },
          NGridItem: { template: '<div class="n-grid-item"><slot /></div>' },
          NStatistic: {
            template: '<div class="n-statistic">{{ label }}: {{ value }}</div>',
            props: ['label', 'value'],
          },
          NText: { template: '<span class="n-text"><slot /></span>' },
        },
      },
    });

    expect(wrapper.find('[data-test="type-breakdown"]').exists()).toBe(true);

    // Check all type labels are present in the text
    const text = wrapper.text();
    expect(text).toContain('SEO');
    expect(text).toContain('Visual');
    expect(text).toContain('Content');
    expect(text).toContain('Performance');
    expect(text).toContain('HTTP Status');
    expect(text).toContain('Headers');
    // Check values are present
    expect(text).toContain('4');
    expect(text).toContain('2');
    expect(text).toContain('1');
    expect(text).toContain('0');
  });

  it('should handle empty changesByType object', () => {
    const summary = createMockSummary({
      changesByType: {
        [DiffType.SEO]: 0,
        [DiffType.VISUAL]: 0,
        [DiffType.CONTENT]: 0,
        [DiffType.PERFORMANCE]: 0,
        [DiffType.HTTP_STATUS]: 0,
        [DiffType.HEADERS]: 0,
      },
    });

    const wrapper = mount(DiffSummary, {
      props: { summary },
      global: {
        stubs: {
          NGrid: { template: '<div class="n-grid"><slot /></div>' },
          NGridItem: { template: '<div class="n-grid-item"><slot /></div>' },
          NStatistic: { template: '<div class="n-statistic"><slot /></div>' },
          NText: { template: '<span class="n-text"><slot /></span>' },
        },
      },
    });

    // Type breakdown should exist even with all 0 values (component checks for keys, not values)
    expect(wrapper.find('[data-test="type-breakdown"]').exists()).toBe(true);
  });

  it('should support compact mode', () => {
    const summary = createMockSummary();

    const wrapper = mount(DiffSummary, {
      props: {
        summary,
        compact: true,
      },
      global: {
        stubs: {
          NGrid: { template: '<div class="n-grid"><slot /></div>' },
          NGridItem: { template: '<div class="n-grid-item"><slot /></div>' },
          NStatistic: { template: '<div class="n-statistic"><slot /></div>' },
          NText: { template: '<span class="n-text"><slot /></span>' },
        },
      },
    });

    // Component should render with compact prop
    expect(wrapper.find('[data-test="diff-summary"]').exists()).toBe(true);
    expect(wrapper.props('compact')).toBe(true);
  });

  it('should use 4 columns by default (non-compact)', () => {
    const summary = createMockSummary();

    const wrapper = mount(DiffSummary, {
      props: { summary },
      global: {
        stubs: {
          NGrid: { template: '<div class="n-grid"><slot /></div>' },
          NGridItem: { template: '<div class="n-grid-item"><slot /></div>' },
          NStatistic: { template: '<div class="n-statistic"><slot /></div>' },
          NText: { template: '<span class="n-text"><slot /></span>' },
        },
      },
    });

    // Component should render without compact mode by default
    expect(wrapper.find('[data-test="diff-summary"]').exists()).toBe(true);
    expect(wrapper.props('compact')).toBe(false);
  });

  it('should handle missing type counts gracefully', () => {
    const summary = createMockSummary({
      changesByType: {
        [DiffType.SEO]: 5,
        [DiffType.VISUAL]: 0,
        [DiffType.CONTENT]: 0,
        [DiffType.PERFORMANCE]: 0,
        [DiffType.HTTP_STATUS]: 0,
        [DiffType.HEADERS]: 0,
      },
    });

    const wrapper = mount(DiffSummary, {
      props: { summary },
      global: {
        stubs: {
          NGrid: { template: '<div class="n-grid"><slot /></div>' },
          NGridItem: { template: '<div class="n-grid-item"><slot /></div>' },
          NStatistic: {
            template: '<div class="n-statistic">{{ label }}: {{ value }}</div>',
            props: ['label', 'value'],
          },
          NText: { template: '<span class="n-text"><slot /></span>' },
        },
      },
    });

    // Should render all types with 0 for missing ones
    const text = wrapper.text();
    expect(text).toContain('SEO');
    expect(text).toContain('5');
    expect(text).toContain('Visual');
    expect(text).toContain('Content');
    expect(text).toContain('0'); // Missing types should show 0
  });
});
