/**
 * Domain Models
 *
 * This module exports all domain model classes for the frontend.
 * These models provide business logic and helper methods on top of
 * the shared TypeScript interfaces.
 *
 * @example
 * ```ts
 * import { ProjectModel, RunModel } from '@/models';
 *
 * const project = ProjectModel.create({
 *   name: 'My Project',
 *   baseUrl: 'https://example.com'
 * });
 *
 * const run = RunModel.create({
 *   projectId: project.id,
 *   baselineId: baseline.id,
 *   config: runConfig
 * });
 * ```
 */

// Model classes
export { ProjectModel } from './Project';
export { BaselineModel } from './Baseline';
export { RunModel } from './Run';
export { PageModel } from './Page';
export { PageSnapshotModel } from './PageSnapshot';
export { DiffModel } from './Diff';
export { MuteRuleModel } from './MuteRule';

// Model-specific types
export type {
  ValidationResult as ProjectValidationResult,
  CreateProjectParams,
} from './Project';

export type {
  ValidationResult as BaselineValidationResult,
  CreateBaselineParams,
} from './Baseline';

export type {
  ValidationResult as RunValidationResult,
  CreateRunParams,
} from './Run';

export type {
  ValidationResult as PageValidationResult,
  CreatePageParams,
} from './Page';

export type {
  ValidationResult as PageSnapshotValidationResult,
  CreatePageSnapshotParams,
} from './PageSnapshot';

export type {
  ValidationResult as DiffValidationResult,
  CreateDiffParams,
} from './Diff';

export type {
  ValidationResult as MuteRuleValidationResult,
  CreateMuteRuleParams,
} from './MuteRule';

// Re-export shared types for convenience
export type {
  Project,
  ProjectConfig,
  CrawlConfig,
  ScopeRules,
  IgnoreFilters,
  ViewportConfig,
  ThresholdConfig,
  Baseline,
  Run,
  RunConfig,
  RunStatistics,
  RunStatus,
  Page,
  PageSnapshot,
  PageStatus,
  SeoData,
  PerformanceData,
  Diff,
  Change,
  DiffType,
  DiffSeverity,
  DiffStatus,
  MuteRule,
  RuleScope,
  RunProfile,
  ExportManifest,
} from '@gander-tools/diff-voyager-shared';
