import type {
  CreateScanAsyncResponse,
  CreateScanRequest,
  ProjectDetailsResponse,
} from '@gander-tools/diff-voyager-shared';
import { get, post } from './client';

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
 */
export function createScan(request: CreateScanRequest): Promise<CreateScanAsyncResponse> {
  return post<CreateScanAsyncResponse>('/scans', request);
}

/**
 * List all projects
 * GET /projects
 */
export function listProjects(query?: ListProjectsQuery): Promise<ProjectDetailsResponse[]> {
  const params = new URLSearchParams();
  if (query?.limit) params.append('limit', query.limit.toString());
  if (query?.offset) params.append('offset', query.offset.toString());

  const queryString = params.toString();
  return get<ProjectDetailsResponse[]>(`/projects${queryString ? `?${queryString}` : ''}`);
}

/**
 * Get project details by ID
 * GET /projects/:projectId
 */
export function getProject(
  projectId: string,
  query?: GetProjectQuery,
): Promise<ProjectDetailsResponse> {
  const params = new URLSearchParams();
  if (query?.includePages !== undefined)
    params.append('includePages', query.includePages.toString());
  if (query?.pageLimit) params.append('pageLimit', query.pageLimit.toString());
  if (query?.pageOffset) params.append('pageOffset', query.pageOffset.toString());

  const queryString = params.toString();
  return get<ProjectDetailsResponse>(
    `/projects/${projectId}${queryString ? `?${queryString}` : ''}`,
  );
}
