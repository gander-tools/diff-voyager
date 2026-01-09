/**
 * Projects Pinia Store
 * Manages project state with CRUD operations using @ts-rest client
 */

import { apiContract } from '@gander-tools/diff-voyager-shared';
import { initClient } from '@ts-rest/core';
import { defineStore } from 'pinia';
import type { CreateProjectInput } from '../utils/validators';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Initialize @ts-rest client
const client = initClient(apiContract, {
  baseUrl: API_BASE_URL,
  baseHeaders: {},
});

/**
 * Project entity (from list endpoint)
 */
export interface ProjectListItem {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Full project details (from get endpoint)
 */
export interface ProjectDetails extends ProjectListItem {
  config: {
    crawl: boolean;
    viewport: { width: number; height: number };
    visualDiffThreshold: number;
    maxPages?: number;
  };
  statistics: {
    totalPages: number;
    completedPages: number;
    errorPages: number;
    changedPages: number;
    unchangedPages: number;
    totalDifferences: number;
    criticalDifferences: number;
    acceptedDifferences: number;
    mutedDifferences: number;
  };
}

/**
 * Pagination state
 */
export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Fetch projects options
 */
export interface FetchProjectsOptions {
  limit?: number;
  offset?: number;
}

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    // Project storage (Map for O(1) lookup)
    items: new Map<string, ProjectListItem>(),
    list: [] as string[], // Ordered IDs

    // Current project (for detail view)
    currentId: null as string | null,
    currentDetails: null as ProjectDetails | null,

    // Loading state
    loading: false,
    error: null as string | null,

    // Pagination
    pagination: {
      total: 0,
      limit: 50,
      offset: 0,
      hasMore: false,
    } as Pagination,
  }),

  getters: {
    /**
     * Get ordered list of projects
     */
    projectList: (state): ProjectListItem[] => {
      return state.list.map((id) => state.items.get(id)!).filter(Boolean);
    },

    /**
     * Get current project (from list or details)
     */
    currentProject: (state): ProjectListItem | ProjectDetails | null => {
      if (state.currentDetails) {
        return state.currentDetails;
      }
      if (state.currentId) {
        return state.items.get(state.currentId) || null;
      }
      return null;
    },

    /**
     * Get recent projects (newest first)
     */
    recentProjects:
      (state) =>
      (limit = 5): ProjectListItem[] => {
        return state.list
          .map((id) => state.items.get(id)!)
          .filter(Boolean)
          .slice(0, limit);
      },

    /**
     * Get project by ID
     */
    getById:
      (state) =>
      (id: string): ProjectListItem | undefined => {
        return state.items.get(id);
      },

    /**
     * Check if loading
     */
    isLoading: (state): boolean => state.loading,

    /**
     * Check if has error
     */
    hasError: (state): boolean => state.error !== null,

    /**
     * Get total projects count
     */
    totalProjects: (state): number => state.pagination.total,
  },

  actions: {
    /**
     * Fetch projects list with pagination
     */
    async fetchProjects(options: FetchProjectsOptions = {}) {
      this.loading = true;
      this.error = null;

      try {
        const result = await client.listProjects({
          query: {
            limit: options.limit || 50,
            offset: options.offset || 0,
          },
        });

        if (result.status === 200) {
          // Update items map
          this.items.clear();
          this.list = [];

          for (const project of result.body.projects) {
            const projectItem: ProjectListItem = {
              id: project.id,
              name: project.name,
              description: project.description,
              baseUrl: project.baseUrl,
              status: project.status,
              createdAt: new Date(project.createdAt),
              updatedAt: new Date(project.updatedAt),
            };

            this.items.set(project.id, projectItem);
            this.list.push(project.id);
          }

          // Update pagination
          this.pagination = {
            total: result.body.pagination.total,
            limit: result.body.pagination.limit,
            offset: result.body.pagination.offset,
            hasMore: result.body.pagination.hasMore,
          };
        } else {
          throw new Error('Failed to fetch projects');
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Unknown error';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Fetch single project by ID with full details
     */
    async fetchProjectById(id: string) {
      this.loading = true;
      this.error = null;

      try {
        const result = await client.getProject({
          params: { projectId: id },
          query: { includePages: false },
        });

        if (result.status === 200) {
          const project = result.body;

          // Update basic info in items map
          const projectItem: ProjectListItem = {
            id: project.id,
            name: project.name,
            description: project.description,
            baseUrl: project.baseUrl,
            status: project.status,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt),
          };

          this.items.set(project.id, projectItem);

          // Update current details
          this.currentId = project.id;
          this.currentDetails = {
            ...projectItem,
            config: project.config,
            statistics: project.statistics,
          };

          // Add to list if not present
          if (!this.list.includes(project.id)) {
            this.list.unshift(project.id);
          }
        } else if (result.status === 404) {
          throw new Error('Project not found');
        } else {
          throw new Error('Failed to fetch project');
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Unknown error';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Create new project (sync mode for immediate result)
     */
    async createProject(input: CreateProjectInput): Promise<ProjectDetails> {
      this.loading = true;
      this.error = null;

      try {
        const result = await client.createScan({
          body: {
            name: input.name,
            url: input.url,
            description: input.description,
            sync: true, // Request sync mode for immediate result
            crawl: input.crawl,
            maxPages: input.maxPages,
            viewport: input.viewport,
            collectHar: input.collectHar,
            waitAfterLoad: input.waitAfterLoad,
            visualDiffThreshold: input.visualDiffThreshold,
          },
        });

        if (result.status === 200) {
          const project = result.body;

          // Add to store
          const projectItem: ProjectListItem = {
            id: project.id,
            name: project.name,
            description: project.description,
            baseUrl: project.baseUrl,
            status: project.status,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt),
          };

          this.items.set(project.id, projectItem);
          this.list.unshift(project.id); // Add to start

          // Update pagination total
          this.pagination.total += 1;

          // Return full details
          return {
            ...projectItem,
            config: project.config,
            statistics: project.statistics,
          };
        }

        throw new Error('Failed to create project');
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Unknown error';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Delete project by ID
     */
    async deleteProject(id: string): Promise<void> {
      this.loading = true;
      this.error = null;

      try {
        const result = await client.deleteProject({
          params: { projectId: id },
        });

        if (result.status === 204) {
          // Remove from store
          this.items.delete(id);
          this.list = this.list.filter((projectId) => projectId !== id);

          // Clear current if deleted
          if (this.currentId === id) {
            this.currentId = null;
            this.currentDetails = null;
          }

          // Update pagination total
          this.pagination.total = Math.max(0, this.pagination.total - 1);
        } else if (result.status === 404) {
          throw new Error('Project not found');
        } else {
          throw new Error('Failed to delete project');
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Unknown error';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Clear current project
     */
    clearCurrent() {
      this.currentId = null;
      this.currentDetails = null;
    },

    /**
     * Clear all state
     */
    reset() {
      this.items.clear();
      this.list = [];
      this.currentId = null;
      this.currentDetails = null;
      this.loading = false;
      this.error = null;
      this.pagination = {
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      };
    },
  },
});
