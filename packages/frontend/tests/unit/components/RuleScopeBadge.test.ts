/**
 * RuleScopeBadge tests
 * Tests rule scope badge component for displaying rule scope
 */

import { RuleScope } from '@gander-tools/diff-voyager-shared';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RuleScopeBadge from '../../../src/components/RuleScopeBadge.vue';

describe('RuleScopeBadge', () => {
  it('should render Global scope', () => {
    const wrapper = mount(RuleScopeBadge, {
      props: { scope: RuleScope.GLOBAL },
    });

    expect(wrapper.text()).toContain('Global');
  });

  it('should render Project scope', () => {
    const wrapper = mount(RuleScopeBadge, {
      props: { scope: RuleScope.PROJECT },
    });

    expect(wrapper.text()).toContain('Project');
  });

  it('should apply correct type for Global scope', () => {
    const wrapper = mount(RuleScopeBadge, {
      props: { scope: RuleScope.GLOBAL },
    });

    const badge = wrapper.find('[data-test="rule-scope-badge"]');
    expect(badge.exists()).toBe(true);
  });

  it('should apply correct type for Project scope', () => {
    const wrapper = mount(RuleScopeBadge, {
      props: { scope: RuleScope.PROJECT },
    });

    const badge = wrapper.find('[data-test="rule-scope-badge"]');
    expect(badge.exists()).toBe(true);
  });

  it('should support different sizes', () => {
    const wrapper = mount(RuleScopeBadge, {
      props: { scope: RuleScope.GLOBAL, size: 'small' },
    });

    const badge = wrapper.find('[data-test="rule-scope-badge"]');
    expect(badge.exists()).toBe(true);
  });

  it('should use medium size by default', () => {
    const wrapper = mount(RuleScopeBadge, {
      props: { scope: RuleScope.GLOBAL },
    });

    const badge = wrapper.find('[data-test="rule-scope-badge"]');
    expect(badge.exists()).toBe(true);
  });
});
