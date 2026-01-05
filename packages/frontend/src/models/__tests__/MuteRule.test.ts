import { describe, it, expect, beforeEach } from 'vitest';
import { MuteRuleModel } from '../MuteRule';
import type { MuteRule, RuleScope } from '@gander-tools/diff-voyager-shared';

describe('MuteRuleModel', () => {
  let mockRule: MuteRule;

  beforeEach(() => {
    mockRule = {
      id: 'rule-1',
      projectId: 'project-1',
      name: 'Ignore timestamps',
      description: 'Ignore timestamp elements that change on every build',
      scope: 'project',
      active: true,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      conditions: {
        cssSelectors: ['.timestamp', '#build-time'],
        xpathSelectors: ['//span[@class="dynamic"]'],
        diffTypes: ['content', 'visual'],
      },
    };
  });

  describe('constructor', () => {
    it('should create a MuteRuleModel instance from MuteRule data', () => {
      const model = new MuteRuleModel(mockRule);

      expect(model.id).toBe('rule-1');
      expect(model.projectId).toBe('project-1');
      expect(model.name).toBe('Ignore timestamps');
      expect(model.description).toBe(
        'Ignore timestamp elements that change on every build'
      );
      expect(model.scope).toBe('project');
      expect(model.active).toBe(true);
      expect(model.conditions).toEqual(mockRule.conditions);
    });
  });

  describe('create', () => {
    it('should create a new rule with generated ID', () => {
      const newRule = MuteRuleModel.create({
        projectId: 'project-2',
        name: 'New Rule',
        description: 'A new mute rule',
        scope: 'project',
        conditions: {
          cssSelectors: ['.ignore-me'],
        },
      });

      expect(newRule.id).toBeDefined();
      expect(newRule.id).toMatch(/^rule-/);
      expect(newRule.projectId).toBe('project-2');
      expect(newRule.name).toBe('New Rule');
      expect(newRule.active).toBe(true);
      expect(newRule.createdAt).toBeInstanceOf(Date);
      expect(newRule.updatedAt).toBeInstanceOf(Date);
    });

    it('should create rule with minimal conditions', () => {
      const newRule = MuteRuleModel.create({
        projectId: 'project-2',
        name: 'Minimal Rule',
        scope: 'project',
        conditions: {},
      });

      expect(newRule.conditions).toEqual({});
    });

    it('should create global rule', () => {
      const globalRule = MuteRuleModel.create({
        name: 'Global Rule',
        scope: 'global',
        conditions: {
          cssSelectors: ['.global-ignore'],
        },
      });

      expect(globalRule.scope).toBe('global');
      expect(globalRule.projectId).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should validate a valid rule', () => {
      const model = new MuteRuleModel(mockRule);
      const validation = model.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should fail validation when name is empty', () => {
      const invalid = { ...mockRule, name: '' };
      const model = new MuteRuleModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Rule name is required');
    });

    it('should fail validation when project-scoped rule has no projectId', () => {
      const invalid = { ...mockRule, projectId: undefined };
      const model = new MuteRuleModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Project ID is required for project-scoped rules'
      );
    });

    it('should allow global rule without projectId', () => {
      const globalRule = { ...mockRule, scope: 'global' as RuleScope, projectId: undefined };
      const model = new MuteRuleModel(globalRule);
      const validation = model.validate();

      expect(validation.isValid).toBe(true);
    });

    it('should fail validation when conditions are empty', () => {
      const invalid = { ...mockRule, conditions: {} };
      const model = new MuteRuleModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('At least one condition must be specified');
    });
  });

  describe('activation management', () => {
    it('should activate a rule', () => {
      const model = new MuteRuleModel({ ...mockRule, active: false });
      const activated = model.activate();

      expect(activated.active).toBe(true);
      expect(activated.updatedAt.getTime()).toBeGreaterThan(model.updatedAt.getTime());
    });

    it('should deactivate a rule', () => {
      const model = new MuteRuleModel(mockRule);
      const deactivated = model.deactivate();

      expect(deactivated.active).toBe(false);
      expect(deactivated.updatedAt.getTime()).toBeGreaterThan(model.updatedAt.getTime());
    });

    it('should check if rule is active', () => {
      const active = new MuteRuleModel(mockRule);
      const inactive = new MuteRuleModel({ ...mockRule, active: false });

      expect(active.isActive()).toBe(true);
      expect(inactive.isActive()).toBe(false);
    });

    it('should check if rule is inactive', () => {
      const active = new MuteRuleModel(mockRule);
      const inactive = new MuteRuleModel({ ...mockRule, active: false });

      expect(active.isInactive()).toBe(false);
      expect(inactive.isInactive()).toBe(true);
    });
  });

  describe('scope checks', () => {
    it('should check if rule is project-scoped', () => {
      const model = new MuteRuleModel(mockRule);
      expect(model.isProjectScoped()).toBe(true);
    });

    it('should check if rule is global', () => {
      const global = { ...mockRule, scope: 'global' as RuleScope };
      const model = new MuteRuleModel(global);
      expect(model.isGlobal()).toBe(true);
    });
  });

  describe('condition checks', () => {
    it('should check if rule has CSS selectors', () => {
      const model = new MuteRuleModel(mockRule);
      expect(model.hasCssSelectors()).toBe(true);
    });

    it('should check if rule has XPath selectors', () => {
      const model = new MuteRuleModel(mockRule);
      expect(model.hasXpathSelectors()).toBe(true);
    });

    it('should check if rule has diff types', () => {
      const model = new MuteRuleModel(mockRule);
      expect(model.hasDiffTypes()).toBe(true);
    });

    it('should check if rule has no CSS selectors', () => {
      const noCSS = { ...mockRule, conditions: { xpathSelectors: ['//div'] } };
      const model = new MuteRuleModel(noCSS);
      expect(model.hasCssSelectors()).toBe(false);
    });

    it('should get CSS selectors', () => {
      const model = new MuteRuleModel(mockRule);
      expect(model.getCssSelectors()).toEqual(['.timestamp', '#build-time']);
    });

    it('should get XPath selectors', () => {
      const model = new MuteRuleModel(mockRule);
      expect(model.getXpathSelectors()).toEqual(['//span[@class="dynamic"]']);
    });

    it('should get diff types', () => {
      const model = new MuteRuleModel(mockRule);
      expect(model.getDiffTypes()).toEqual(['content', 'visual']);
    });
  });

  describe('update', () => {
    it('should update rule properties', () => {
      const model = new MuteRuleModel(mockRule);
      const updated = model.update({
        name: 'Updated Rule',
        description: 'Updated description',
      });

      expect(updated.name).toBe('Updated Rule');
      expect(updated.description).toBe('Updated description');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(model.updatedAt.getTime());
      expect(updated.id).toBe(model.id);
      expect(updated.createdAt).toEqual(model.createdAt);
    });

    it('should update conditions', () => {
      const model = new MuteRuleModel(mockRule);
      const updated = model.update({
        conditions: {
          cssSelectors: ['.new-selector'],
        },
      });

      expect(updated.conditions.cssSelectors).toEqual(['.new-selector']);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(model.updatedAt.getTime());
    });
  });

  describe('matching', () => {
    it('should check if rule applies to a diff type', () => {
      const model = new MuteRuleModel(mockRule);
      expect(model.appliesToDiffType('content')).toBe(true);
      expect(model.appliesToDiffType('visual')).toBe(true);
      expect(model.appliesToDiffType('seo')).toBe(false);
    });

    it('should apply to all diff types when none specified', () => {
      const allTypes = {
        ...mockRule,
        conditions: {
          cssSelectors: ['.timestamp'],
        },
      };
      const model = new MuteRuleModel(allTypes);

      expect(model.appliesToDiffType('content')).toBe(true);
      expect(model.appliesToDiffType('visual')).toBe(true);
      expect(model.appliesToDiffType('seo')).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should serialize to MuteRule interface', () => {
      const model = new MuteRuleModel(mockRule);
      const json = model.toJSON();

      expect(json).toEqual(mockRule);
      expect(json.id).toBe(mockRule.id);
      expect(json.conditions).toEqual(mockRule.conditions);
    });
  });

  describe('clone', () => {
    it('should create a deep copy of the rule model', () => {
      const model = new MuteRuleModel(mockRule);
      const cloned = model.clone();

      expect(cloned).not.toBe(model);
      expect(cloned.id).toBe(model.id);
      expect(cloned.conditions).toEqual(model.conditions);
      expect(cloned.conditions).not.toBe(model.conditions);
    });
  });
});
