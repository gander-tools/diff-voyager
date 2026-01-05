import { describe, it, expect } from 'vitest';
import { MuteRuleModel } from '../models/MuteRule.js';
import { DiffType, RuleScope, DiffStatus } from '@gander-tools/diff-voyager-shared';
import type { Change } from '@gander-tools/diff-voyager-shared';

describe('MuteRuleModel', () => {
  describe('create', () => {
    it('should create a global mute rule', () => {
      const rule = MuteRuleModel.create({
        name: 'Ignore timestamps',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.CONTENT,
            cssSelector: '.timestamp',
          },
        ],
      });

      expect(rule.id).toBeTruthy();
      expect(rule.name).toBe('Ignore timestamps');
      expect(rule.scope).toBe(RuleScope.GLOBAL);
      expect(rule.active).toBe(true);
      expect(rule.projectId).toBeUndefined();
      expect(rule.createdAt).toBeInstanceOf(Date);
      expect(rule.updatedAt).toBeInstanceOf(Date);
      expect(rule.conditions).toHaveLength(1);
    });

    it('should create a project-scoped mute rule', () => {
      const rule = MuteRuleModel.create({
        name: 'Ignore session ID',
        scope: RuleScope.PROJECT,
        projectId: 'project-123',
        conditions: [
          {
            diffType: DiffType.CONTENT,
            fieldPattern: 'session',
          },
        ],
      });

      expect(rule.scope).toBe(RuleScope.PROJECT);
      expect(rule.projectId).toBe('project-123');
    });

    it('should create rule with description', () => {
      const rule = MuteRuleModel.create({
        name: 'Ignore analytics',
        description: 'Mute all analytics-related changes',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.CONTENT,
            cssSelector: '.analytics',
          },
        ],
      });

      expect(rule.description).toBe('Mute all analytics-related changes');
    });

    it('should throw error if name is empty', () => {
      expect(() => {
        MuteRuleModel.create({
          name: '',
          scope: RuleScope.GLOBAL,
          conditions: [],
        });
      }).toThrow('Rule name cannot be empty');
    });

    it('should throw error if conditions are empty', () => {
      expect(() => {
        MuteRuleModel.create({
          name: 'Test Rule',
          scope: RuleScope.GLOBAL,
          conditions: [],
        });
      }).toThrow('Rule must have at least one condition');
    });

    it('should throw error if project-scoped rule has no projectId', () => {
      expect(() => {
        MuteRuleModel.create({
          name: 'Test Rule',
          scope: RuleScope.PROJECT,
          conditions: [
            {
              diffType: DiffType.CONTENT,
              cssSelector: '.test',
            },
          ],
        });
      }).toThrow('Project-scoped rule must have a projectId');
    });
  });

  describe('matches', () => {
    it('should match change by CSS selector', () => {
      const rule = MuteRuleModel.create({
        name: 'Ignore timestamps',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.CONTENT,
            cssSelector: '.timestamp',
          },
        ],
      });

      const change: Change = {
        id: 'change-1',
        type: DiffType.CONTENT,
        severity: DiffType.CONTENT as any,
        status: DiffStatus.NEW,
        description: 'Content changed',
        details: {
          selector: '.timestamp',
        },
      };

      expect(MuteRuleModel.matches(rule, change)).toBe(true);
    });

    it('should not match change with different CSS selector', () => {
      const rule = MuteRuleModel.create({
        name: 'Ignore timestamps',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.CONTENT,
            cssSelector: '.timestamp',
          },
        ],
      });

      const change: Change = {
        id: 'change-1',
        type: DiffType.CONTENT,
        severity: DiffType.CONTENT as any,
        status: DiffStatus.NEW,
        description: 'Content changed',
        details: {
          selector: '.other-class',
        },
      };

      expect(MuteRuleModel.matches(rule, change)).toBe(false);
    });

    it('should match change by XPath selector', () => {
      const rule = MuteRuleModel.create({
        name: 'Ignore dynamic content',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.CONTENT,
            xpathSelector: '//div[@class="dynamic"]',
          },
        ],
      });

      const change: Change = {
        id: 'change-1',
        type: DiffType.CONTENT,
        severity: DiffType.CONTENT as any,
        status: DiffStatus.NEW,
        description: 'Content changed',
        details: {
          xpath: '//div[@class="dynamic"]',
        },
      };

      expect(MuteRuleModel.matches(rule, change)).toBe(true);
    });

    it('should match change by field pattern', () => {
      const rule = MuteRuleModel.create({
        name: 'Ignore session fields',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.CONTENT,
            fieldPattern: 'session',
          },
        ],
      });

      const change: Change = {
        id: 'change-1',
        type: DiffType.CONTENT,
        severity: DiffType.CONTENT as any,
        status: DiffStatus.NEW,
        description: 'Field changed',
        details: {
          field: 'sessionId',
        },
      };

      expect(MuteRuleModel.matches(rule, change)).toBe(true);
    });

    it('should match change by header name', () => {
      const rule = MuteRuleModel.create({
        name: 'Ignore cache headers',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.HEADERS,
            headerName: 'cache-control',
          },
        ],
      });

      const change: Change = {
        id: 'change-1',
        type: DiffType.HEADERS,
        severity: DiffType.CONTENT as any,
        status: DiffStatus.NEW,
        description: 'Header changed',
        details: {
          field: 'cache-control',
        },
      };

      expect(MuteRuleModel.matches(rule, change)).toBe(true);
    });

    it('should not match change with different diff type', () => {
      const rule = MuteRuleModel.create({
        name: 'Ignore timestamps',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.CONTENT,
            cssSelector: '.timestamp',
          },
        ],
      });

      const change: Change = {
        id: 'change-1',
        type: DiffType.SEO,
        severity: DiffType.CONTENT as any,
        status: DiffStatus.NEW,
        description: 'SEO changed',
        details: {
          selector: '.timestamp',
        },
      };

      expect(MuteRuleModel.matches(rule, change)).toBe(false);
    });

    it('should match if any condition matches (OR logic)', () => {
      const rule = MuteRuleModel.create({
        name: 'Ignore dynamic content',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.CONTENT,
            cssSelector: '.timestamp',
          },
          {
            diffType: DiffType.CONTENT,
            cssSelector: '.session',
          },
        ],
      });

      const change: Change = {
        id: 'change-1',
        type: DiffType.CONTENT,
        severity: DiffType.CONTENT as any,
        status: DiffStatus.NEW,
        description: 'Content changed',
        details: {
          selector: '.session',
        },
      };

      expect(MuteRuleModel.matches(rule, change)).toBe(true);
    });

    it('should not match inactive rule', () => {
      const rule = MuteRuleModel.create({
        name: 'Ignore timestamps',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.CONTENT,
            cssSelector: '.timestamp',
          },
        ],
      });

      const inactiveRule = MuteRuleModel.deactivate(rule);

      const change: Change = {
        id: 'change-1',
        type: DiffType.CONTENT,
        severity: DiffType.CONTENT as any,
        status: DiffStatus.NEW,
        description: 'Content changed',
        details: {
          selector: '.timestamp',
        },
      };

      expect(MuteRuleModel.matches(inactiveRule, change)).toBe(false);
    });
  });

  describe('activate and deactivate', () => {
    it('should activate a rule', () => {
      const rule = MuteRuleModel.create({
        name: 'Test Rule',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.CONTENT,
            cssSelector: '.test',
          },
        ],
      });

      const deactivated = MuteRuleModel.deactivate(rule);
      const activated = MuteRuleModel.activate(deactivated);

      expect(activated.active).toBe(true);
      expect(activated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        rule.updatedAt.getTime()
      );
    });

    it('should deactivate a rule', () => {
      const rule = MuteRuleModel.create({
        name: 'Test Rule',
        scope: RuleScope.GLOBAL,
        conditions: [
          {
            diffType: DiffType.CONTENT,
            cssSelector: '.test',
          },
        ],
      });

      const deactivated = MuteRuleModel.deactivate(rule);

      expect(deactivated.active).toBe(false);
      expect(deactivated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        rule.updatedAt.getTime()
      );
    });
  });

  describe('toJSON and fromJSON', () => {
    it('should serialize and deserialize rule correctly', () => {
      const rule = MuteRuleModel.create({
        name: 'Ignore timestamps',
        description: 'Mute timestamp changes',
        scope: RuleScope.PROJECT,
        projectId: 'project-123',
        conditions: [
          {
            diffType: DiffType.CONTENT,
            cssSelector: '.timestamp',
          },
        ],
      });

      const json = MuteRuleModel.toJSON(rule);
      const deserializedRule = MuteRuleModel.fromJSON(json);

      expect(deserializedRule.id).toBe(rule.id);
      expect(deserializedRule.name).toBe(rule.name);
      expect(deserializedRule.description).toBe(rule.description);
      expect(deserializedRule.scope).toBe(rule.scope);
      expect(deserializedRule.projectId).toBe(rule.projectId);
      expect(deserializedRule.active).toBe(rule.active);
      expect(deserializedRule.conditions).toEqual(rule.conditions);
      expect(deserializedRule.createdAt).toEqual(rule.createdAt);
      expect(deserializedRule.updatedAt).toEqual(rule.updatedAt);
    });
  });
});
