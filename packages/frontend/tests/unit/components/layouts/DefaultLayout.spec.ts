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
          NLayoutSider: { template: '<div class="n-layout-sider"><slot /></div>' },
          NLayoutHeader: { template: '<div class="n-layout-header"><slot /></div>' },
          NLayoutContent: { template: '<div class="n-layout-content"><slot /></div>' },
          NMenu: { template: '<div class="n-menu"></div>' },
          NSpace: { template: '<div class="n-space"><slot /></div>' },
          NButton: { template: '<button><slot /></button>' },
          NDropdown: { template: '<div><slot /></div>' },
          NIcon: { template: '<span class="n-icon"></span>' },
          NBreadcrumb: { template: '<div class="n-breadcrumb"><slot /></div>' },
          NBreadcrumbItem: { template: '<span><slot /></span>' },
        },
      },
      slots: {
        default: '<div class="test-content">Test Content</div>',
      },
    });

    expect(wrapper.html()).toContain('n-layout');
    expect(wrapper.html()).toContain('n-layout-sider');
    expect(wrapper.html()).toContain('n-layout-header');
    expect(wrapper.html()).toContain('n-layout-content');
  });

  it('should render slot content', () => {
    const wrapper = mount(DefaultLayout, {
      global: {
        plugins: [router, i18n, pinia],
        stubs: {
          NLayout: { template: '<div><slot /></div>' },
          NLayoutSider: { template: '<div><slot /></div>' },
          NLayoutHeader: { template: '<div><slot /></div>' },
          NLayoutContent: { template: '<div><slot /></div>' },
          NMenu: true,
          NSpace: true,
          NButton: true,
          NDropdown: true,
          NIcon: true,
          NBreadcrumb: true,
          NBreadcrumbItem: true,
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
