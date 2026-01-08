import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PageDetailsResponse, PageDiffResponse } from '@/services/api';
import { getPage, getPageDiff } from '@/services/api';

/**
 * Pages Store
 * Manages page state including current page and diff
 */
export const usePagesStore = defineStore('pages', () => {
  // State
  const currentPage = ref<PageDetailsResponse | null>(null);
  const currentDiff = ref<PageDiffResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Actions
  async function fetchPage(pageId: string) {
    loading.value = true;
    error.value = null;

    try {
      const page = await getPage(pageId);
      currentPage.value = page;
      return page;
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPageDiff(pageId: string) {
    loading.value = true;
    error.value = null;

    try {
      const diff = await getPageDiff(pageId);
      currentDiff.value = diff;
      return diff;
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearCurrentPage() {
    currentPage.value = null;
    currentDiff.value = null;
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    currentPage,
    currentDiff,
    loading,
    error,

    // Actions
    fetchPage,
    fetchPageDiff,
    clearCurrentPage,
    clearError,
  };
});
