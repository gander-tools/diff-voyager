/**
 * ProjectStatistics tests
 * Tests statistics display component for projects
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ProjectStatistics from '../../../src/components/ProjectStatistics.vue';

describe('ProjectStatistics', () => {
  const mockStatistics = {
    totalPages: 150,
    completedPages: 145,
    errorPages: 5,
    changedPages: 20,
    unchangedPages: 125,
    totalDifferences: 13,
    criticalDifferences: 2,
    acceptedDifferences: 10,
    mutedDifferences: 1,
  };

  it('should render all statistics', () => {
    const wrapper = mount(ProjectStatistics, {
      props: { statistics: mockStatistics },
    });

    expect(wrapper.text()).toContain('150');
    expect(wrapper.text()).toContain('145');
    expect(wrapper.text()).toContain('5');
    expect(wrapper.text()).toContain('20');
  });

  it('should display page statistics', () => {
    const wrapper = mount(ProjectStatistics, {
      props: { statistics: mockStatistics },
    });

    expect(wrapper.text()).toContain('Total Pages');
    expect(wrapper.text()).toContain('Completed');
    expect(wrapper.text()).toContain('Errors');
  });

  it('should display diff statistics', () => {
    const wrapper = mount(ProjectStatistics, {
      props: { statistics: mockStatistics },
    });

    expect(wrapper.text()).toContain('Accepted');
    expect(wrapper.text()).toContain('Muted');
    expect(wrapper.text()).toContain('Total Differences');
    expect(wrapper.text()).toContain('Critical Differences');
  });

  it('should display changed and unchanged page statistics', () => {
    const wrapper = mount(ProjectStatistics, {
      props: { statistics: mockStatistics },
    });

    expect(wrapper.text()).toContain('Changed');
    expect(wrapper.text()).toContain('Unchanged');
    expect(wrapper.text()).toContain('20');
    expect(wrapper.text()).toContain('125');
  });

  it('should handle zero values', () => {
    const zeroStats = {
      totalPages: 0,
      completedPages: 0,
      errorPages: 0,
      changedPages: 0,
      unchangedPages: 0,
      totalDifferences: 0,
      criticalDifferences: 0,
      acceptedDifferences: 0,
      mutedDifferences: 0,
    };

    const wrapper = mount(ProjectStatistics, {
      props: { statistics: zeroStats },
    });

    expect(wrapper.text()).toContain('0');
  });

  it('should render in a grid layout', () => {
    const wrapper = mount(ProjectStatistics, {
      props: { statistics: mockStatistics },
    });

    const grid = wrapper.find('[data-test="statistics-grid"]');
    expect(grid.exists()).toBe(true);
  });

  it('should support compact mode', () => {
    const wrapper = mount(ProjectStatistics, {
      props: {
        statistics: mockStatistics,
        compact: true,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
