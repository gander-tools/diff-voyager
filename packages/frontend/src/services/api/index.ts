/**
 * API client exports
 *
 * Centralized API client for the Diff Voyager frontend.
 * All backend communication goes through these typed functions.
 */

export type { FetchOptions } from 'ofetch';
// Artifacts API
export {
  getArtifactUrl,
  getBaselineScreenshot,
  getDiffImage,
  getHarFile,
  getHtml,
  getScreenshot,
} from './artifacts';
// Client and error types
export { ApiError, apiClient, RateLimitError } from './client';
export type {
  HeaderChangeResponse,
  PageDetailsResponse,
  PageDiffResponse,
  PerformanceChangeResponse,
  SeoChangeResponse,
  VisualDiffResponse,
} from './pages';
// Pages API
export {
  getPage,
  getPageDiff,
} from './pages';
export type {
  GetProjectQuery,
  ListProjectsQuery,
} from './projects';
// Projects API
export {
  createScan,
  getProject,
  listProjects,
} from './projects';
export type {
  CreateRuleInput,
  Rule,
} from './rules';
// Rules API
export { rulesApi } from './rules';
export type {
  CreateRunRequest,
  CreateRunResponse,
  ListRunPagesQuery,
  ListRunsQuery,
  RunDetailsResponse,
  RunPageResponse,
} from './runs';
// Runs API
export {
  createRun,
  getRun,
  listRunPages,
  listRuns,
  retryRun,
} from './runs';
// Snapshots API
export { retrySnapshot } from './snapshots';
export type {
  TaskDetailsResponse,
  TaskStatus,
} from './tasks';
// Tasks API
export {
  getTask,
  pollTask,
} from './tasks';
