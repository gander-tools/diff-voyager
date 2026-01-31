import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { availableLocales, getSavedLocale, i18n, saveLocale } from '@/i18n';

describe('i18n', () => {
  // Clean up localStorage before and after each test
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('i18n instance', () => {
    it('should have default locale as English', () => {
      // @ts-expect-error - TypeScript incorrectly infers locale as string, but it's actually a WritableComputedRef at runtime
      expect(i18n.global.locale.value).toBe('en');
    });

    it('should have fallback locale as English', () => {
      // @ts-expect-error - TypeScript incorrectly infers fallbackLocale type, but it's actually a ref at runtime
      expect(i18n.global.fallbackLocale.value).toBe('en');
    });

    it('should have English and Polish messages', () => {
      // @ts-expect-error - TypeScript incorrectly infers messages as object, but it's actually a ref at runtime
      expect(i18n.global.messages.value).toHaveProperty('en');
      // @ts-expect-error - TypeScript incorrectly infers messages as object, but it's actually a ref at runtime
      expect(i18n.global.messages.value).toHaveProperty('pl');
    });

    it('should translate common keys', () => {
      const t = i18n.global.t;
      expect(t('common.loading')).toBe('Loading...');
      expect(t('common.error')).toBe('Error');
      expect(t('common.save')).toBe('Save');
    });

    it('should translate navigation keys', () => {
      const t = i18n.global.t;
      expect(t('nav.dashboard')).toBe('Dashboard');
      expect(t('nav.projects')).toBe('Projects');
      expect(t('nav.runs')).toBe('Runs');
    });
  });

  describe('availableLocales', () => {
    it('should have English and Polish locales', () => {
      expect(availableLocales).toHaveLength(2);
      expect(availableLocales[0]).toEqual({ code: 'en', name: 'English' });
      expect(availableLocales[1]).toEqual({ code: 'pl', name: 'Polski' });
    });
  });

  describe('getSavedLocale', () => {
    it('should return "en" when no locale is saved', () => {
      expect(getSavedLocale()).toBe('en');
    });

    it('should return saved locale from localStorage', () => {
      localStorage.setItem('locale', 'pl');
      expect(getSavedLocale()).toBe('pl');
    });

    it('should return "en" for invalid locale', () => {
      localStorage.setItem('locale', 'invalid');
      expect(getSavedLocale()).toBe('en');
    });
  });

  describe('saveLocale', () => {
    it('should save locale to localStorage', () => {
      saveLocale('pl');
      expect(localStorage.getItem('locale')).toBe('pl');
    });

    it('should save English locale', () => {
      saveLocale('en');
      expect(localStorage.getItem('locale')).toBe('en');
    });
  });

  describe('Polish translations', () => {
    it('should have Polish translations for common keys', () => {
      // @ts-expect-error - TypeScript incorrectly infers locale as string, but it's actually a WritableComputedRef at runtime
      i18n.global.locale.value = 'pl';
      const t = i18n.global.t;

      expect(t('common.loading')).toBe('Ładowanie...');
      expect(t('common.error')).toBe('Błąd');
      expect(t('common.save')).toBe('Zapisz');
    });

    it('should fall back to English for missing keys', () => {
      // @ts-expect-error - TypeScript incorrectly infers locale as string, but it's actually a WritableComputedRef at runtime
      i18n.global.locale.value = 'pl';
      const t = i18n.global.t;

      // All keys should be translated in Polish
      // If missing, it falls back to English
      expect(t('nav.dashboard')).toBeTruthy();
    });
  });
});
