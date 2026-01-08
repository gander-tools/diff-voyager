import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from '@/stores/ui';

describe('UI Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with default values', () => {
    const store = useUiStore();

    expect(store.theme).toBe('auto');
    expect(store.locale).toBe('en');
    expect(store.sidebarCollapsed).toBe(false);
  });

  it('should set theme and persist to localStorage', () => {
    const store = useUiStore();

    store.setTheme('dark');

    expect(store.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should set language and persist to localStorage', () => {
    const store = useUiStore();

    store.setLanguage('pl');

    expect(store.locale).toBe('pl');
    expect(localStorage.getItem('locale')).toBe('pl');
  });

  it('should toggle sidebar', () => {
    const store = useUiStore();

    expect(store.sidebarCollapsed).toBe(false);

    store.toggleSidebar();
    expect(store.sidebarCollapsed).toBe(true);
    expect(localStorage.getItem('sidebar-collapsed')).toBe('true');

    store.toggleSidebar();
    expect(store.sidebarCollapsed).toBe(false);
    expect(localStorage.getItem('sidebar-collapsed')).toBe('false');
  });

  it('should set sidebar collapsed state', () => {
    const store = useUiStore();

    store.setSidebarCollapsed(true);
    expect(store.sidebarCollapsed).toBe(true);
    expect(localStorage.getItem('sidebar-collapsed')).toBe('true');
  });

  it('should load theme from localStorage', () => {
    localStorage.setItem('theme', 'light');

    const store = useUiStore();
    expect(store.theme).toBe('light');
  });
});
