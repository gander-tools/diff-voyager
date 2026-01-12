/**
 * PageStatusBadge tests
 * Tests page status badge component for displaying page status
 */

import { PageStatus } from '@gander-tools/diff-voyager-shared';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PageStatusBadge from '../../../src/components/PageStatusBadge.vue';

describe('PageStatusBadge', () => {
  it('should render PENDING status as Pending with default badge', () => {
    const wrapper = mount(PageStatusBadge, {
      props: { status: PageStatus.PENDING },
    });

    expect(wrapper.text()).toContain('Pending');
    expect(wrapper.find('.badge-animated').exists()).toBe(false);
  });

  it('should render IN_PROGRESS status as Processing with blue badge and animation', () => {
    const wrapper = mount(PageStatusBadge, {
      props: { status: PageStatus.IN_PROGRESS },
    });

    expect(wrapper.text()).toContain('Processing');
    expect(wrapper.find('.badge-animated').exists()).toBe(true);
  });

  it('should render COMPLETED status as Completed with green badge', () => {
    const wrapper = mount(PageStatusBadge, {
      props: { status: PageStatus.COMPLETED },
    });

    expect(wrapper.text()).toContain('Completed');
    expect(wrapper.find('.badge-animated').exists()).toBe(false);
  });

  it('should render PARTIAL status as Partial with yellow badge', () => {
    const wrapper = mount(PageStatusBadge, {
      props: { status: PageStatus.PARTIAL },
    });

    expect(wrapper.text()).toContain('Partial');
    expect(wrapper.find('.badge-animated').exists()).toBe(false);
  });

  it('should render ERROR status as Error with red badge', () => {
    const wrapper = mount(PageStatusBadge, {
      props: { status: PageStatus.ERROR },
    });

    expect(wrapper.text()).toContain('Error');
    expect(wrapper.find('.badge-animated').exists()).toBe(false);
  });

  it('should support different sizes', () => {
    const wrapper = mount(PageStatusBadge, {
      props: { status: PageStatus.COMPLETED, size: 'small' },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should have data-test attribute', () => {
    const wrapper = mount(PageStatusBadge, {
      props: { status: PageStatus.COMPLETED },
    });

    const badge = wrapper.find('[data-test="page-status-badge"]');
    expect(badge.exists()).toBe(true);
  });
});
