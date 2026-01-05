import { describe, it, expect } from 'vitest';
import { MuteRuleModel } from './MuteRule.js';
import { RuleScope, DiffType } from '../enums/index.js';
import type { RuleCondition } from '../types/index.js';

describe('MuteRuleModel', () => {
  const sampleCondition: RuleCondition = {
    diffType: DiffType.VISUAL,
    cssSelector: '.dynamic-content',
  };

  describe('create', () => {
    it('should create a new mute rule with valid data', () => {
      const rule = MuteRuleModel.create({
        name: 'Ignore dynamic content',
        description: 'Ignore changes in dynamic content areas',
        scope: RuleScope.PROJECT,
        projectId: 'project-123',
        conditions: [sampleCondition],
      });

      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('Ignore dynamic content');
      expect(rule.description).toBe('Ignore changes in dynamic content areas');
      expect(rule.scope).toBe(RuleScope.PROJECT);
      expect(rule.projectId).toBe('project-123');
      expect(rule.active).toBe(true);
      expect(rule.createdAt).toBeInstanceOf(Date);
      expect(rule.updatedAt).toBeInstanceOf(Date);
      expect(rule.conditions).toHaveLength(1);
    });

    it('should create global rule without projectId', () => {
      const rule = MuteRuleModel.create({
        name: 'Global rule',
        scope: RuleScope.GLOBAL,
        conditions: [sampleCondition],
      });

      expect(rule.scope).toBe(RuleScope.GLOBAL);
      expect(rule.projectId).toBeUndefined();
    });

    it('should throw error if name is empty', () => {
      expect(() =>
        MuteRuleModel.create({
          name: '',
          scope: RuleScope.PROJECT,
          projectId: 'project-123',
          conditions: [sampleCondition],
        }),
      ).toThrow('Rule name cannot be empty');
    });

    it('should throw error if project-scoped rule has no projectId', () => {
      expect(() =>
        MuteRuleModel.create({
          name: 'Test rule',
          scope: RuleScope.PROJECT,
          conditions: [sampleCondition],
        }),
      ).toThrow('Project-scoped rule must have a project ID');
    });

    it('should throw error if global rule has projectId', () => {
      expect(() =>
        MuteRuleModel.create({
          name: 'Test rule',
          scope: RuleScope.GLOBAL,
          projectId: 'project-123',
          conditions: [sampleCondition],
        }),
      ).toThrow('Global rule cannot have a project ID');
    });

    it('should throw error if conditions array is empty', () => {
      expect(() =>
        MuteRuleModel.create({
          name: 'Test rule',
          scope: RuleScope.GLOBAL,
          conditions: [],
        }),
      ).toThrow('Rule must have at least one condition');
    });

    it('should create rule with multiple conditions', () => {
      const conditions: RuleCondition[] = [
        {
          diffType: DiffType.VISUAL,
          cssSelector: '.dynamic-1',
        },
        {
          diffType: DiffType.CONTENT,
          xpathSelector: '//div[@class="timestamp"]',
        },
        {
          diffType: DiffType.HEADERS,
          headerName: 'X-Request-ID',
        },
      ];

      const rule = MuteRuleModel.create({
        name: 'Multiple conditions',
        scope: RuleScope.GLOBAL,
        conditions,
      });

      expect(rule.conditions).toHaveLength(3);
    });
  });

  describe('update', () => {
    it('should update rule name', () => {
      const rule = MuteRuleModel.create({
        name: 'Old name',
        scope: RuleScope.GLOBAL,
        conditions: [sampleCondition],
      });

      const updated = MuteRuleModel.update(rule, { name: 'New name' });

      expect(updated.name).toBe('New name');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        rule.updatedAt.getTime(),
      );
    });

    it('should update rule description', () => {
      const rule = MuteRuleModel.create({
        name: 'Test rule',
        scope: RuleScope.GLOBAL,
        conditions: [sampleCondition],
      });

      const updated = MuteRuleModel.update(rule, {
        description: 'Updated description',
      });

      expect(updated.description).toBe('Updated description');
    });

    it('should update rule conditions', () => {
      const rule = MuteRuleModel.create({
        name: 'Test rule',
        scope: RuleScope.GLOBAL,
        conditions: [sampleCondition],
      });

      const newConditions: RuleCondition[] = [
        {
          diffType: DiffType.SEO,
          fieldPattern: 'meta.*',
        },
      ];

      const updated = MuteRuleModel.update(rule, {
        conditions: newConditions,
      });

      expect(updated.conditions).toHaveLength(1);
      expect(updated.conditions[0].diffType).toBe(DiffType.SEO);
    });

    it('should throw error if updating name to empty', () => {
      const rule = MuteRuleModel.create({
        name: 'Test rule',
        scope: RuleScope.GLOBAL,
        conditions: [sampleCondition],
      });

      expect(() => MuteRuleModel.update(rule, { name: '' })).toThrow(
        'Rule name cannot be empty',
      );
    });

    it('should throw error if updating conditions to empty array', () => {
      const rule = MuteRuleModel.create({
        name: 'Test rule',
        scope: RuleScope.GLOBAL,
        conditions: [sampleCondition],
      });

      expect(() => MuteRuleModel.update(rule, { conditions: [] })).toThrow(
        'Rule must have at least one condition',
      );
    });
  });

  describe('activate/deactivate', () => {
    it('should activate a deactivated rule', () => {
      const rule = MuteRuleModel.create({
        name: 'Test rule',
        scope: RuleScope.GLOBAL,
        conditions: [sampleCondition],
      });

      const deactivated = MuteRuleModel.deactivate(rule);
      const activated = MuteRuleModel.activate(deactivated);

      expect(activated.active).toBe(true);
    });

    it('should deactivate an active rule', () => {
      const rule = MuteRuleModel.create({
        name: 'Test rule',
        scope: RuleScope.GLOBAL,
        conditions: [sampleCondition],
      });

      const deactivated = MuteRuleModel.deactivate(rule);

      expect(deactivated.active).toBe(false);
    });
  });

  describe('matches', () => {
    it('should match change with CSS selector condition', () => {
      const rule = MuteRuleModel.create({
        name: 'Test rule',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.VISUAL,
            cssSelector: '.dynamic-content',
          },
        ],
      });

      const change = {
        type: DiffType.VISUAL,
        details: {
          selector: '.dynamic-content',
        },
      };

      expect(MuteRuleModel.matches(rule, change)).toBe(true);
    });

    it('should match change with XPath condition', () => {
      const rule = MuteRuleModel.create({
        name: 'Test rule',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.CONTENT,
            xpathSelector: '//div[@id="timestamp"]',
          },
        ],
      });

      const change = {
        type: DiffType.CONTENT,
        details: {
          xpath: '//div[@id="timestamp"]',
        },
      };

      expect(MuteRuleModel.matches(rule, change)).toBe(true);
    });

    it('should match change with header name condition', () => {
      const rule = MuteRuleModel.create({
        name: 'Test rule',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.HEADERS,
            headerName: 'X-Request-ID',
          },
        ],
      });

      const change = {
        type: DiffType.HEADERS,
        details: {
          field: 'X-Request-ID',
        },
      };

      expect(MuteRuleModel.matches(rule, change)).toBe(true);
    });

    it('should not match if type differs', () => {
      const rule = MuteRuleModel.create({
        name: 'Test rule',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.VISUAL,
            cssSelector: '.dynamic-content',
          },
        ],
      });

      const change = {
        type: DiffType.SEO,
        details: {
          selector: '.dynamic-content',
        },
      };

      expect(MuteRuleModel.matches(rule, change)).toBe(false);
    });

    it('should not match inactive rule', () => {
      const rule = MuteRuleModel.create({
        name: 'Test rule',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.VISUAL,
            cssSelector: '.dynamic-content',
          },
        ],
      });

      const deactivated = MuteRuleModel.deactivate(rule);

      const change = {
        type: DiffType.VISUAL,
        details: {
          selector: '.dynamic-content',
        },
      };

      expect(MuteRuleModel.matches(deactivated, change)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize mute rule to JSON', () => {
      const rule = MuteRuleModel.create({
        name: 'Test rule',
        description: 'Test description',
        scope: RuleScope.PROJECT,
        projectId: 'project-123',
        conditions: [sampleCondition],
      });

      const json = MuteRuleModel.toJSON(rule);

      expect(json.id).toBe(rule.id);
      expect(json.name).toBe('Test rule');
      expect(json.createdAt).toBe(rule.createdAt.toISOString());
      expect(json.updatedAt).toBe(rule.updatedAt.toISOString());
    });
  });

  describe('fromJSON', () => {
    it('should deserialize mute rule from JSON', () => {
      const json = {
        id: 'rule-123',
        projectId: 'project-456',
        name: 'Test rule',
        description: 'Test description',
        scope: RuleScope.PROJECT,
        active: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        conditions: [sampleCondition],
      };

      const rule = MuteRuleModel.fromJSON(json);

      expect(rule.id).toBe('rule-123');
      expect(rule.name).toBe('Test rule');
      expect(rule.createdAt).toBeInstanceOf(Date);
      expect(rule.updatedAt).toBeInstanceOf(Date);
    });
  });
});
