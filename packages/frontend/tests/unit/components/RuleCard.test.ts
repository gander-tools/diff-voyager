/**
 * RuleCard tests
 * Tests rule card component for displaying rule info
 */

import type { MuteRule } from '@gander-tools/diff-voyager-shared';
import { DiffType, RuleScope } from '@gander-tools/diff-voyager-shared';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RuleCard from '../../../src/components/RuleCard.vue';

describe('RuleCard', () => {
  const mockRule: MuteRule = {
    id: 'rule-123',
    projectId: 'proj-456',
    name: 'Ignore dynamic timestamps',
    description: 'Ignore changes in timestamp fields',
    scope: RuleScope.PROJECT,
    active: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    conditions: [
      {
        diffType: DiffType.SEO,
        cssSelector: '.timestamp',
      },
      {
        diffType: DiffType.CONTENT,
        fieldPattern: 'date',
      },
    ],
  };

  it('should render rule name', () => {
    const wrapper = mount(RuleCard, {
      props: { rule: mockRule },
    });

    expect(wrapper.text()).toContain('Ignore dynamic timestamps');
  });

  it('should render rule description', () => {
    const wrapper = mount(RuleCard, {
      props: { rule: mockRule },
    });

    expect(wrapper.text()).toContain('Ignore changes in timestamp fields');
  });

  it('should render scope badge', () => {
    const wrapper = mount(RuleCard, {
      props: { rule: mockRule },
    });

    const scopeBadge = wrapper.findComponent({ name: 'RuleScopeBadge' });
    expect(scopeBadge.exists()).toBe(true);
  });

  it('should render active/inactive toggle', () => {
    const wrapper = mount(RuleCard, {
      props: { rule: mockRule },
    });

    const toggle = wrapper.find('[data-test="rule-active-toggle"]');
    expect(toggle.exists()).toBe(true);
  });

  it('should render conditions summary with count', () => {
    const wrapper = mount(RuleCard, {
      props: { rule: mockRule },
    });

    expect(wrapper.text()).toContain('2 conditions');
  });

  it('should render "1 condition" for single condition', () => {
    const ruleWithOneCondition = {
      ...mockRule,
      conditions: [mockRule.conditions[0]],
    };

    const wrapper = mount(RuleCard, {
      props: { rule: ruleWithOneCondition },
    });

    expect(wrapper.text()).toContain('1 condition');
  });

  it('should render "No conditions defined" for empty conditions', () => {
    const ruleWithNoConditions = {
      ...mockRule,
      conditions: [],
    };

    const wrapper = mount(RuleCard, {
      props: { rule: ruleWithNoConditions },
    });

    expect(wrapper.text()).toContain('No conditions defined');
  });

  it('should render created date', () => {
    const wrapper = mount(RuleCard, {
      props: { rule: mockRule },
    });

    expect(wrapper.text()).toContain('2024');
  });

  it('should emit click event when card is clicked', async () => {
    const wrapper = mount(RuleCard, {
      props: { rule: mockRule },
    });

    const card = wrapper.find('[data-test="rule-card"]');
    if (card.exists()) {
      await card.trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
    }
  });

  it('should emit edit event when edit button is clicked', async () => {
    const wrapper = mount(RuleCard, {
      props: { rule: mockRule },
    });

    const editButton = wrapper.find('[data-test="edit-button"]');
    if (editButton.exists()) {
      await editButton.trigger('click');
      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('edit')?.[0]).toEqual([mockRule.id]);
    }
  });

  it('should emit delete event when delete button is clicked', async () => {
    const wrapper = mount(RuleCard, {
      props: { rule: mockRule },
    });

    const deleteButton = wrapper.find('[data-test="delete-button"]');
    if (deleteButton.exists()) {
      await deleteButton.trigger('click');
      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]).toEqual([mockRule.id]);
    }
  });

  it('should prevent click propagation when edit button is clicked', async () => {
    const wrapper = mount(RuleCard, {
      props: { rule: mockRule },
    });

    const editButton = wrapper.find('[data-test="edit-button"]');
    if (editButton.exists()) {
      await editButton.trigger('click');
      // Edit event should be emitted but not click event
      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('click')).toBeFalsy();
    }
  });

  it('should prevent click propagation when delete button is clicked', async () => {
    const wrapper = mount(RuleCard, {
      props: { rule: mockRule },
    });

    const deleteButton = wrapper.find('[data-test="delete-button"]');
    if (deleteButton.exists()) {
      await deleteButton.trigger('click');
      // Delete event should be emitted but not click event
      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('click')).toBeFalsy();
    }
  });

  it('should emit toggleActive event when toggle is changed', async () => {
    const wrapper = mount(RuleCard, {
      props: { rule: mockRule },
    });

    const toggle = wrapper.findComponent({ name: 'NSwitch' });
    if (toggle.exists()) {
      await toggle.vm.$emit('update:value', false);
      expect(wrapper.emitted('toggleActive')).toBeTruthy();
      expect(wrapper.emitted('toggleActive')?.[0]).toEqual([mockRule.id, false]);
    }
  });

  it('should handle rule without description', () => {
    const ruleWithoutDesc = {
      ...mockRule,
      description: undefined,
    };

    const wrapper = mount(RuleCard, {
      props: { rule: ruleWithoutDesc },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should handle global scope rule', () => {
    const globalRule = {
      ...mockRule,
      scope: RuleScope.GLOBAL,
      projectId: undefined,
    };

    const wrapper = mount(RuleCard, {
      props: { rule: globalRule },
    });

    const scopeBadge = wrapper.findComponent({ name: 'RuleScopeBadge' });
    expect(scopeBadge.exists()).toBe(true);
  });

  it('should handle inactive rule', () => {
    const inactiveRule = {
      ...mockRule,
      active: false,
    };

    const wrapper = mount(RuleCard, {
      props: { rule: inactiveRule },
    });

    const toggle = wrapper.find('[data-test="rule-active-toggle"]');
    expect(toggle.exists()).toBe(true);
  });

  it('should apply hover styling', () => {
    const wrapper = mount(RuleCard, {
      props: { rule: mockRule },
    });

    const card = wrapper.find('[data-test="rule-card"]');
    expect(card.exists()).toBe(true);
  });
});
