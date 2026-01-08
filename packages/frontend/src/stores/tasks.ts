import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { TaskDetailsResponse } from '@/services/api';
import { getTask, pollTask } from '@/services/api';

/**
 * Tasks Store
 * Manages task queue and polling state
 */
export const useTasksStore = defineStore('tasks', () => {
  // State
  const tasks = ref<Record<string, TaskDetailsResponse>>({});
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Actions
  async function fetchTask(taskId: string) {
    loading.value = true;
    error.value = null;

    try {
      const task = await getTask(taskId);
      tasks.value[taskId] = task;
      return task;
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function pollTaskUntilComplete(taskId: string, intervalMs = 3000, maxAttempts = 100) {
    loading.value = true;
    error.value = null;

    try {
      const task = await pollTask(taskId, intervalMs, maxAttempts);
      tasks.value[taskId] = task;
      return task;
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function getTaskStatus(taskId: string) {
    return tasks.value[taskId]?.status || null;
  }

  function clearTask(taskId: string) {
    delete tasks.value[taskId];
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    tasks,
    loading,
    error,

    // Actions
    fetchTask,
    pollTaskUntilComplete,
    getTaskStatus,
    clearTask,
    clearError,
  };
});
