import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import DefaultLayout from '@/components/layouts/DefaultLayout.vue';

describe('DefaultLayout', () => {
  let router: ReturnType<typeof createRouter>;
  let i18n: ReturnType<typeof createI18n>;
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
    });

    i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {
          nav: {
            dashboard: 'Dashboard',
            projects: 'Projects',
            runs: 'Runs',
            rules: 'Rules',
            settings: 'Settings',
          },
          settings: {
            theme: {
              light: 'Light',
              dark: 'Dark',
              auto: 'Auto',
            },
          },
        },
      },
    });

    pinia = createPinia();
  });

  it('should render layout structure', () => {
    const wrapper = mount(DefaultLayout, {
      global: {
        plugins: [router, i18n, pinia],
        stubs: {
          NLayout: { template: '<div class="n-layout"><slot /></div>' },
          NLayoutContent: { template: '<div class="n-layout-content"><slot /></div>' },
          AppSidebar: { template: '<div class="app-sidebar">Sidebar</div>' },
          AppHeader: { template: '<div class="app-header">Header</div>' },
          AppBreadcrumb: { template: '<div class="app-breadcrumb">Breadcrumb</div>' },
        },
      },
      slots: {
        default: '<div class="test-content">Test Content</div>',
      },
    });

    expect(wrapper.html()).toContain('n-layout');
    expect(wrapper.html()).toContain('app-sidebar');
    expect(wrapper.html()).toContain('app-header');
    expect(wrapper.html()).toContain('n-layout-content');
  });

  it('should render slot content', () => {
    const wrapper = mount(DefaultLayout, {
      global: {
        plugins: [router, i18n, pinia],
        stubs: {
          NLayout: { template: '<div><slot /></div>' },
          NLayoutContent: { template: '<div><slot /></div>' },
          AppSidebar: true,
          AppHeader: true,
          AppBreadcrumb: true,
        },
      },
      slots: {
        default: '<div class="test-content">Test Content</div>',
      },
    });

    expect(wrapper.html()).toContain('test-content');
    expect(wrapper.html()).toContain('Test Content');
  });
});
