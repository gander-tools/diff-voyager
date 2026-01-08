import { defineStore } from 'pinia';
import { ref } from 'vue';

export type DiffFilter = {
  severity?: 'critical' | 'warning' | 'info';
  type?: 'seo' | 'visual' | 'content' | 'performance' | 'http_status' | 'headers';
  status?: 'new' | 'accepted' | 'muted';
};

/**
 * Diffs Store
 * Manages diff actions (accept, mute) and filtering
 */
export const useDiffsStore = defineStore('diffs', () => {
  // State
  const filters = ref<DiffFilter>({});
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Actions
  async function acceptDiff(diffId: string) {
    loading.value = true;
    error.value = null;

    try {
      // TODO: Implement API call when backend endpoint is available
      // await api.acceptDiff(diffId);
      console.log('Accept diff:', diffId);
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function muteDiff(diffId: string, ruleId?: string) {
    loading.value = true;
    error.value = null;

    try {
      // TODO: Implement API call when backend endpoint is available
      // await api.muteDiff(diffId, ruleId);
      console.log('Mute diff:', diffId, 'with rule:', ruleId);
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function setFilters(newFilters: DiffFilter) {
    filters.value = { ...newFilters };
  }

  function clearFilters() {
    filters.value = {};
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    filters,
    loading,
    error,

    // Actions
    acceptDiff,
    muteDiff,
    setFilters,
    clearFilters,
    clearError,
  };
});
