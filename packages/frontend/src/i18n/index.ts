import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import pl from './locales/pl.json';

export type MessageSchema = typeof en;

/**
 * Vue i18n instance
 */
export const i18n = createI18n<[MessageSchema], 'en' | 'pl'>({
  legacy: false, // Use Composition API mode
  locale: 'en', // Default locale
  fallbackLocale: 'en',
  messages: {
    en,
    pl,
  },
});

/**
 * Available locales
 */
export const availableLocales = [
  { code: 'en', name: 'English' },
  { code: 'pl', name: 'Polski' },
] as const;

/**
 * Get current locale from localStorage or default
 */
export function getSavedLocale(): 'en' | 'pl' {
  const saved = localStorage.getItem('locale');
  return saved === 'pl' ? 'pl' : 'en';
}

/**
 * Save locale to localStorage
 */
export function saveLocale(locale: 'en' | 'pl'): void {
  localStorage.setItem('locale', locale);
}
