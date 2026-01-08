import type { RunProfile } from '@gander-tools/diff-voyager-shared';
import { get, post } from './client';

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
 */
export function createRun(
  projectId: string,
  request: CreateRunRequest,
): Promise<CreateRunResponse> {
  return post<CreateRunResponse>(`/projects/${projectId}/runs`, request);
}

/**
 * List all runs for a project
 * GET /projects/:projectId/runs
 */
export function listRuns(projectId: string, query?: ListRunsQuery): Promise<RunDetailsResponse[]> {
  const params = new URLSearchParams();
  if (query?.limit) params.append('limit', query.limit.toString());
  if (query?.offset) params.append('offset', query.offset.toString());

  const queryString = params.toString();
  return get<RunDetailsResponse[]>(
    `/projects/${projectId}/runs${queryString ? `?${queryString}` : ''}`,
  );
}

/**
 * Get run details by ID
 * GET /runs/:runId
 */
export function getRun(runId: string): Promise<RunDetailsResponse> {
  return get<RunDetailsResponse>(`/runs/${runId}`);
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
