/**
 * Naive UI test wrapper
 * Provides NConfigProvider for components that need it (e.g., NDataTable)
 */

import type { VueWrapper } from '@vue/test-utils';
import { mount } from '@vue/test-utils';
import { NConfigProvider } from 'naive-ui';
import type { Component } from 'vue';
import { h } from 'vue';

/**
 * Wraps component with NConfigProvider for testing
 * Use this for components that use NDataTable or other Naive UI components
 */
export function mountWithNaiveUI(
  component: Component,
  options?: Parameters<typeof mount>[1],
): VueWrapper {
  // Create wrapper component
  const WrapperComponent = {
    components: { NConfigProvider },
    setup() {
      return () => h(NConfigProvider, {}, { default: () => h(component) });
    },
  };

  return mount(WrapperComponent, options);
}
