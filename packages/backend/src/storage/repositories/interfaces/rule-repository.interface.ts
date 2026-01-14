/**
 * Rule Repository Interface
 * Defines contract for rule data access operations
 */

import type { CreateRuleInput, RuleEntity, UpdateRuleInput } from '../rule-repository.js';

export interface IRuleRepository {
  /**
   * Create a new rule
   */
  create(input: CreateRuleInput): Promise<RuleEntity>;

  /**
   * Find a rule by ID
   */
  findById(id: string): Promise<RuleEntity | null>;

  /**
   * Find all rules with optional filtering and pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
    projectId?: string;
    scope?: 'global' | 'project';
    active?: boolean;
  }): Promise<{ rules: RuleEntity[]; total: number }>;

  /**
   * Update an existing rule
   */
  update(id: string, input: UpdateRuleInput): Promise<RuleEntity>;

  /**
   * Delete a rule by ID
   */
  delete(id: string): Promise<boolean>;
}
