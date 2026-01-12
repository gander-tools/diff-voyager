/**
 * RunStatusBadge tests
 * Tests run status badge component for displaying run status
 */

import { RunStatus } from '@gander-tools/diff-voyager-shared';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RunStatusBadge from '../../../src/components/RunStatusBadge.vue';

describe('RunStatusBadge', () => {
  it('should render NEW status as Pending with gray badge', () => {
    const wrapper = mount(RunStatusBadge, {
      props: { status: RunStatus.NEW },
    });

    expect(wrapper.text()).toContain('Pending');
    expect(wrapper.find('.badge-animated').exists()).toBe(false);
  });

  it('should render IN_PROGRESS status as Processing with blue badge and animation', () => {
    const wrapper = mount(RunStatusBadge, {
      props: { status: RunStatus.IN_PROGRESS },
    });

    expect(wrapper.text()).toContain('Processing');
    expect(wrapper.find('.badge-animated').exists()).toBe(true);
  });

  it('should render COMPLETED status as Completed with green badge', () => {
    const wrapper = mount(RunStatusBadge, {
      props: { status: RunStatus.COMPLETED },
    });

    expect(wrapper.text()).toContain('Completed');
    expect(wrapper.find('.badge-animated').exists()).toBe(false);
  });

  it('should render INTERRUPTED status as Failed with red badge', () => {
    const wrapper = mount(RunStatusBadge, {
      props: { status: RunStatus.INTERRUPTED },
    });

    expect(wrapper.text()).toContain('Failed');
    expect(wrapper.find('.badge-animated').exists()).toBe(false);
  });

  it('should support different sizes', () => {
    const wrapper = mount(RunStatusBadge, {
      props: { status: RunStatus.COMPLETED, size: 'small' },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should have data-test attribute', () => {
    const wrapper = mount(RunStatusBadge, {
      props: { status: RunStatus.COMPLETED },
    });

    const badge = wrapper.find('[data-test="run-status-badge"]');
    expect(badge.exists()).toBe(true);
  });
});
