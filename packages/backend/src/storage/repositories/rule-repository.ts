/**
 * Rule Repository Types
 * Type definitions for rule repository operations
 */

import type { MuteRule, RuleCondition, RuleScope } from '@gander-tools/diff-voyager-shared';
import type { Database } from 'better-sqlite3';

export interface CreateRuleInput {
  projectId?: string;
  name: string;
  description?: string;
  scope: RuleScope;
  active: boolean;
  conditions: RuleCondition[];
}

export interface UpdateRuleInput {
  name?: string;
  description?: string;
  active?: boolean;
  conditions?: RuleCondition[];
}

export interface RuleEntity extends Omit<MuteRule, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Legacy SQL implementation (for backward compatibility during migration)
 */
export class RuleRepository {
  constructor(_db: Database) {}

  // Legacy methods will be implemented if needed
  // Currently using Drizzle ORM implementation
}
