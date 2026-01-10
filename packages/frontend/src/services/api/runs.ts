import type { RunProfile } from '@gander-tools/diff-voyager-shared';
import { get, tsRestClient } from './client';

/**
 * Request body for creating a run
 */
export interface CreateRunRequest {
  url: string;
  profile?: RunProfile;
  viewport?: {
    width: number;
    height: number;
  };
  collectHar?: boolean;
  waitAfterLoad?: number;
}

/**
 * Response from creating a run
 */
export interface CreateRunResponse {
  runId: string;
  statusUrl: string;
}

/**
 * Run details response
 */
export interface RunDetailsResponse {
  id: string;
  projectId: string;
  baselineId: string;
  status: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  statistics: {
    totalPages: number;
    completedPages: number;
    errorPages: number;
    diffsCount: number;
  };
}

/**
 * Query parameters for listing runs
 */
export interface ListRunsQuery {
  limit?: number;
  offset?: number;
}

/**
 * Create a new comparison run
 * POST /projects/:projectId/runs
 *
 * Uses @ts-rest client for type-safe API calls
 */
export async function createRun(
  projectId: string,
  request: CreateRunRequest,
): Promise<CreateRunResponse> {
  const result = await tsRestClient.createProjectRun({
    params: { projectId },
    body: request,
  });

  if (result.status === 202) {
    return result.body as unknown as CreateRunResponse;
  }

  const errorBody = result.body as { message?: string };
  throw new Error(errorBody.message || 'Failed to create run');
}

/**
 * List all runs for a project
 * GET /projects/:projectId/runs
 *
 * Uses @ts-rest client for type-safe API calls
 */
export async function listRuns(projectId: string, query?: ListRunsQuery) {
  const result = await tsRestClient.listProjectRuns({
    params: { projectId },
    query: {
      limit: query?.limit,
      offset: query?.offset,
    },
  });

  if (result.status === 200) {
    return result.body.runs as unknown as RunDetailsResponse[];
  }

  const errorBody = result.body as { message?: string };
  throw new Error(errorBody.message || 'Failed to list runs');
}

/**
 * Get run details by ID
 * GET /runs/:runId
 *
 * Uses @ts-rest client for type-safe API calls
 */
export async function getRun(runId: string): Promise<RunDetailsResponse> {
  const result = await tsRestClient.getRunDetails({
    params: { runId },
  });

  if (result.status === 200) {
    return result.body as unknown as RunDetailsResponse;
  }

  const errorBody = result.body as { message?: string };
  throw new Error(errorBody.message || 'Failed to get run');
}

/**
 * Query parameters for listing pages in a run
 */
export interface ListRunPagesQuery {
  limit?: number;
  offset?: number;
  status?: string;
}

/**
 * Page in run response
 */
export interface RunPageResponse {
  id: string;
  url: string;
  status: string;
  httpStatus?: number;
}

/**
 * List pages in a run
 * GET /runs/:runId/pages
 */
export function listRunPages(runId: string, query?: ListRunPagesQuery): Promise<RunPageResponse[]> {
  const params = new URLSearchParams();
  if (query?.limit) params.append('limit', query.limit.toString());
  if (query?.offset) params.append('offset', query.offset.toString());
  if (query?.status) params.append('status', query.status);

  const queryString = params.toString();
  return get<RunPageResponse[]>(`/runs/${runId}/pages${queryString ? `?${queryString}` : ''}`);
}

/**
 * Retry snapshots in a run (all or only failed)
 */
export async function retryRun(runId: string, scope: 'failed' | 'all' = 'failed') {
  const result = await tsRestClient.retryRun({
    params: { runId },
    query: { scope },
    body: undefined,
  });

  if (result.status === 202) {
    return result.body;
  }

  const errorBody = result.body as { error?: { message?: string } };
  throw new Error(errorBody.error?.message || 'Failed to retry run');
}
