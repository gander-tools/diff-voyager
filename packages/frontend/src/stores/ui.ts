import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getSavedLocale, i18n, saveLocale } from '@/i18n';

export type Theme = 'light' | 'dark' | 'auto';
export type Locale = 'en' | 'pl';

/**
 * UI Store
 * Manages UI state like theme, language, sidebar visibility
 */
export const useUiStore = defineStore('ui', () => {
  // State
  const theme = ref<Theme>((localStorage.getItem('theme') as Theme) || 'auto');
  const locale = ref<Locale>(getSavedLocale());
  const sidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true');

  // Actions
  function setTheme(newTheme: Theme) {
    theme.value = newTheme;
    localStorage.setItem('theme', newTheme);

    // Apply theme to document
    applyTheme(newTheme);
  }

  function setLanguage(newLocale: Locale) {
    locale.value = newLocale;
    i18n.global.locale = newLocale;
    saveLocale(newLocale);
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
    localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed.value));
  }

  function setSidebarCollapsed(collapsed: boolean) {
    sidebarCollapsed.value = collapsed;
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }

  // Helper to apply theme
  function applyTheme(themeValue: Theme) {
    const root = document.documentElement;

    if (themeValue === 'auto') {
      // Use system preference (if available)
      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      }
    } else {
      root.classList.toggle('dark', themeValue === 'dark');
    }
  }

  // Initialize theme on store creation
  applyTheme(theme.value);

  // Listen for system theme changes when in auto mode
  if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (_e) => {
      if (theme.value === 'auto') {
        applyTheme('auto');
      }
    });
  }

  return {
    // State
    theme,
    locale,
    sidebarCollapsed,

    // Actions
    setTheme,
    setLanguage,
    toggleSidebar,
    setSidebarCollapsed,
  };
});
