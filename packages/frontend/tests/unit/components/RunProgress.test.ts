/**
 * RunProgress tests
 * Tests progress indicator component for running scans
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import RunProgress from '../../../src/components/RunProgress.vue';

describe('RunProgress', () => {
  const mockRun = {
    id: 'run-12345678-abcd-1234-efgh-ijklmnopqrst',
    projectId: 'proj-123',
    baselineId: 'baseline-456',
    status: 'in_progress',
    createdAt: '2024-01-01T10:00:00Z',
    startedAt: '2024-01-01T10:00:01Z',
    statistics: {
      totalPages: 100,
      completedPages: 40,
      errorPages: 5,
      unchangedPages: 20,
      changedPages: 20,
      criticalDifferences: 3,
      acceptedDifferences: 1,
      mutedDifferences: 0,
    },
  };

  it('should render progress bar', () => {
    const wrapper = mount(RunProgress, {
      props: { run: mockRun },
    });

    const progressBar = wrapper.find('[data-test="progress-bar"]');
    expect(progressBar.exists()).toBe(true);
  });

  it('should calculate progress correctly', () => {
    const wrapper = mount(RunProgress, {
      props: { run: mockRun },
    });

    // 40 completed + 5 errors = 45/100 = 45%
    expect(wrapper.vm.progress).toBe(45);
  });

  it('should display current phase', () => {
    const wrapper = mount(RunProgress, {
      props: { run: mockRun },
    });

    const phase = wrapper.find('[data-test="current-phase"]');
    expect(phase.exists()).toBe(true);
    expect(phase.text()).toBe('Scanning pages');
  });

  it('should display pages processed count', () => {
    const wrapper = mount(RunProgress, {
      props: { run: mockRun },
    });

    const pagesProcessed = wrapper.find('[data-test="pages-processed"]');
    expect(pagesProcessed.exists()).toBe(true);
    expect(pagesProcessed.text()).toBe('45 / 100 pages');
  });

  it('should show error count when errors present', () => {
    const wrapper = mount(RunProgress, {
      props: { run: mockRun },
    });

    const errorCount = wrapper.find('[data-test="error-count"]');
    expect(errorCount.exists()).toBe(true);
    expect(errorCount.text()).toContain('5 errors');
  });

  it('should not show error count when no errors', () => {
    const noErrorRun = {
      ...mockRun,
      statistics: {
        ...mockRun.statistics,
        errorPages: 0,
      },
    };

    const wrapper = mount(RunProgress, {
      props: { run: noErrorRun },
    });

    const errorCount = wrapper.find('[data-test="error-count"]');
    expect(errorCount.exists()).toBe(false);
  });

  it('should show singular "error" for 1 error', () => {
    const oneErrorRun = {
      ...mockRun,
      statistics: {
        ...mockRun.statistics,
        errorPages: 1,
      },
    };

    const wrapper = mount(RunProgress, {
      props: { run: oneErrorRun },
    });

    const errorCount = wrapper.find('[data-test="error-count"]');
    expect(errorCount.text()).toBe('1 error');
  });

  it('should show estimated time remaining when enabled and started', () => {
    // Mock Date.now() to control time calculation
    const mockNow = new Date('2024-01-01T10:01:01Z').getTime(); // 1 minute after start
    vi.spyOn(Date, 'now').mockReturnValue(mockNow);

    const wrapper = mount(RunProgress, {
      props: { run: mockRun, showEstimatedTime: true },
    });

    const estimatedTime = wrapper.find('[data-test="estimated-time"]');
    expect(estimatedTime.exists()).toBe(true);
    expect(estimatedTime.text()).toContain('remaining');

    vi.restoreAllMocks();
  });

  it('should not show estimated time when disabled', () => {
    const wrapper = mount(RunProgress, {
      props: { run: mockRun, showEstimatedTime: false },
    });

    const estimatedTime = wrapper.find('[data-test="estimated-time"]');
    expect(estimatedTime.exists()).toBe(false);
  });

  it('should not show estimated time when run not started', () => {
    const notStartedRun = {
      ...mockRun,
      startedAt: undefined,
    };

    const wrapper = mount(RunProgress, {
      props: { run: notStartedRun, showEstimatedTime: true },
    });

    const estimatedTime = wrapper.find('[data-test="estimated-time"]');
    expect(estimatedTime.exists()).toBe(false);
  });

  it('should not show estimated time when progress < 10%', () => {
    const earlyRun = {
      ...mockRun,
      statistics: {
        ...mockRun.statistics,
        completedPages: 5,
        errorPages: 0,
      },
    };

    const wrapper = mount(RunProgress, {
      props: { run: earlyRun, showEstimatedTime: true },
    });

    const estimatedTime = wrapper.find('[data-test="estimated-time"]');
    expect(estimatedTime.exists()).toBe(false);
  });

  it('should show correct phase for "new" status', () => {
    const newRun = { ...mockRun, status: 'new' };
    const wrapper = mount(RunProgress, { props: { run: newRun } });

    expect(wrapper.find('[data-test="current-phase"]').text()).toBe('Initializing');
  });

  it('should show correct phase for "pending" status', () => {
    const pendingRun = { ...mockRun, status: 'pending' };
    const wrapper = mount(RunProgress, { props: { run: pendingRun } });

    expect(wrapper.find('[data-test="current-phase"]').text()).toBe('Queued');
  });

  it('should show correct phase for "completed" status', () => {
    const completedRun = { ...mockRun, status: 'completed' };
    const wrapper = mount(RunProgress, { props: { run: completedRun } });

    expect(wrapper.find('[data-test="current-phase"]').text()).toBe('Completed');
  });

  it('should show correct phase for "interrupted" status', () => {
    const interruptedRun = { ...mockRun, status: 'interrupted' };
    const wrapper = mount(RunProgress, { props: { run: interruptedRun } });

    expect(wrapper.find('[data-test="current-phase"]').text()).toBe('Interrupted');
  });

  it('should show correct phase for "error" status', () => {
    const errorRun = { ...mockRun, status: 'error' };
    const wrapper = mount(RunProgress, { props: { run: errorRun } });

    expect(wrapper.find('[data-test="current-phase"]').text()).toBe('Failed');
  });

  it('should handle 0 total pages', () => {
    const emptyRun = {
      ...mockRun,
      statistics: {
        ...mockRun.statistics,
        totalPages: 0,
        completedPages: 0,
        errorPages: 0,
      },
    };

    const wrapper = mount(RunProgress, { props: { run: emptyRun } });
    expect(wrapper.vm.progress).toBe(0);
  });

  it('should show 100% progress when all pages complete', () => {
    const completeRun = {
      ...mockRun,
      status: 'completed',
      statistics: {
        ...mockRun.statistics,
        totalPages: 100,
        completedPages: 95,
        errorPages: 5,
      },
    };

    const wrapper = mount(RunProgress, { props: { run: completeRun } });
    expect(wrapper.vm.progress).toBe(100);
  });

  it('should have default progress status for in_progress without errors', () => {
    const cleanRun = {
      ...mockRun,
      statistics: {
        ...mockRun.statistics,
        errorPages: 0,
      },
    };

    const wrapper = mount(RunProgress, { props: { run: cleanRun } });
    expect(wrapper.vm.progressStatus).toBe('default');
  });

  it('should have warning status for in_progress with errors', () => {
    const wrapper = mount(RunProgress, { props: { run: mockRun } });
    expect(wrapper.vm.progressStatus).toBe('warning');
  });

  it('should have error status for error status', () => {
    const errorRun = { ...mockRun, status: 'error' };
    const wrapper = mount(RunProgress, { props: { run: errorRun } });
    expect(wrapper.vm.progressStatus).toBe('error');
  });

  it('should have success status for completed status', () => {
    const completedRun = {
      ...mockRun,
      status: 'completed',
      statistics: {
        ...mockRun.statistics,
        errorPages: 0,
      },
    };

    const wrapper = mount(RunProgress, { props: { run: completedRun } });
    expect(wrapper.vm.progressStatus).toBe('success');
  });

  it('should have warning status for interrupted status', () => {
    const interruptedRun = { ...mockRun, status: 'interrupted' };
    const wrapper = mount(RunProgress, { props: { run: interruptedRun } });
    expect(wrapper.vm.progressStatus).toBe('warning');
  });

  it('should format duration in seconds', () => {
    const wrapper = mount(RunProgress, { props: { run: mockRun } });
    const formatted = wrapper.vm.formatDuration(5000);
    expect(formatted).toBe('~5s');
  });

  it('should format duration in minutes', () => {
    const wrapper = mount(RunProgress, { props: { run: mockRun } });
    const formatted = wrapper.vm.formatDuration(125000);
    expect(formatted).toBe('~2m');
  });

  it('should format duration in hours and minutes', () => {
    const wrapper = mount(RunProgress, { props: { run: mockRun } });
    const formatted = wrapper.vm.formatDuration(7325000);
    expect(formatted).toBe('~2h 2m');
  });
});
