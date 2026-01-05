/**
 * Status of a run
 */
export enum RunStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  INTERRUPTED = 'interrupted',
  COMPLETED = 'completed',
}

/**
 * Status of a page within a run
 */
export enum PageStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PARTIAL = 'partial',
  ERROR = 'error',
}

/**
 * Types of differences that can be detected
 */
export enum DiffType {
  SEO = 'seo',
  VISUAL = 'visual',
  CONTENT = 'content',
  PERFORMANCE = 'performance',
  HTTP_STATUS = 'http_status',
  HEADERS = 'headers',
}

/**
 * Business status of a detected difference
 */
export enum DiffStatus {
  NEW = 'new',
  ACCEPTED = 'accepted',
  MUTED = 'muted',
}

/**
 * Severity level of a difference
 */
export enum DiffSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Scope of a mute rule
 */
export enum RuleScope {
  GLOBAL = 'global',
  PROJECT = 'project',
}

/**
 * Run profile types (which artifacts to collect)
 */
export enum RunProfile {
  VISUAL_SEO = 'visual_seo',
  FULL = 'full',
  MINIMAL = 'minimal',
}
