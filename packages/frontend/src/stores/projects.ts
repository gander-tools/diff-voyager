import type { CreateScanRequest, ProjectDetailsResponse } from '@gander-tools/diff-voyager-shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { createScan, getProject, listProjects } from '@/services/api';

/**
 * Projects Store
 * Manages project state including list, current project, loading states
 */
export const useProjectsStore = defineStore('projects', () => {
  // State
  const projects = ref<ProjectDetailsResponse[]>([]);
  const currentProject = ref<ProjectDetailsResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const projectsCount = computed(() => projects.value.length);
  const hasProjects = computed(() => projects.value.length > 0);

  // Actions
  async function fetchProjects(query?: { limit?: number; offset?: number }) {
    loading.value = true;
    error.value = null;

    try {
      projects.value = await listProjects(query);
      return projects.value;
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProject(
    projectId: string,
    query?: { includePages?: boolean; pageLimit?: number; pageOffset?: number },
  ) {
    loading.value = true;
    error.value = null;

    try {
      const project = await getProject(projectId, query);
      currentProject.value = project;
      return project;
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createProject(request: CreateScanRequest) {
    loading.value = true;
    error.value = null;

    try {
      const response = await createScan(request);
      // Refresh projects list after creation
      await fetchProjects();
      return response;
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearCurrentProject() {
    currentProject.value = null;
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    projects,
    currentProject,
    loading,
    error,

    // Computed
    projectsCount,
    hasProjects,

    // Actions
    fetchProjects,
    fetchProject,
    createProject,
    clearCurrentProject,
    clearError,
  };
});
