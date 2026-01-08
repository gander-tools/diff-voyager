import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';
import ErrorAlert from '@/components/common/ErrorAlert.vue';

describe('ErrorAlert', () => {
  let i18n: ReturnType<typeof createI18n>;

  beforeEach(() => {
    i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {
          common: {
            error: 'Error',
          },
        },
      },
    });
  });

  it('should render error message as string', () => {
    const wrapper = mount(ErrorAlert, {
      props: {
        error: 'Test error message',
      },
      global: {
        plugins: [i18n],
        stubs: {
          NAlert: { template: '<div class="n-alert"><slot /></div>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Test error message');
  });

  it('should render error message from Error object', () => {
    const error = new Error('Error object message');
    const wrapper = mount(ErrorAlert, {
      props: {
        error,
      },
      global: {
        plugins: [i18n],
        stubs: {
          NAlert: { template: '<div class="n-alert"><slot /></div>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Error object message');
  });

  it('should not render when error is null', () => {
    const wrapper = mount(ErrorAlert, {
      props: {
        error: null,
      },
      global: {
        plugins: [i18n],
        stubs: {
          NAlert: true,
        },
      },
    });

    expect(wrapper.find('.n-alert').exists()).toBe(false);
  });

  it('should render with custom title', () => {
    const wrapper = mount(ErrorAlert, {
      props: {
        error: 'Test error',
        title: 'Custom Error Title',
      },
      global: {
        plugins: [i18n],
        stubs: {
          NAlert: { template: '<div class="n-alert"><slot /></div>' },
        },
      },
    });

    expect(wrapper.find('.n-alert').exists()).toBe(true);
  });
});
