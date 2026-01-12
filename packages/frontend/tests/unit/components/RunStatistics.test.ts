/**
 * RunStatistics tests
 * Tests statistics display component for runs
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RunStatistics from '../../../src/components/RunStatistics.vue';

describe('RunStatistics', () => {
  const mockStatistics = {
    totalPages: 150,
    completedPages: 145,
    errorPages: 5,
    unchangedPages: 120,
    changedPages: 25,
    criticalDifferences: 8,
    acceptedDifferences: 12,
    mutedDifferences: 5,
  };

  it('should render all statistics', () => {
    const wrapper = mount(RunStatistics, {
      props: { statistics: mockStatistics },
    });

    expect(wrapper.text()).toContain('150');
    expect(wrapper.text()).toContain('145');
    expect(wrapper.text()).toContain('5');
    expect(wrapper.text()).toContain('25');
  });

  it('should display page statistics', () => {
    const wrapper = mount(RunStatistics, {
      props: { statistics: mockStatistics },
    });

    expect(wrapper.text()).toContain('Total Pages');
    expect(wrapper.text()).toContain('Completed');
    expect(wrapper.text()).toContain('Errors');
  });

  it('should display diff statistics', () => {
    const wrapper = mount(RunStatistics, {
      props: { statistics: mockStatistics },
    });

    expect(wrapper.text()).toContain('Critical');
    expect(wrapper.text()).toContain('Accepted');
    expect(wrapper.text()).toContain('Muted');
  });

  it('should display changed and unchanged page statistics', () => {
    const wrapper = mount(RunStatistics, {
      props: { statistics: mockStatistics },
    });

    expect(wrapper.text()).toContain('Changed');
    expect(wrapper.text()).toContain('Unchanged');
    expect(wrapper.text()).toContain('25');
    expect(wrapper.text()).toContain('120');
  });

  it('should handle zero values', () => {
    const zeroStats = {
      totalPages: 0,
      completedPages: 0,
      errorPages: 0,
      unchangedPages: 0,
      changedPages: 0,
      criticalDifferences: 0,
      acceptedDifferences: 0,
      mutedDifferences: 0,
    };

    const wrapper = mount(RunStatistics, {
      props: { statistics: zeroStats },
    });

    expect(wrapper.text()).toContain('0');
  });

  it('should render in a grid layout', () => {
    const wrapper = mount(RunStatistics, {
      props: { statistics: mockStatistics },
    });

    const grid = wrapper.find('[data-test="statistics-grid"]');
    expect(grid.exists()).toBe(true);
  });

  it('should support compact mode', () => {
    const wrapper = mount(RunStatistics, {
      props: {
        statistics: mockStatistics,
        compact: true,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
