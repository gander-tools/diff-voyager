/**
 * Global test setup file
 * Configures mocks and global utilities for all tests
 */

import en from '../src/i18n/locales/en.json';
import { vi } from 'vitest';

// Helper function to get translation by key path
function getTranslation(key: string): string {
  const keys = key.split('.');
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic translation lookup requires any type
  let value: any = en;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }

  return typeof value === 'string' ? value : key;
}

// Mock vue-i18n globally for all tests
vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual('vue-i18n');
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => getTranslation(key),
      locale: { value: 'en' },
    }),
  };
});
