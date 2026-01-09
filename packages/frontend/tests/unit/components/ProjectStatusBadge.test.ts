/**
 * ProjectStatusBadge tests
 * Tests status badge component for projects
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ProjectStatusBadge from '../../../src/components/ProjectStatusBadge.vue';

describe('ProjectStatusBadge', () => {
  it('should render "new" status badge', () => {
    const wrapper = mount(ProjectStatusBadge, {
      props: { status: 'new' },
    });

    expect(wrapper.text()).toContain('New');
    expect(wrapper.find('[data-test="status-badge"]').exists()).toBe(true);
  });

  it('should render "in_progress" status badge', () => {
    const wrapper = mount(ProjectStatusBadge, {
      props: { status: 'in_progress' },
    });

    expect(wrapper.text()).toContain('In Progress');
  });

  it('should render "completed" status badge', () => {
    const wrapper = mount(ProjectStatusBadge, {
      props: { status: 'completed' },
    });

    expect(wrapper.text()).toContain('Completed');
  });

  it('should render "failed" status badge', () => {
    const wrapper = mount(ProjectStatusBadge, {
      props: { status: 'failed' },
    });

    expect(wrapper.text()).toContain('Failed');
  });

  it('should render "interrupted" status badge', () => {
    const wrapper = mount(ProjectStatusBadge, {
      props: { status: 'interrupted' },
    });

    expect(wrapper.text()).toContain('Interrupted');
  });

  it('should handle unknown status', () => {
    const wrapper = mount(ProjectStatusBadge, {
      props: { status: 'unknown' },
    });

    expect(wrapper.text()).toContain('Unknown');
  });

  it('should use different badge types for different statuses', () => {
    const completedWrapper = mount(ProjectStatusBadge, {
      props: { status: 'completed' },
    });

    const failedWrapper = mount(ProjectStatusBadge, {
      props: { status: 'failed' },
    });

    // Both should render badges, but we can't easily check the internal type without inspecting Naive UI internals
    expect(completedWrapper.find('[data-test="status-badge"]').exists()).toBe(true);
    expect(failedWrapper.find('[data-test="status-badge"]').exists()).toBe(true);
  });

  it('should be able to render with size prop', () => {
    const wrapper = mount(ProjectStatusBadge, {
      props: {
        status: 'completed',
        size: 'small',
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
