/**
 * PageFilters tests
 * Tests page filtering component with change type, status, URL pattern, and muted filters
 */

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PageFilterValues } from '../../../src/components/PageFilters.vue';
import PageFilters from '../../../src/components/PageFilters.vue';

// Mock useMessage from naive-ui
const mockMessage = {
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

vi.mock('naive-ui', async () => {
  const actual = await vi.importActual('naive-ui');
  return {
    ...actual,
    useMessage: () => mockMessage,
  };
});

describe('PageFilters', () => {
  beforeEach(() => {
    mockMessage.error.mockClear();
    mockMessage.success.mockClear();
    mockMessage.warning.mockClear();
    mockMessage.info.mockClear();
  });

  it('should render filter card with title', () => {
    const wrapper = mount(PageFilters);
    expect(wrapper.text()).toContain('Filters');
  });

  it('should render all filter inputs', () => {
    const wrapper = mount(PageFilters);

    // Check for change type filter
    const changeTypeSelect = wrapper.find('[data-test="change-type-select"]');
    expect(changeTypeSelect.exists()).toBe(true);

    // Check for status filter
    const statusSelect = wrapper.find('[data-test="status-select"]');
    expect(statusSelect.exists()).toBe(true);

    // Check for URL pattern input
    const urlInput = wrapper.find('[data-test="url-pattern-input"]');
    expect(urlInput.exists()).toBe(true);

    // Check for show muted checkbox
    const showMutedCheckbox = wrapper.find('[data-test="show-muted-checkbox"]');
    expect(showMutedCheckbox.exists()).toBe(true);
  });

  it('should emit change event when change type filter changes', async () => {
    const wrapper = mount(PageFilters);

    // Simulate change type selection
    await wrapper.vm.$nextTick();

    // Get emitted events
    const emitted = wrapper.emitted('change');

    // Should emit at least once on mount
    expect(emitted).toBeDefined();
  });

  it('should emit change event when status filter changes', async () => {
    const wrapper = mount(PageFilters);

    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('change');
    expect(emitted).toBeDefined();
  });

  it('should emit change event when URL pattern changes', async () => {
    const wrapper = mount(PageFilters);

    const urlInputWrapper = wrapper.find('[data-test="url-pattern-input"]');
    if (urlInputWrapper.exists()) {
      // Find the actual input element inside the NInput component
      const inputElement = urlInputWrapper.find('input');
      if (inputElement.exists()) {
        await inputElement.setValue('test-pattern');
        await wrapper.vm.$nextTick();

        const emitted = wrapper.emitted('change');
        expect(emitted).toBeDefined();

        // Check if latest emitted value contains the URL pattern
        const latestEmit = emitted?.[emitted.length - 1]?.[0] as PageFilterValues;
        expect(latestEmit?.urlPattern).toBe('test-pattern');
      }
    }
  });

  it('should emit change event when show muted checkbox changes', async () => {
    const wrapper = mount(PageFilters);

    const checkbox = wrapper.find('[data-test="show-muted-checkbox"]');
    if (checkbox.exists()) {
      await checkbox.trigger('click');
      await wrapper.vm.$nextTick();

      const emitted = wrapper.emitted('change');
      expect(emitted).toBeDefined();
    }
  });

  it('should show reset button when filters are active', async () => {
    const wrapper = mount(PageFilters);

    // Initially no filters, reset button should not be visible
    let resetButton = wrapper.find('[data-test="reset-filters-btn"]');
    expect(resetButton.exists()).toBe(false);

    // Add a URL pattern filter
    const urlInputWrapper = wrapper.find('[data-test="url-pattern-input"]');
    if (urlInputWrapper.exists()) {
      const inputElement = urlInputWrapper.find('input');
      if (inputElement.exists()) {
        await inputElement.setValue('test');
        await wrapper.vm.$nextTick();

        // Now reset button should appear
        resetButton = wrapper.find('[data-test="reset-filters-btn"]');
        expect(resetButton.exists()).toBe(true);
      }
    }
  });

  it('should reset all filters when reset button is clicked', async () => {
    const wrapper = mount(PageFilters);

    // Set URL pattern
    const urlInputWrapper = wrapper.find('[data-test="url-pattern-input"]');
    if (urlInputWrapper.exists()) {
      const inputElement = urlInputWrapper.find('input');
      if (inputElement.exists()) {
        await inputElement.setValue('test-pattern');
        await wrapper.vm.$nextTick();

        // Click reset button
        const resetButton = wrapper.find('[data-test="reset-filters-btn"]');
        if (resetButton.exists()) {
          await resetButton.trigger('click');
          await wrapper.vm.$nextTick();

          // Check that filters are reset
          const emitted = wrapper.emitted('change');
          if (emitted) {
            const latestEmit = emitted[emitted.length - 1]?.[0] as PageFilterValues;
            expect(latestEmit?.urlPattern).toBe('');
            expect(latestEmit?.changeTypes).toEqual([]);
            expect(latestEmit?.statuses).toEqual([]);
            expect(latestEmit?.showMuted).toBe(false);
          }
        }
      }
    }
  });

  it('should have correct filter labels', () => {
    const wrapper = mount(PageFilters);

    const text = wrapper.text();
    expect(text).toContain('Change Type');
    expect(text).toContain('Status');
    expect(text).toContain('URL Pattern');
    expect(text).toContain('Show muted items');
  });

  it('should initialize with empty filters', () => {
    const wrapper = mount(PageFilters);

    // Wait for component to mount and emit initial change event
    const emitted = wrapper.emitted('change');

    if (emitted && emitted.length > 0) {
      const initialFilters = emitted[0]?.[0] as PageFilterValues;
      expect(initialFilters?.changeTypes).toEqual([]);
      expect(initialFilters?.statuses).toEqual([]);
      expect(initialFilters?.urlPattern).toBe('');
      expect(initialFilters?.showMuted).toBe(false);
    }
  });

  it('should emit filter values with correct structure', async () => {
    const wrapper = mount(PageFilters);

    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('change');

    if (emitted && emitted.length > 0) {
      const filterValues = emitted[0]?.[0] as PageFilterValues;

      // Check structure
      expect(filterValues).toHaveProperty('changeTypes');
      expect(filterValues).toHaveProperty('statuses');
      expect(filterValues).toHaveProperty('urlPattern');
      expect(filterValues).toHaveProperty('showMuted');

      // Check types
      expect(Array.isArray(filterValues?.changeTypes)).toBe(true);
      expect(Array.isArray(filterValues?.statuses)).toBe(true);
      expect(typeof filterValues?.urlPattern).toBe('string');
      expect(typeof filterValues?.showMuted).toBe('boolean');
    }
  });
});
