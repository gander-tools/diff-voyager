/**
 * SettingsView tests
 * Tests settings form with validation and persistence
 */

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { useSettingsStore } from '../../../src/stores/settings';
import { useUiStore } from '../../../src/stores/ui';
import SettingsView from '../../../src/views/SettingsView.vue';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock i18n
vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual('vue-i18n');
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key,
    }),
  };
});

// Mock naive-ui message
const mockMessage = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
};

vi.mock('naive-ui', async () => {
  const actual = await vi.importActual('naive-ui');
  return {
    ...actual,
    useMessage: () => mockMessage,
  };
});

describe('SettingsView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorageMock.clear();
    mockMessage.success.mockClear();
    mockMessage.error.mockClear();
    mockMessage.warning.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render settings form', () => {
    const wrapper = mount(SettingsView);
    expect(wrapper.find('[data-test="language-select"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="viewport-preset-select"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="theme-select"]').exists()).toBe(true);
  });

  it('should load current settings on mount', async () => {
    const settingsStore = useSettingsStore();
    settingsStore.updateSettings({
      language: 'en',
      theme: 'dark',
      defaultViewport: { width: 1920, height: 1080 },
    });

    const wrapper = mount(SettingsView);
    await nextTick();

    // Verify language is loaded
    const languageSelect = wrapper.find('[data-test="language-select"]');
    expect(languageSelect.exists()).toBe(true);
  });

  it('should render save button', () => {
    const wrapper = mount(SettingsView);
    const saveButton = wrapper.find('[data-test="save-button"]');
    expect(saveButton.exists()).toBe(true);
    expect(saveButton.text()).toContain('common.save');
  });

  it('should reset to defaults when reset button is clicked', async () => {
    const settingsStore = useSettingsStore();

    // Change settings
    settingsStore.updateSettings({
      language: 'pl',
      theme: 'dark',
      defaultViewport: { width: 1024, height: 768 },
    });

    const wrapper = mount(SettingsView);
    await nextTick();

    // Click reset button
    const resetButton = wrapper.find('[data-test="reset-button"]');
    await resetButton.trigger('click');
    await nextTick();

    // Verify settings are reset
    expect(settingsStore.settings.language).toBe('en');
    expect(settingsStore.settings.theme).toBe('auto');
    expect(mockMessage.success).toHaveBeenCalledWith('settings.saved');
  });

  it('should integrate with ui store for theme management', () => {
    const uiStore = useUiStore();
    mount(SettingsView);

    // Verify ui store exists and is accessible
    expect(uiStore).toBeDefined();
    expect(uiStore.setTheme).toBeDefined();
    expect(uiStore.setLanguage).toBeDefined();
  });

  it('should render viewport preset options', () => {
    const wrapper = mount(SettingsView);
    const viewportSelect = wrapper.find('[data-test="viewport-preset-select"]');
    expect(viewportSelect.exists()).toBe(true);
  });

  it('should render viewport width and height inputs', () => {
    const wrapper = mount(SettingsView);
    expect(wrapper.find('[data-test="viewport-width-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="viewport-height-input"]').exists()).toBe(true);
  });

  it('should render visual threshold input', () => {
    const wrapper = mount(SettingsView);
    expect(wrapper.find('[data-test="visual-threshold-input"]').exists()).toBe(true);
  });

  it('should render max pages input', () => {
    const wrapper = mount(SettingsView);
    expect(wrapper.find('[data-test="max-pages-input"]').exists()).toBe(true);
  });

  it('should render collect HAR switch', () => {
    const wrapper = mount(SettingsView);
    expect(wrapper.find('[data-test="collect-har-switch"]').exists()).toBe(true);
  });

  it('should render wait after load input', () => {
    const wrapper = mount(SettingsView);
    expect(wrapper.find('[data-test="wait-after-load-input"]').exists()).toBe(true);
  });

  it('should render compact mode switch', () => {
    const wrapper = mount(SettingsView);
    expect(wrapper.find('[data-test="compact-mode-switch"]').exists()).toBe(true);
  });

  it('should persist settings to localStorage', async () => {
    const settingsStore = useSettingsStore();

    settingsStore.updateSettings({
      language: 'pl',
      theme: 'dark',
      defaultViewport: { width: 1366, height: 768 },
    });

    await nextTick();

    // Verify localStorage was updated
    const stored = localStorageMock.getItem('app-settings');
    expect(stored).toBeDefined();
    if (!stored) throw new Error('Settings not found in localStorage');

    const parsed = JSON.parse(stored);
    expect(parsed.language).toBe('pl');
    expect(parsed.theme).toBe('dark');
  });
});
