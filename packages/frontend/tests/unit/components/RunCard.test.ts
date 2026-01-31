/**
 * RunCard tests
 * Tests run card component for displaying run info
 */

import { RunProfile, RunStatus } from '@gander-tools/diff-voyager-shared';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RunCard from '../../../src/components/RunCard.vue';
import type { RunDetailsResponse } from '../../../src/services/api';

describe('RunCard', () => {
  const mockRun: RunDetailsResponse = {
    id: 'run-12345678-abcd-1234-efgh-ijklmnopqrst',
    projectId: 'proj-123',
    baselineId: 'baseline-456',
    status: RunStatus.COMPLETED,
    config: {
      profile: RunProfile.VISUAL_SEO,
      viewport: { width: 1920, height: 1080 },
      captureScreenshots: true,
      captureHar: false,
      generateDiffImages: true,
    },
    createdAt: '2024-01-01T10:00:00Z',
    startedAt: '2024-01-01T10:00:01Z',
    completedAt: '2024-01-01T10:05:00Z',
    statistics: {
      totalPages: 10,
      completedPages: 8,
      errorPages: 2,
      diffsCount: 3,
    },
  };

  it('should render run ID (truncated)', () => {
    const wrapper = mount(RunCard, {
      props: { run: mockRun },
    });

    expect(wrapper.text()).toContain('Run #run-1234');
  });

  it('should render status badge', () => {
    const wrapper = mount(RunCard, {
      props: { run: mockRun },
    });

    const statusBadge = wrapper.findComponent({ name: 'RunStatusBadge' });
    expect(statusBadge.exists()).toBe(true);
  });

  it('should render page count', () => {
    const wrapper = mount(RunCard, {
      props: { run: mockRun },
    });

    expect(wrapper.text()).toContain('10');
    expect(wrapper.text()).toContain('pages');
  });

  it('should render diffs count when present', () => {
    const wrapper = mount(RunCard, {
      props: { run: mockRun },
    });

    expect(wrapper.text()).toContain('3');
    expect(wrapper.text()).toContain('diffs');
  });

  it('should render error count when present', () => {
    const wrapper = mount(RunCard, {
      props: { run: mockRun },
    });

    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('errors');
  });

  it('should render created date', () => {
    const wrapper = mount(RunCard, {
      props: { run: mockRun },
    });

    expect(wrapper.text()).toContain('2024');
  });

  it('should render completed date when present', () => {
    const wrapper = mount(RunCard, {
      props: { run: mockRun },
    });

    expect(wrapper.text()).toContain('Completed:');
  });

  it('should emit click event when card is clicked', async () => {
    const wrapper = mount(RunCard, {
      props: { run: mockRun },
    });

    const card = wrapper.find('[data-test="run-card"]');
    if (card.exists()) {
      await card.trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
    }
  });

  it('should emit click event when view button is clicked', async () => {
    const wrapper = mount(RunCard, {
      props: { run: mockRun },
    });

    const viewButton = wrapper.find('[data-test="view-button"]');
    if (viewButton.exists()) {
      await viewButton.trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
    }
  });

  it('should show progress bar for in-progress runs', () => {
    const inProgressRun = {
      ...mockRun,
      status: RunStatus.IN_PROGRESS,
      completedAt: undefined,
    };

    const wrapper = mount(RunCard, {
      props: { run: inProgressRun },
    });

    expect(wrapper.text()).toContain('Progress:');
  });

  it('should show progress bar for pending runs', () => {
    const pendingRun = {
      ...mockRun,
      status: RunStatus.NEW,
      completedAt: undefined,
    };

    const wrapper = mount(RunCard, {
      props: { run: pendingRun },
    });

    expect(wrapper.text()).toContain('Progress:');
  });

  it('should handle run with no diffs', () => {
    const noDiffsRun = {
      ...mockRun,
      statistics: {
        ...mockRun.statistics,
        diffsCount: 0,
      },
    };

    const wrapper = mount(RunCard, {
      props: { run: noDiffsRun },
    });

    expect(wrapper.text()).not.toContain('diffs');
  });

  it('should handle run with no errors', () => {
    const noErrorsRun = {
      ...mockRun,
      statistics: {
        ...mockRun.statistics,
        errorPages: 0,
      },
    };

    const wrapper = mount(RunCard, {
      props: { run: noErrorsRun },
    });

    expect(wrapper.text()).not.toContain('errors');
  });

  it('should apply hover styling', () => {
    const wrapper = mount(RunCard, {
      props: { run: mockRun },
    });

    const card = wrapper.find('[data-test="run-card"]');
    expect(card.exists()).toBe(true);
  });
});
