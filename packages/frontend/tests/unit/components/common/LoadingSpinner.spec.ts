import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

describe('LoadingSpinner', () => {
  it('should render with default size', () => {
    const wrapper = mount(LoadingSpinner, {
      global: {
        stubs: {
          NSpin: { template: '<div class="n-spin">Loading...</div>' },
        },
      },
    });

    expect(wrapper.find('.n-spin').exists()).toBe(true);
  });

  it('should accept size prop', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        size: 'large',
      },
      global: {
        stubs: {
          NSpin: {
            template: '<div class="n-spin" :size="$attrs.size">Loading...</div>',
            props: ['size'],
          },
        },
      },
    });

    expect(wrapper.find('.n-spin').exists()).toBe(true);
  });

  it('should display description when provided', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        description: 'Loading data...',
      },
      global: {
        stubs: {
          NSpin: {
            template: '<div class="n-spin">{{ description }}</div>',
            props: ['description'],
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Loading data...');
  });
});
