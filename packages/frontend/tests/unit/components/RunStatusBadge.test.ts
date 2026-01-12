/**
 * RunStatusBadge tests
 * Tests run status badge component for displaying run status
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RunStatusBadge from '../../../src/components/RunStatusBadge.vue';

describe('RunStatusBadge', () => {
  it('should render pending status', () => {
    const wrapper = mount(RunStatusBadge, {
      props: { status: 'pending' },
    });

    expect(wrapper.text()).toContain('Pending');
  });

  it('should render in_progress status', () => {
    const wrapper = mount(RunStatusBadge, {
      props: { status: 'in_progress' },
    });

    expect(wrapper.text()).toContain('In Progress');
  });

  it('should render completed status', () => {
    const wrapper = mount(RunStatusBadge, {
      props: { status: 'completed' },
    });

    expect(wrapper.text()).toContain('Completed');
  });

  it('should render error status', () => {
    const wrapper = mount(RunStatusBadge, {
      props: { status: 'error' },
    });

    expect(wrapper.text()).toContain('Error');
  });

  it('should render failed status', () => {
    const wrapper = mount(RunStatusBadge, {
      props: { status: 'failed' },
    });

    expect(wrapper.text()).toContain('Failed');
  });

  it('should render cancelled status', () => {
    const wrapper = mount(RunStatusBadge, {
      props: { status: 'cancelled' },
    });

    expect(wrapper.text()).toContain('Cancelled');
  });

  it('should render interrupted status', () => {
    const wrapper = mount(RunStatusBadge, {
      props: { status: 'interrupted' },
    });

    expect(wrapper.text()).toContain('Interrupted');
  });

  it('should handle unknown status gracefully', () => {
    const wrapper = mount(RunStatusBadge, {
      props: { status: 'unknown_status' },
    });

    expect(wrapper.text()).toContain('unknown_status');
  });

  it('should support different sizes', () => {
    const wrapper = mount(RunStatusBadge, {
      props: { status: 'completed', size: 'small' },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should have data-test attribute', () => {
    const wrapper = mount(RunStatusBadge, {
      props: { status: 'completed' },
    });

    const badge = wrapper.find('[data-test="run-status-badge"]');
    expect(badge.exists()).toBe(true);
  });
});
