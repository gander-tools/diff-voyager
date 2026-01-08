import type { CreateScanRequest, ProjectDetailsResponse } from '@gander-tools/diff-voyager-shared';
import { tsRestClient } from './client';

/**
 * Query parameters for listing projects
 */
export interface ListProjectsQuery {
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for getting project details
 */
export interface GetProjectQuery {
  includePages?: boolean;
  pageLimit?: number;
  pageOffset?: number;
}

/**
 * Create a new scan (project)
 * POST /scans
 *
 * Uses @ts-rest client for type-safe API calls
 */
export async function createScan(request: CreateScanRequest) {
  const result = await tsRestClient.createScan({ body: request });

  if (result.status === 200) {
    return result.body;
  }

  if (result.status === 202) {
    return result.body;
  }

  const errorBody = result.body as { message?: string };
  throw new Error(errorBody.message || 'Failed to create scan');
}

/**
 * List all projects
 * GET /projects
 *
 * Uses @ts-rest client for type-safe API calls
 */
export async function listProjects(query?: ListProjectsQuery) {
  const result = await tsRestClient.listProjects({
    query: {
      limit: query?.limit,
      offset: query?.offset,
    },
  });

  if (result.status === 200) {
    return result.body.projects;
  }

  const errorBody = result.body as { message?: string };
  throw new Error(errorBody.message || 'Failed to list projects');
}

/**
 * Get project details by ID
 * GET /projects/:projectId
 *
 * Uses @ts-rest client for type-safe API calls
 */
export async function getProject(
  projectId: string,
  query?: GetProjectQuery,
): Promise<ProjectDetailsResponse> {
  const result = await tsRestClient.getProject({
    params: { projectId },
    query: {
      includePages: query?.includePages,
      pageLimit: query?.pageLimit,
      pageOffset: query?.pageOffset,
    },
  });

  if (result.status === 200) {
    return result.body as unknown as ProjectDetailsResponse;
  }

  const errorBody = result.body as { message?: string };
  throw new Error(errorBody.message || 'Failed to get project');
}
