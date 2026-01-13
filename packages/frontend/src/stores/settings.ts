import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { SettingsInput } from '@/utils/validators';
import { settingsSchema } from '@/utils/validators';

const STORAGE_KEY = 'app-settings';

/**
 * Default settings values
 */
const defaultSettings: SettingsInput = {
  language: 'en',
  dataDirectory: undefined,
  defaultViewport: { width: 1920, height: 1080 },
  defaultVisualDiffThreshold: 0.01,
  defaultMaxPages: 100,
  defaultCollectHar: false,
  defaultWaitAfterLoad: 1000,
  theme: 'auto',
  compactMode: false,
};

/**
 * Settings Store
 * Manages application-wide default settings for scans and UI preferences
 */
export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<SettingsInput>(loadSettings());

  // Getters
  const viewport = computed(() => settings.value.defaultViewport);
  const visualDiffThreshold = computed(() => settings.value.defaultVisualDiffThreshold);
  const maxPages = computed(() => settings.value.defaultMaxPages);
  const collectHar = computed(() => settings.value.defaultCollectHar);
  const waitAfterLoad = computed(() => settings.value.defaultWaitAfterLoad);
  const compactMode = computed(() => settings.value.compactMode);

  // Actions
  function updateSettings(newSettings: Partial<SettingsInput>) {
    const merged = { ...settings.value, ...newSettings };
    const validated = settingsSchema.parse(merged);
    settings.value = validated;
    saveSettings(validated);
  }

  function resetSettings() {
    settings.value = { ...defaultSettings };
    saveSettings(defaultSettings);
  }

  function getDefaultScanConfig() {
    return {
      viewport: settings.value.defaultViewport,
      visualDiffThreshold: settings.value.defaultVisualDiffThreshold,
      maxPages: settings.value.defaultMaxPages,
      collectHar: settings.value.defaultCollectHar,
      waitAfterLoad: settings.value.defaultWaitAfterLoad,
    };
  }

  return {
    // State
    settings,

    // Getters
    viewport,
    visualDiffThreshold,
    maxPages,
    collectHar,
    waitAfterLoad,
    compactMode,

    // Actions
    updateSettings,
    resetSettings,
    getDefaultScanConfig,
  };
});

/**
 * Load settings from localStorage
 */
function loadSettings(): SettingsInput {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return settingsSchema.parse(parsed);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return { ...defaultSettings };
}

/**
 * Save settings to localStorage
 */
function saveSettings(settings: SettingsInput): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}
