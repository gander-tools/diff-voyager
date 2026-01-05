import {
  type MuteRule,
  type RuleCondition,
  type Change,
  RuleScope,
} from '@gander-tools/diff-voyager-shared';
import { randomUUID } from 'node:crypto';

/**
 * Input parameters for creating a new mute rule
 */
export interface CreateMuteRuleInput {
  name: string;
  description?: string;
  scope: RuleScope;
  projectId?: string;
  conditions: RuleCondition[];
}

/**
 * MuteRuleModel - Domain model for managing mute rules
 *
 * Encapsulates business logic for:
 * - Creating mute rules with validation
 * - Matching changes against rule conditions
 * - Activating/deactivating rules
 * - Global vs project-scoped rules
 */
export class MuteRuleModel {
  /**
   * Create a new mute rule
   */
  static create(input: CreateMuteRuleInput): MuteRule {
    // Validate inputs
    if (!input.name || input.name.trim() === '') {
      throw new Error('Rule name cannot be empty');
    }

    if (!input.conditions || input.conditions.length === 0) {
      throw new Error('Rule must have at least one condition');
    }

    if (input.scope === RuleScope.PROJECT && !input.projectId) {
      throw new Error('Project-scoped rule must have a projectId');
    }

    const now = new Date();

    const rule: MuteRule = {
      id: randomUUID(),
      projectId: input.projectId,
      name: input.name.trim(),
      description: input.description?.trim(),
      scope: input.scope,
      active: true,
      createdAt: now,
      updatedAt: now,
      conditions: input.conditions,
    };

    return rule;
  }

  /**
   * Check if a change matches this rule's conditions
   *
   * Returns true if the rule is active and any condition matches (OR logic)
   */
  static matches(rule: MuteRule, change: Change): boolean {
    if (!rule.active) {
      return false;
    }

    // Check if any condition matches (OR logic)
    return rule.conditions.some((condition) =>
      this.matchesCondition(condition, change)
    );
  }

  /**
   * Activate a rule
   */
  static activate(rule: MuteRule): MuteRule {
    return {
      ...rule,
      active: true,
      updatedAt: new Date(),
    };
  }

  /**
   * Deactivate a rule
   */
  static deactivate(rule: MuteRule): MuteRule {
    return {
      ...rule,
      active: false,
      updatedAt: new Date(),
    };
  }

  /**
   * Serialize rule to JSON
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
   * Deserialize rule from JSON
   */
  static fromJSON(json: Record<string, unknown>): MuteRule {
    return {
      id: json.id as string,
      projectId: json.projectId as string | undefined,
      name: json.name as string,
      description: json.description as string | undefined,
      scope: json.scope as RuleScope,
      active: json.active as boolean,
      createdAt: new Date(json.createdAt as string),
      updatedAt: new Date(json.updatedAt as string),
      conditions: json.conditions as RuleCondition[],
    };
  }

  /**
   * Check if a change matches a specific condition
   */
  private static matchesCondition(
    condition: RuleCondition,
    change: Change
  ): boolean {
    // First check if diff type matches
    if (condition.diffType !== change.type) {
      return false;
    }

    // Check CSS selector if specified
    if (condition.cssSelector) {
      if (change.details.selector === condition.cssSelector) {
        return true;
      }
    }

    // Check XPath selector if specified
    if (condition.xpathSelector) {
      if (change.details.xpath === condition.xpathSelector) {
        return true;
      }
    }

    // Check field pattern if specified (case-insensitive contains)
    if (condition.fieldPattern && change.details.field) {
      const field = String(change.details.field).toLowerCase();
      const pattern = condition.fieldPattern.toLowerCase();
      if (field.includes(pattern)) {
        return true;
      }
    }

    // Check header name if specified (case-insensitive exact match)
    if (condition.headerName && change.details.field) {
      const field = String(change.details.field).toLowerCase();
      const headerName = condition.headerName.toLowerCase();
      if (field === headerName) {
        return true;
      }
    }

    // Check value pattern if specified
    if (condition.valuePattern) {
      const oldValue = change.details.oldValue
        ? String(change.details.oldValue).toLowerCase()
        : '';
      const newValue = change.details.newValue
        ? String(change.details.newValue).toLowerCase()
        : '';
      const pattern = condition.valuePattern.toLowerCase();

      if (oldValue.includes(pattern) || newValue.includes(pattern)) {
        return true;
      }
    }

    // If no specific matchers were specified (only diffType), match
    if (
      !condition.cssSelector &&
      !condition.xpathSelector &&
      !condition.fieldPattern &&
      !condition.headerName &&
      !condition.valuePattern
    ) {
      return true;
    }

    return false;
  }
}
