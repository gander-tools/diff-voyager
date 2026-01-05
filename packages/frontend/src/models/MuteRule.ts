import type {
  MuteRule,
  RuleScope,
  DiffType,
} from '@gander-tools/diff-voyager-shared';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CreateMuteRuleParams {
  projectId?: string;
  name: string;
  description?: string;
  scope: RuleScope;
  conditions: {
    cssSelectors?: string[];
    xpathSelectors?: string[];
    diffTypes?: DiffType[];
  };
}

export class MuteRuleModel implements MuteRule {
  id: string;
  projectId?: string;
  name: string;
  description?: string;
  scope: RuleScope;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  conditions: {
    cssSelectors?: string[];
    xpathSelectors?: string[];
    diffTypes?: DiffType[];
  };

  constructor(data: MuteRule) {
    this.id = data.id;
    this.projectId = data.projectId;
    this.name = data.name;
    this.description = data.description;
    this.scope = data.scope;
    this.active = data.active;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.conditions = data.conditions;
  }

  /**
   * Creates a new mute rule
   */
  static create(params: CreateMuteRuleParams): MuteRuleModel {
    const now = new Date();

    const rule: MuteRule = {
      id: MuteRuleModel.generateId(),
      projectId: params.projectId,
      name: params.name,
      description: params.description,
      scope: params.scope,
      active: true,
      createdAt: now,
      updatedAt: now,
      conditions: params.conditions,
    };

    return new MuteRuleModel(rule);
  }

  /**
   * Generates a unique ID for a new rule
   */
  private static generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `rule-${timestamp}-${random}`;
  }

  /**
   * Validates the rule data
   */
  validate(): ValidationResult {
    const errors: string[] = [];

    // Validate name
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Rule name is required');
    }

    // Validate projectId for project-scoped rules
    if (this.scope === 'project' && !this.projectId) {
      errors.push('Project ID is required for project-scoped rules');
    }

    // Validate that at least one condition is specified
    const hasConditions =
      (this.conditions.cssSelectors && this.conditions.cssSelectors.length > 0) ||
      (this.conditions.xpathSelectors &&
        this.conditions.xpathSelectors.length > 0) ||
      (this.conditions.diffTypes && this.conditions.diffTypes.length > 0);

    if (!hasConditions) {
      errors.push('At least one condition must be specified');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Activates the rule
   */
  activate(): MuteRuleModel {
    const updated: MuteRule = {
      ...this.toJSON(),
      active: true,
      updatedAt: new Date(),
    };

    return new MuteRuleModel(updated);
  }

  /**
   * Deactivates the rule
   */
  deactivate(): MuteRuleModel {
    const updated: MuteRule = {
      ...this.toJSON(),
      active: false,
      updatedAt: new Date(),
    };

    return new MuteRuleModel(updated);
  }

  /**
   * Checks if the rule is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Checks if the rule is inactive
   */
  isInactive(): boolean {
    return !this.active;
  }

  /**
   * Checks if the rule is project-scoped
   */
  isProjectScoped(): boolean {
    return this.scope === 'project';
  }

  /**
   * Checks if the rule is global
   */
  isGlobal(): boolean {
    return this.scope === 'global';
  }

  /**
   * Checks if the rule has CSS selectors
   */
  hasCssSelectors(): boolean {
    return !!this.conditions.cssSelectors && this.conditions.cssSelectors.length > 0;
  }

  /**
   * Checks if the rule has XPath selectors
   */
  hasXpathSelectors(): boolean {
    return (
      !!this.conditions.xpathSelectors && this.conditions.xpathSelectors.length > 0
    );
  }

  /**
   * Checks if the rule has diff types
   */
  hasDiffTypes(): boolean {
    return !!this.conditions.diffTypes && this.conditions.diffTypes.length > 0;
  }

  /**
   * Gets CSS selectors
   */
  getCssSelectors(): string[] {
    return this.conditions.cssSelectors || [];
  }

  /**
   * Gets XPath selectors
   */
  getXpathSelectors(): string[] {
    return this.conditions.xpathSelectors || [];
  }

  /**
   * Gets diff types
   */
  getDiffTypes(): DiffType[] {
    return this.conditions.diffTypes || [];
  }

  /**
   * Checks if the rule applies to a specific diff type
   */
  appliesToDiffType(diffType: DiffType): boolean {
    // If no diff types are specified, the rule applies to all types
    if (!this.conditions.diffTypes || this.conditions.diffTypes.length === 0) {
      return true;
    }

    return this.conditions.diffTypes.includes(diffType);
  }

  /**
   * Updates rule properties
   */
  update(updates: Partial<Omit<MuteRule, 'id' | 'createdAt'>>): MuteRuleModel {
    const updated: MuteRule = {
      ...this.toJSON(),
      ...updates,
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    };

    return new MuteRuleModel(updated);
  }

  /**
   * Serializes the rule to JSON
   */
  toJSON(): MuteRule {
    return {
      id: this.id,
      projectId: this.projectId,
      name: this.name,
      description: this.description,
      scope: this.scope,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      conditions: this.conditions,
    };
  }

  /**
   * Creates a deep copy of the rule
   */
  clone(): MuteRuleModel {
    const cloned: MuteRule = {
      id: this.id,
      projectId: this.projectId,
      name: this.name,
      description: this.description,
      scope: this.scope,
      active: this.active,
      createdAt: new Date(this.createdAt),
      updatedAt: new Date(this.updatedAt),
      conditions: JSON.parse(JSON.stringify(this.conditions)),
    };

    return new MuteRuleModel(cloned);
  }
}
