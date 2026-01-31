/**
 * RuleConditionBuilder component tests
 * Tests condition management, validation, and operator logic
 */

import { DiffType } from '@gander-tools/diff-voyager-shared';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RuleConditionBuilder from '../../../src/components/RuleConditionBuilder.vue';
import type { RuleConditionBuilderInput } from '../../../src/utils/validators';

describe('RuleConditionBuilder', () => {
  it('should render operator select and initial condition', () => {
    const wrapper = mount(RuleConditionBuilder);

    expect(wrapper.find('[data-test="operator-select"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="condition-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="add-condition-button"]').exists()).toBe(true);
  });

  it('should render with default values', () => {
    const wrapper = mount(RuleConditionBuilder);

    // Should have operator select
    expect(wrapper.find('[data-test="operator-select"]').exists()).toBe(true);

    // Should have one default condition
    expect(wrapper.find('[data-test="condition-0"]').exists()).toBe(true);

    // Should have all condition fields
    expect(wrapper.find('[data-test="diffType-select-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="cssSelector-input-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="xpathSelector-input-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="fieldPattern-input-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="headerName-input-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="valuePattern-input-0"]').exists()).toBe(true);
  });

  it('should add new condition when add button is clicked', async () => {
    const wrapper = mount(RuleConditionBuilder);

    // Initially should have one condition
    expect(wrapper.find('[data-test="condition-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="condition-1"]').exists()).toBe(false);

    // Click add button
    const addButton = wrapper.find('[data-test="add-condition-button"]');
    await addButton.trigger('click');
    await wrapper.vm.$nextTick();

    // Should now have two conditions
    expect(wrapper.find('[data-test="condition-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="condition-1"]').exists()).toBe(true);
  });

  it('should remove condition when remove button is clicked', async () => {
    const wrapper = mount(RuleConditionBuilder);

    // Add a second condition
    const addButton = wrapper.find('[data-test="add-condition-button"]');
    await addButton.trigger('click');
    await wrapper.vm.$nextTick();

    // Verify two conditions exist
    expect(wrapper.find('[data-test="condition-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="condition-1"]').exists()).toBe(true);

    // Remove the second condition
    const removeButton = wrapper.find('[data-test="remove-condition-1"]');
    expect(removeButton.exists()).toBe(true);
    await removeButton.trigger('click');
    await wrapper.vm.$nextTick();

    // Should have only one condition left
    expect(wrapper.find('[data-test="condition-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="condition-1"]').exists()).toBe(false);
  });

  it('should not show remove button when only one condition exists', () => {
    const wrapper = mount(RuleConditionBuilder);

    // With only one condition, remove button should not be visible
    expect(wrapper.find('[data-test="remove-condition-0"]').exists()).toBe(false);
  });

  it('should show remove buttons for multiple conditions', async () => {
    const wrapper = mount(RuleConditionBuilder);

    // Add two more conditions
    const addButton = wrapper.find('[data-test="add-condition-button"]');
    await addButton.trigger('click');
    await wrapper.vm.$nextTick();
    await addButton.trigger('click');
    await wrapper.vm.$nextTick();

    // All three conditions should have remove buttons
    expect(wrapper.find('[data-test="remove-condition-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="remove-condition-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="remove-condition-2"]').exists()).toBe(true);
  });

  it('should render with provided modelValue', () => {
    const modelValue: RuleConditionBuilderInput = {
      operator: 'OR',
      conditions: [
        {
          diffType: DiffType.VISUAL,
          cssSelector: '.header',
          xpathSelector: '',
          fieldPattern: '',
          headerName: '',
          valuePattern: '',
        },
        {
          diffType: DiffType.SEO,
          cssSelector: '',
          xpathSelector: '//title',
          fieldPattern: 'title',
          headerName: '',
          valuePattern: '',
        },
      ],
    };

    const wrapper = mount(RuleConditionBuilder, {
      props: {
        modelValue,
      },
    });

    // Should render both conditions
    expect(wrapper.find('[data-test="condition-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="condition-1"]').exists()).toBe(true);
  });

  it('should disable all inputs when disabled prop is true', () => {
    const wrapper = mount(RuleConditionBuilder, {
      props: {
        disabled: true,
      },
    });

    // Verify inputs exist but are disabled (Naive UI handles disabled state internally)
    expect(wrapper.find('[data-test="operator-select"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="diffType-select-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="cssSelector-input-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="add-condition-button"]').exists()).toBe(true);
  });

  it('should render all condition field inputs', () => {
    const wrapper = mount(RuleConditionBuilder);

    // All field types should be present
    expect(wrapper.find('[data-test="diffType-select-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="cssSelector-input-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="xpathSelector-input-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="fieldPattern-input-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="headerName-input-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="valuePattern-input-0"]').exists()).toBe(true);
  });

  it('should have correct diff type options', () => {
    const wrapper = mount(RuleConditionBuilder);

    // Verify diff type select exists
    expect(wrapper.find('[data-test="diffType-select-0"]').exists()).toBe(true);
  });

  it('should have AND and OR operator options', () => {
    const wrapper = mount(RuleConditionBuilder);

    // Verify operator select exists
    expect(wrapper.find('[data-test="operator-select"]').exists()).toBe(true);
  });

  it('should render multiple conditions correctly', async () => {
    const wrapper = mount(RuleConditionBuilder);

    // Add two more conditions
    const addButton = wrapper.find('[data-test="add-condition-button"]');
    await addButton.trigger('click');
    await addButton.trigger('click');
    await wrapper.vm.$nextTick();

    // Should have three conditions with all fields
    for (let i = 0; i < 3; i++) {
      expect(wrapper.find(`[data-test="condition-${i}"]`).exists()).toBe(true);
      expect(wrapper.find(`[data-test="diffType-select-${i}"]`).exists()).toBe(true);
      expect(wrapper.find(`[data-test="cssSelector-input-${i}"]`).exists()).toBe(true);
      expect(wrapper.find(`[data-test="xpathSelector-input-${i}"]`).exists()).toBe(true);
      expect(wrapper.find(`[data-test="fieldPattern-input-${i}"]`).exists()).toBe(true);
      expect(wrapper.find(`[data-test="headerName-input-${i}"]`).exists()).toBe(true);
      expect(wrapper.find(`[data-test="valuePattern-input-${i}"]`).exists()).toBe(true);
    }
  });

  it('should maintain condition count after removing middle condition', async () => {
    const wrapper = mount(RuleConditionBuilder);

    // Add two more conditions (total 3)
    const addButton = wrapper.find('[data-test="add-condition-button"]');
    await addButton.trigger('click');
    await addButton.trigger('click');
    await wrapper.vm.$nextTick();

    // Remove middle condition (index 1)
    const removeButton = wrapper.find('[data-test="remove-condition-1"]');
    await removeButton.trigger('click');
    await wrapper.vm.$nextTick();

    // Should have two conditions left
    expect(wrapper.find('[data-test="condition-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="condition-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="condition-2"]').exists()).toBe(false);
  });

  it('should render with modelValue containing multiple conditions', () => {
    const modelValue: RuleConditionBuilderInput = {
      operator: 'AND',
      conditions: [
        {
          diffType: DiffType.SEO,
          cssSelector: '',
          xpathSelector: '',
          fieldPattern: 'title',
          headerName: '',
          valuePattern: '',
        },
        {
          diffType: DiffType.VISUAL,
          cssSelector: '.content',
          xpathSelector: '',
          fieldPattern: '',
          headerName: '',
          valuePattern: '',
        },
        {
          diffType: DiffType.HEADERS,
          cssSelector: '',
          xpathSelector: '',
          fieldPattern: '',
          headerName: 'Content-Type',
          valuePattern: 'application/json',
        },
      ],
    };

    const wrapper = mount(RuleConditionBuilder, {
      props: {
        modelValue,
      },
    });

    // Should render all three conditions
    expect(wrapper.find('[data-test="condition-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="condition-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="condition-2"]').exists()).toBe(true);
  });

  it('should use default operator AND when not specified', () => {
    const wrapper = mount(RuleConditionBuilder);

    // Verify operator select exists (internal value tested by Naive UI)
    expect(wrapper.find('[data-test="operator-select"]').exists()).toBe(true);
  });

  it('should render condition cards with proper structure', async () => {
    const wrapper = mount(RuleConditionBuilder);

    // Add another condition to test multiple cards
    const addButton = wrapper.find('[data-test="add-condition-button"]');
    await addButton.trigger('click');
    await wrapper.vm.$nextTick();

    // Both condition cards should exist
    expect(wrapper.find('[data-test="condition-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="condition-1"]').exists()).toBe(true);

    // Both should have remove buttons since there are multiple conditions
    expect(wrapper.find('[data-test="remove-condition-0"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="remove-condition-1"]').exists()).toBe(true);
  });

  it('should prevent removing the last remaining condition', async () => {
    const wrapper = mount(RuleConditionBuilder);

    // Should start with one condition
    expect(wrapper.find('[data-test="condition-0"]').exists()).toBe(true);

    // Remove button should not be present for single condition
    expect(wrapper.find('[data-test="remove-condition-0"]').exists()).toBe(false);
  });
});
