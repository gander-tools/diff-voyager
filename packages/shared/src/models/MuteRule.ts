import { randomUUID } from 'node:crypto';
import type { MuteRule, RuleCondition } from '../types/index.js';
import { RuleScope, DiffType } from '../enums/index.js';

/**
 * Domain model for MuteRule with validation and business logic
 */
export class MuteRuleModel {
  /**
   * Creates a new mute rule with validation
   */
  static create(data: {
    name: string;
    description?: string;
    scope: RuleScope;
    projectId?: string;
    conditions: RuleCondition[];
  }): MuteRule {
    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Rule name cannot be empty');
    }

    // Validate scope and projectId relationship
    if (data.scope === RuleScope.PROJECT && !data.projectId) {
      throw new Error('Project-scoped rule must have a project ID');
    }

    if (data.scope === RuleScope.GLOBAL && data.projectId) {
      throw new Error('Global rule cannot have a project ID');
    }

    // Validate conditions
    if (!data.conditions || data.conditions.length === 0) {
      throw new Error('Rule must have at least one condition');
    }

    const now = new Date();

    return {
      id: randomUUID(),
      projectId: data.projectId,
      name: data.name.trim(),
      description: data.description,
      scope: data.scope,
      active: true,
      createdAt: now,
      updatedAt: now,
      conditions: data.conditions,
    };
  }

  /**
   * Updates an existing mute rule
   */
  static update(
    rule: MuteRule,
    updates: {
      name?: string;
      description?: string;
      conditions?: RuleCondition[];
    },
  ): MuteRule {
    const updated = { ...rule };

    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('Rule name cannot be empty');
      }
      updated.name = updates.name.trim();
    }

    if (updates.description !== undefined) {
      updated.description = updates.description;
    }

    if (updates.conditions !== undefined) {
      if (updates.conditions.length === 0) {
        throw new Error('Rule must have at least one condition');
      }
      updated.conditions = updates.conditions;
    }

    updated.updatedAt = new Date();

    return updated;
  }

  /**
   * Activates a mute rule
   */
  static activate(rule: MuteRule): MuteRule {
    return {
      ...rule,
      active: true,
      updatedAt: new Date(),
    };
  }

  /**
   * Deactivates a mute rule
   */
  static deactivate(rule: MuteRule): MuteRule {
    return {
      ...rule,
      active: false,
      updatedAt: new Date(),
    };
  }

  /**
   * Checks if a rule matches a given change
   */
  static matches(
    rule: MuteRule,
    change: {
      type: DiffType;
      details: {
        selector?: string;
        xpath?: string;
        field?: string;
        [key: string]: unknown;
      };
    },
  ): boolean {
    // Inactive rules don't match
    if (!rule.active) {
      return false;
    }

    // Check if any condition matches
    return rule.conditions.some((condition) => {
      // Type must match
      if (condition.diffType !== change.type) {
        return false;
      }

      // Check CSS selector
      if (condition.cssSelector) {
        return change.details.selector === condition.cssSelector;
      }

      // Check XPath selector
      if (condition.xpathSelector) {
        return change.details.xpath === condition.xpathSelector;
      }

      // Check header name
      if (condition.headerName) {
        return change.details.field === condition.headerName;
      }

      // Check field pattern (simple string match for now)
      if (condition.fieldPattern) {
        return change.details.field === condition.fieldPattern;
      }

      // If no specific condition is set, just match by type
      return true;
    });
  }

  /**
   * Serializes mute rule to JSON-compatible format
   */
  static toJSON(rule: MuteRule): Record<string, unknown> {
    return {
      id: rule.id,
      projectId: rule.projectId,
      name: rule.name,
      description: rule.description,
      scope: rule.scope,
      active: rule.active,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
      conditions: rule.conditions,
    };
  }

  /**
   * Deserializes mute rule from JSON
   */
  static fromJSON(data: {
    id: string;
    projectId?: string;
    name: string;
    description?: string;
    scope: RuleScope;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    conditions: RuleCondition[];
  }): MuteRule {
    return {
      id: data.id,
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      scope: data.scope,
      active: data.active,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      conditions: data.conditions,
    };
  }
}
