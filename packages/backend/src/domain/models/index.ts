/**
 * Domain Models - Business Logic Layer
 *
 * This module exports all domain model classes that encapsulate
 * the business logic for Diff Voyager's core entities.
 *
 * All models follow TDD principles and provide:
 * - Factory methods for creation
 * - Validation logic
 * - State transitions
 * - Serialization/deserialization
 */

export { ProjectModel } from './Project.js';
export type { CreateProjectInput, UpdateConfigInput } from './Project.js';

export { RunModel } from './Run.js';
export type { CreateRunInput } from './Run.js';

export { PageModel } from './Page.js';
export type { CreatePageInput } from './Page.js';

export { PageSnapshotModel } from './PageSnapshot.js';
export type { CreatePageSnapshotInput } from './PageSnapshot.js';

export { DiffModel } from './Diff.js';
export type { CreateDiffInput, CreateChangeInput } from './Diff.js';

export { MuteRuleModel } from './MuteRule.js';
export type { CreateMuteRuleInput } from './MuteRule.js';
