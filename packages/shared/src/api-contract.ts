/**
 * @ts-rest API Contract for Diff Voyager
 *
 * This is the SINGLE SOURCE OF TRUTH for all API routes.
 * Both backend (Fastify) and frontend (@ts-rest/core client) use this contract.
 */

import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// ============================================================================
// ZOD SCHEMAS - Shared validation
// ============================================================================

// Common schemas
export const uuidSchema = z.string().uuid();
export const urlSchema = z.string().url();
export const timestampSchema = z.string().datetime();

// Viewport configuration
export const viewportSchema = z.object({
  width: z.number().int().min(320),
  height: z.number().int().min(240),
});

// Path parameters
export const projectIdParamSchema = z.object({
  projectId: uuidSchema,
});

export const runIdParamSchema = z.object({
  runId: uuidSchema,
});

export const pageIdParamSchema = z.object({
  pageId: uuidSchema,
});

export const taskIdParamSchema = z.object({
  taskId: uuidSchema,
});

export const snapshotIdParamSchema = z.object({
  snapshotId: uuidSchema,
});

// Request schemas
export const createScanBodySchema = z.object({
  url: urlSchema,
  sync: z.boolean().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  crawl: z.boolean().optional(),
  maxPages: z.number().int().positive().optional(),
  viewport: viewportSchema.optional(),
  collectHar: z.boolean().optional(),
  waitAfterLoad: z.number().int().min(0).optional(),
  visualDiffThreshold: z.number().min(0).max(1).optional(),
});

export const getProjectQuerySchema = z.object({
  includePages: z.coerce.boolean().optional(),
  pageLimit: z.coerce.number().int().min(1).optional(),
  pageOffset: z.coerce.number().int().min(0).optional(),
});

export const listProjectsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const listRunsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const createRunBodySchema = z.object({
  url: urlSchema,
  viewport: viewportSchema.optional(),
  collectHar: z.boolean().optional(),
  waitAfterLoad: z.number().int().min(0).optional(),
});

// Response schemas
export const paginationSchema = z.object({
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
  hasMore: z.boolean(),
});

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export const projectConfigSchema = z.object({
  crawl: z.boolean(),
  viewport: viewportSchema,
  visualDiffThreshold: z.number().min(0).max(1),
  maxPages: z.number().int().optional(),
});

export const statisticsSchema = z.object({
  totalPages: z.number().int(),
  completedPages: z.number().int(),
  errorPages: z.number().int(),
  changedPages: z.number().int(),
  unchangedPages: z.number().int(),
  totalDifferences: z.number().int(),
  criticalDifferences: z.number().int(),
  acceptedDifferences: z.number().int(),
  mutedDifferences: z.number().int(),
});

export const pageResponseSchema = z.object({
  id: uuidSchema,
  projectId: uuidSchema,
  url: z.string(),
  originalUrl: z.string(),
  status: z.string(),
  snapshotId: uuidSchema.optional(),
  httpStatus: z.number().int().optional(),
  capturedAt: timestampSchema.optional(),
  errorMessage: z.string().optional(),
  seoData: z.any().optional(), // TODO: Add detailed schema
  httpHeaders: z.record(z.string()).optional(),
  performanceData: z.any().optional(), // TODO: Add detailed schema
  artifacts: z
    .object({
      screenshotUrl: z.string().optional(),
      harUrl: z.string().optional(),
      htmlUrl: z.string().optional(),
    })
    .optional(),
  diff: z.any().nullable(), // TODO: Add detailed schema
});

export const projectDetailsSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  description: z.string(),
  baseUrl: urlSchema,
  config: projectConfigSchema,
  status: z.string(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  statistics: statisticsSchema,
  pages: z.array(pageResponseSchema),
  pagination: paginationSchema,
});

export const projectListItemSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  description: z.string(),
  baseUrl: urlSchema,
  status: z.string(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

// Run configuration
export const runConfigSchema = z.object({
  viewport: viewportSchema,
  captureScreenshots: z.boolean(),
  captureHar: z.boolean(),
});

// Run statistics
export const runStatisticsSchema = z.object({
  totalPages: z.number().int(),
  completedPages: z.number().int(),
  errorPages: z.number().int(),
});

export const runResponseSchema = z.object({
  id: uuidSchema,
  projectId: uuidSchema,
  isBaseline: z.boolean(),
  status: z.string(),
  createdAt: timestampSchema,
});

export const runDetailsSchema = z.object({
  id: uuidSchema,
  projectId: uuidSchema,
  isBaseline: z.boolean(),
  status: z.string(),
  createdAt: timestampSchema,
  config: runConfigSchema,
  statistics: runStatisticsSchema,
});

// Task status schema
export const taskStatusSchema = z.object({
  id: uuidSchema,
  type: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  createdAt: timestampSchema,
  startedAt: timestampSchema.optional(),
  completedAt: timestampSchema.optional(),
  attempts: z.number().int().optional(),
  error: z.string().optional(),
  payload: z.any().optional(),
});

// Page diff schema
export const pageDiffSchema = z.object({
  pageId: uuidSchema,
  hasChanges: z.boolean(),
  seoChanges: z.array(
    z.object({
      field: z.string(),
      baseline: z.string().optional(),
      current: z.string().optional(),
    }),
  ),
  headerChanges: z.array(
    z.object({
      header: z.string(),
      baseline: z.string().optional(),
      current: z.string().optional(),
    }),
  ),
  performanceChanges: z.array(
    z.object({
      metric: z.string(),
      baseline: z.number().optional(),
      current: z.number().optional(),
    }),
  ),
});

// Run pages list schema
export const runPagesListSchema = z.object({
  pages: z.array(pageResponseSchema),
  pagination: paginationSchema,
});

export const createScanAsyncResponseSchema = z.object({
  projectId: uuidSchema,
  status: z.string(),
  projectUrl: z.string(),
});

export const createRunResponseSchema = z.object({
  runId: uuidSchema,
  status: z.string(),
  runUrl: z.string(),
});

// List run pages query schema
export const listRunPagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  status: z.string().optional(),
});

// Retry snapshot response
export const retrySnapshotResponseSchema = z.object({
  snapshotId: uuidSchema,
  status: z.string(),
  message: z.string(),
});

// Retry run response
export const retryRunResponseSchema = z.object({
  runId: uuidSchema,
  status: z.string(),
  message: z.string(),
  retryCount: z.number().int(),
});

// Retry run query schema
export const retryRunQuerySchema = z.object({
  scope: z.enum(['failed', 'all']).optional().default('failed'),
});

// ============================================================================
// API CONTRACT - Single source of truth for all API routes
// ============================================================================

export const apiContract = c.router({
  // ========== SCANS ==========

  createScan: {
    method: 'POST',
    path: '/scans',
    responses: {
      200: projectDetailsSchema, // Sync mode - full project details
      202: createScanAsyncResponseSchema, // Async mode - projectId only
      400: errorResponseSchema,
    },
    body: createScanBodySchema,
    summary: 'Create a new scan or crawl',
  },

  // ========== PROJECTS ==========

  listProjects: {
    method: 'GET',
    path: '/projects',
    responses: {
      200: z.object({
        projects: z.array(projectListItemSchema),
        pagination: paginationSchema,
      }),
    },
    query: listProjectsQuerySchema,
    summary: 'List all projects with pagination',
  },

  getProject: {
    method: 'GET',
    path: '/projects/:projectId',
    responses: {
      200: projectDetailsSchema,
      404: errorResponseSchema,
    },
    pathParams: projectIdParamSchema,
    query: getProjectQuerySchema,
    summary: 'Get project details with pages and statistics',
  },

  deleteProject: {
    method: 'DELETE',
    path: '/projects/:projectId',
    responses: {
      204: z.void(),
      404: errorResponseSchema,
      400: errorResponseSchema,
    },
    pathParams: projectIdParamSchema,
    body: z.void(),
    summary: 'Delete a project and all associated data',
  },

  // ========== RUNS ==========

  listProjectRuns: {
    method: 'GET',
    path: '/projects/:projectId/runs',
    responses: {
      200: z.object({
        runs: z.array(runResponseSchema),
        pagination: paginationSchema,
      }),
      404: errorResponseSchema,
    },
    pathParams: projectIdParamSchema,
    query: listRunsQuerySchema,
    summary: 'List all runs for a project',
  },

  createProjectRun: {
    method: 'POST',
    path: '/projects/:projectId/runs',
    responses: {
      202: createRunResponseSchema,
      404: errorResponseSchema,
    },
    pathParams: projectIdParamSchema,
    body: createRunBodySchema,
    summary: 'Create a new comparison run for an existing project',
  },

  getRunDetails: {
    method: 'GET',
    path: '/runs/:runId',
    responses: {
      200: runDetailsSchema,
      404: errorResponseSchema,
    },
    pathParams: runIdParamSchema,
    summary: 'Get run details with config and statistics',
  },

  // ========== PAGES ==========

  getPageDetails: {
    method: 'GET',
    path: '/pages/:pageId',
    responses: {
      200: pageResponseSchema,
      404: errorResponseSchema,
    },
    pathParams: pageIdParamSchema,
    summary: 'Get page details with diffs and artifacts',
  },

  getPageDiff: {
    method: 'GET',
    path: '/pages/:pageId/diff',
    responses: {
      200: pageDiffSchema,
      404: errorResponseSchema,
    },
    pathParams: pageIdParamSchema,
    summary: 'Get page comparison diff between baseline and current',
  },

  listRunPages: {
    method: 'GET',
    path: '/runs/:runId/pages',
    responses: {
      200: runPagesListSchema,
      404: errorResponseSchema,
      400: errorResponseSchema,
    },
    pathParams: runIdParamSchema,
    query: listRunPagesQuerySchema,
    summary: 'List all pages in a run with pagination',
  },

  // ========== SNAPSHOTS ==========

  retrySnapshot: {
    method: 'POST',
    path: '/snapshots/:snapshotId/retry',
    responses: {
      202: retrySnapshotResponseSchema,
      404: errorResponseSchema,
      400: errorResponseSchema,
    },
    pathParams: snapshotIdParamSchema,
    body: z.void(),
    summary: 'Retry capturing a failed snapshot',
  },

  // ========== RETRY ==========

  retryRun: {
    method: 'POST',
    path: '/runs/:runId/retry',
    responses: {
      202: retryRunResponseSchema,
      404: errorResponseSchema,
      400: errorResponseSchema,
    },
    pathParams: runIdParamSchema,
    query: retryRunQuerySchema,
    body: z.void(),
    summary: 'Retry snapshots in a run (all or only failed)',
  },

  // ========== TASKS ==========

  getTaskStatus: {
    method: 'GET',
    path: '/tasks/:taskId',
    responses: {
      200: taskStatusSchema,
      404: errorResponseSchema,
    },
    pathParams: taskIdParamSchema,
    summary: 'Get task status and details',
  },

  // TODO: Add artifacts endpoints
});

// Export type inference for use in backend and frontend
export type ApiContract = typeof apiContract;
