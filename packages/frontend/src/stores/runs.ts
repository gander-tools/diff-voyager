import { RunStatus } from '@gander-tools/diff-voyager-shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { CreateRunRequest, RunDetailsResponse } from '@/services/api';
import { createRun, getRun, listRuns } from '@/services/api';

/**
 * Runs Store
 * Manages run state including list, current run, polling
 */
export const useRunsStore = defineStore('runs', () => {
  // State
  const runs = ref<Record<string, RunDetailsResponse[]>>({}); // Keyed by projectId
  const currentRun = ref<RunDetailsResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null);

  // Computed
  const isPolling = computed(() => pollingInterval.value !== null);

  // Actions
  async function fetchRuns(projectId: string, query?: { limit?: number; offset?: number }) {
    loading.value = true;
    error.value = null;

    try {
      const projectRuns = await listRuns(projectId, query);
      runs.value[projectId] = projectRuns;
      return projectRuns;
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRun(runId: string) {
    loading.value = true;
    error.value = null;

    try {
      const run = await getRun(runId);
      currentRun.value = run;
      return run;
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createNewRun(projectId: string, request: CreateRunRequest) {
    loading.value = true;
    error.value = null;

    try {
      const response = await createRun(projectId, request);
      // Refresh runs list after creation
      await fetchRuns(projectId);
      return response;
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function startPolling(runId: string, intervalMs = 3000) {
    // Stop existing polling if any
    stopPolling();

    // Start new polling
    pollingInterval.value = setInterval(async () => {
      try {
        const run = await getRun(runId);
        currentRun.value = run;

        // Stop polling if run is completed
        if (run.status === RunStatus.COMPLETED) {
          stopPolling();
        }
      } catch (err) {
        console.error('Polling error:', err);
        // Don't stop polling on errors, might be transient
      }
    }, intervalMs);

    // Also fetch immediately
    fetchRun(runId);
  }

  function stopPolling() {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
  }

  function clearCurrentRun() {
    currentRun.value = null;
    stopPolling();
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    runs,
    currentRun,
    loading,
    error,

    // Computed
    isPolling,

    // Actions
    fetchRuns,
    fetchRun,
    createNewRun,
    startPolling,
    stopPolling,
    clearCurrentRun,
    clearError,
  };
});
