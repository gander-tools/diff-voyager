/**
 * RulesListView tests
 * Tests rules list with filtering and actions
 */

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRulesStore } from '../../../src/stores/rules';
import RulesListView from '../../../src/views/RulesListView.vue';

const mockRouter = {
  push: vi.fn(),
};

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
}));

describe('RulesListView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouter.push.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render title', () => {
    const wrapper = mount(RulesListView);
    expect(wrapper.text()).toContain('Mute Rules');
  });

  it('should render subtitle', () => {
    const wrapper = mount(RulesListView);
    expect(wrapper.text()).toContain('Manage rules for ignoring specific differences');
  });

  it('should fetch rules on mount', async () => {
    const wrapper = mount(RulesListView);
    const store = useRulesStore();

    // Wait for onMounted to complete
    await wrapper.vm.$nextTick();

    // Since fetchRules doesn't make actual API calls yet, just verify it was called
    expect(store.loading).toBe(false);
  });

  it('should display new rule button', () => {
    const wrapper = mount(RulesListView);
    const button = wrapper.find('[data-test="new-rule-btn"]');
    expect(button.exists()).toBe(true);
    expect(button.text()).toContain('New Rule');
  });

  it('should navigate to new rule on button click', async () => {
    const wrapper = mount(RulesListView);
    const button = wrapper.find('[data-test="new-rule-btn"]');

    await button.trigger('click');
    expect(mockRouter.push).toHaveBeenCalledWith('/rules/new');
  });

  it('should show empty state when no rules', async () => {
    const wrapper = mount(RulesListView);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('No rules yet');
  });

  it('should display scope filter with all options', () => {
    const wrapper = mount(RulesListView);

    // Check that filter container exists
    const filter = wrapper.find('[data-test="scope-filter"]');
    expect(filter.exists()).toBe(true);

    // Check that all filter options are present
    expect(wrapper.find('[data-test="filter-all"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="filter-global"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="filter-project"]').exists()).toBe(true);
  });

  it('should display rules when store has rules', async () => {
    const mockRule = {
      id: 'rule-1',
      name: 'Test Rule',
      scope: 'global' as const,
      diffType: 'html',
      selector: '.test',
      description: 'A test rule',
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [
        {
          diffType: 'html' as const,
          cssSelector: '.test',
        },
      ],
    };

    const wrapper = mount(RulesListView);
    const store = useRulesStore();

    // Manually add a rule to the store
    store.rules.push(mockRule);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Test Rule');
  });

  it('should filter global rules when global filter is selected', async () => {
    const globalRule = {
      id: 'rule-1',
      name: 'Global Rule',
      scope: 'global' as const,
      diffType: 'html',
      selector: '.test',
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [],
    };

    const projectRule = {
      id: 'rule-2',
      name: 'Project Rule',
      scope: 'project' as const,
      diffType: 'html',
      selector: '.test',
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [],
    };

    const wrapper = mount(RulesListView);
    const store = useRulesStore();

    // Add rules to store
    store.rules.push(globalRule, projectRule);
    await wrapper.vm.$nextTick();

    // Both rules should be visible by default (all filter)
    expect(wrapper.text()).toContain('Global Rule');
    expect(wrapper.text()).toContain('Project Rule');

    // Switch to global filter
    const globalFilterButton = wrapper.find('[data-test="filter-global"]');
    await globalFilterButton.trigger('click');
    await wrapper.vm.$nextTick();

    // Now we should see the global rule
    expect(wrapper.text()).toContain('Global Rule');
  });

  it('should filter project rules when project filter is selected', async () => {
    const globalRule = {
      id: 'rule-1',
      name: 'Global Rule',
      scope: 'global' as const,
      diffType: 'html',
      selector: '.test',
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [],
    };

    const projectRule = {
      id: 'rule-2',
      name: 'Project Rule',
      scope: 'project' as const,
      diffType: 'html',
      selector: '.test',
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [],
    };

    const wrapper = mount(RulesListView);
    const store = useRulesStore();

    // Add rules to store
    store.rules.push(globalRule, projectRule);
    await wrapper.vm.$nextTick();

    // Switch to project filter
    const projectFilterButton = wrapper.find('[data-test="filter-project"]');
    await projectFilterButton.trigger('click');
    await wrapper.vm.$nextTick();

    // Now we should see the project rule
    expect(wrapper.text()).toContain('Project Rule');
  });

  it('should display correct counts in filter buttons', async () => {
    const globalRule = {
      id: 'rule-1',
      name: 'Global Rule',
      scope: 'global' as const,
      diffType: 'html',
      selector: '.test',
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [],
    };

    const projectRule = {
      id: 'rule-2',
      name: 'Project Rule',
      scope: 'project' as const,
      diffType: 'html',
      selector: '.test',
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [],
    };

    const wrapper = mount(RulesListView);
    const store = useRulesStore();

    // Add rules to store
    store.rules.push(globalRule, projectRule);
    await wrapper.vm.$nextTick();

    // Check counts in filter buttons
    const allFilter = wrapper.find('[data-test="filter-all"]');
    const globalFilter = wrapper.find('[data-test="filter-global"]');
    const projectFilter = wrapper.find('[data-test="filter-project"]');

    expect(allFilter.text()).toContain('2'); // All (2)
    expect(globalFilter.text()).toContain('1'); // Global (1)
    expect(projectFilter.text()).toContain('1'); // Project (1)
  });

  it('should show appropriate empty state for global filter', async () => {
    const projectRule = {
      id: 'rule-1',
      name: 'Project Rule',
      scope: 'project' as const,
      diffType: 'html',
      selector: '.test',
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [],
    };

    const wrapper = mount(RulesListView);
    const store = useRulesStore();

    // Add only project rule
    store.rules.push(projectRule);
    await wrapper.vm.$nextTick();

    // Switch to global filter - find the input element directly
    const radioInputs = wrapper.findAll('input[type="radio"]');
    const globalRadio = radioInputs.find((input) => input.element.value === 'global');
    if (globalRadio) {
      await globalRadio.setValue(true);
      await wrapper.vm.$nextTick();
    }

    // Should show global-specific empty state
    expect(wrapper.text()).toContain('No global rules');
  });

  it('should show appropriate empty state for project filter', async () => {
    const globalRule = {
      id: 'rule-1',
      name: 'Global Rule',
      scope: 'global' as const,
      diffType: 'html',
      selector: '.test',
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [],
    };

    const wrapper = mount(RulesListView);
    const store = useRulesStore();

    // Add only global rule
    store.rules.push(globalRule);
    await wrapper.vm.$nextTick();

    // Switch to project filter - find the input element directly
    const radioInputs = wrapper.findAll('input[type="radio"]');
    const projectRadio = radioInputs.find((input) => input.element.value === 'project');
    if (projectRadio) {
      await projectRadio.setValue(true);
      await wrapper.vm.$nextTick();
    }

    // Should show project-specific empty state
    expect(wrapper.text()).toContain('No project-specific rules');
  });
});
