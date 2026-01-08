import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';
import App from '@/App.vue';

describe('App', () => {
  it('mounts renders properly', () => {
    // Create a minimal router for testing
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/',
          component: { template: '<div>Dashboard</div>' },
        },
      ],
    });

    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          NConfigProvider: { template: '<div><slot /></div>' },
          NMessageProvider: { template: '<div><slot /></div>' },
          NDialogProvider: { template: '<div><slot /></div>' },
          DefaultLayout: { template: '<div class="layout"><slot /></div>' },
        },
      },
    });

    expect(wrapper.find('.layout').exists()).toBe(true);
  });
});
