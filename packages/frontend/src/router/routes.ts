import { z } from 'zod';

/**
 * Type-safe route builders for Vue Router
 *
 * Eliminates hardcoded paths and provides:
 * - Compile-time type checking for route parameters
 * - Runtime validation with Zod
 * - IDE autocomplete for routes and parameters
 *
 * Usage:
 * ```typescript
 * import { vueRoutes } from '@/router/routes';
 *
 * // Simple route
 * router.push(vueRoutes.dashboard());
 *
 * // Route with parameters
 * router.push(vueRoutes.projectDetail({ projectId: 'abc-123' }));
 * ```
 */

// Zod schemas for route parameters
const uuidSchema = z.string().uuid();
const projectIdSchema = z.object({
  projectId: uuidSchema,
});
const runIdSchema = z.object({
  runId: uuidSchema,
});
const pageIdSchema = z.object({
  pageId: uuidSchema,
});

/**
 * Type-safe route builder helpers
 */
export const vueRoutes = {
  /**
   * Dashboard route: /
   */
  dashboard: (): string => '/',

  /**
   * Projects list route: /projects
   */
  projects: (): string => '/projects',

  /**
   * Create new project route: /projects/new
   */
  projectCreate: (): string => '/projects/new',

  /**
   * Project detail route: /projects/:projectId
   */
  projectDetail: (params: { projectId: string }): string => {
    const validated = projectIdSchema.parse(params);
    return `/projects/${validated.projectId}`;
  },

  /**
   * Runs list for project route: /projects/:projectId/runs
   */
  runList: (params: { projectId: string }): string => {
    const validated = projectIdSchema.parse(params);
    return `/projects/${validated.projectId}/runs`;
  },

  /**
   * Create new run for project route: /projects/:projectId/runs/new
   */
  runCreate: (params: { projectId: string }): string => {
    const validated = projectIdSchema.parse(params);
    return `/projects/${validated.projectId}/runs/new`;
  },

  /**
   * Run detail route: /runs/:runId
   */
  runDetail: (params: { runId: string }): string => {
    const validated = runIdSchema.parse(params);
    return `/runs/${validated.runId}`;
  },

  /**
   * Page detail route: /pages/:pageId
   */
  pageDetail: (params: { pageId: string }): string => {
    const validated = pageIdSchema.parse(params);
    return `/pages/${validated.pageId}`;
  },

  /**
   * Rules list route: /rules
   */
  rules: (): string => '/rules',

  /**
   * Create new rule route: /rules/new
   */
  ruleCreate: (): string => '/rules/new',

  /**
   * Settings route: /settings
   */
  settings: (): string => '/settings',

  /**
   * Not found route: /404
   */
  notFound: (): string => '/404',
};

/**
 * Type-safe route names for Vue Router
 *
 * Use with router.push({ name: RouteNames.DASHBOARD })
 */
export const RouteNames = {
  DASHBOARD: 'dashboard',
  PROJECTS: 'projects',
  PROJECT_CREATE: 'project-create',
  PROJECT_DETAIL: 'project-detail',
  RUNS: 'runs',
  RUN_CREATE: 'run-create',
  RUN_DETAIL: 'run-detail',
  PAGE_DETAIL: 'page-detail',
  RULES: 'rules',
  RULE_CREATE: 'rule-create',
  SETTINGS: 'settings',
  NOT_FOUND: 'not-found',
} as const;

export type RouteName = (typeof RouteNames)[keyof typeof RouteNames];
