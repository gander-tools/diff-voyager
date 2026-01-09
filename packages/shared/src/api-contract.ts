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
const uuidSchema = z.string().uuid();
const urlSchema = z.string().url();
const timestampSchema = z.string().datetime();

// Viewport configuration
const viewportSchema = z.object({
  width: z.number().int().min(320),
  height: z.number().int().min(240),
});

// Path parameters
const projectIdParamSchema = z.object({
  projectId: uuidSchema,
});

const runIdParamSchema = z.object({
  runId: uuidSchema,
});

const pageIdParamSchema = z.object({
  pageId: uuidSchema,
});

// Request schemas
const createScanBodySchema = z.object({
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

const getProjectQuerySchema = z.object({
  includePages: z.coerce.boolean().optional(),
  pageLimit: z.coerce.number().int().min(1).optional(),
  pageOffset: z.coerce.number().int().min(0).optional(),
});

const listProjectsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const listRunsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const createRunBodySchema = z.object({
  url: urlSchema,
  viewport: viewportSchema.optional(),
  collectHar: z.boolean().optional(),
  waitAfterLoad: z.number().int().min(0).optional(),
});

// Response schemas
const paginationSchema = z.object({
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
  hasMore: z.boolean(),
});

const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

const projectConfigSchema = z.object({
  crawl: z.boolean(),
  viewport: viewportSchema,
  visualDiffThreshold: z.number(),
  maxPages: z.number().int().optional(),
});

const statisticsSchema = z.object({
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

const pageResponseSchema = z.object({
  id: uuidSchema,
  projectId: uuidSchema,
  url: z.string(),
  originalUrl: z.string(),
  status: z.string(),
  httpStatus: z.number().int().optional(),
  capturedAt: timestampSchema.optional(),
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

const projectDetailsSchema = z.object({
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

const projectListItemSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  description: z.string(),
  baseUrl: urlSchema,
  status: z.string(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

const runResponseSchema = z.object({
  id: uuidSchema,
  projectId: uuidSchema,
  isBaseline: z.boolean(),
  status: z.string(),
  createdAt: timestampSchema,
});

const createScanAsyncResponseSchema = z.object({
  projectId: uuidSchema,
  status: z.string(),
  projectUrl: z.string(),
});

const createRunResponseSchema = z.object({
  runId: uuidSchema,
  status: z.string(),
  runUrl: z.string(),
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
      200: z.object({
        id: uuidSchema,
        projectId: uuidSchema,
        isBaseline: z.boolean(),
        status: z.string(),
        createdAt: timestampSchema,
        // TODO: Add more detailed run response fields
      }),
      404: errorResponseSchema,
    },
    pathParams: runIdParamSchema,
    summary: 'Get run details',
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

  // TODO: Add artifacts endpoints
  // TODO: Add tasks endpoints
});

// Export type inference for use in backend and frontend
export type ApiContract = typeof apiContract;
