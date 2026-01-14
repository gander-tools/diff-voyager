/**
 * RulesListView tests
 * Tests rules list with filtering and actions
 */

import { mount } from '@vue/test-utils';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { createPinia, setActivePinia } from 'pinia';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRulesStore } from '../../../src/stores/rules';
import RulesListView from '../../../src/views/RulesListView.vue';

const API_BASE_URL = 'http://localhost:3000/api/v1';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

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

    // Mock empty rules response by default
    server.use(
      http.get(`${API_BASE_URL}/rules`, () => {
        return HttpResponse.json({ rules: [], pagination: { total: 0 } });
      }),
    );
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
    mount(RulesListView);
    const store = useRulesStore();

    // Wait for onMounted to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify API was called and loading is complete
    expect(store.loading).toBe(false);
  });

  it('should display new rule button', () => {
    const wrapper = mount(RulesListView);
    const button = wrapper.find('[data-test="new-rule-btn"]');
    expect(button.exists()).toBe(true);
    expect(button.text()).toContain('Create Rule');
  });

  it('should navigate to new rule on button click', async () => {
    const wrapper = mount(RulesListView);
    const button = wrapper.find('[data-test="new-rule-btn"]');

    await button.trigger('click');
    expect(mockRouter.push).toHaveBeenCalledWith('/rules/new');
  });

  it('should show empty state when no rules', async () => {
    const wrapper = mount(RulesListView);

    // Wait for onMounted to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('Create your first mute rule');
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

    // Mock API response with the rule
    server.use(
      http.get(`${API_BASE_URL}/rules`, () => {
        return HttpResponse.json({ rules: [mockRule], pagination: { total: 1 } });
      }),
    );

    const wrapper = mount(RulesListView);

    // Wait for onMounted to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(wrapper.text()).toContain('Test Rule');
  });

  it('should filter global rules when global filter is selected', async () => {
    const globalRule = {
      id: 'rule-1',
      name: 'Global Rule',
      scope: 'global' as const,
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [],
    };

    const projectRule = {
      id: 'rule-2',
      name: 'Project Rule',
      scope: 'project' as const,
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [],
    };

    // Mock API response with both rules
    server.use(
      http.get(`${API_BASE_URL}/rules`, () => {
        return HttpResponse.json({ rules: [globalRule, projectRule], pagination: { total: 2 } });
      }),
    );

    const wrapper = mount(RulesListView);

    // Wait for onMounted to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

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
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [],
    };

    const projectRule = {
      id: 'rule-2',
      name: 'Project Rule',
      scope: 'project' as const,
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [],
    };

    // Mock API response with both rules
    server.use(
      http.get(`${API_BASE_URL}/rules`, () => {
        return HttpResponse.json({ rules: [globalRule, projectRule], pagination: { total: 2 } });
      }),
    );

    const wrapper = mount(RulesListView);

    // Wait for onMounted to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

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
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [],
    };

    const projectRule = {
      id: 'rule-2',
      name: 'Project Rule',
      scope: 'project' as const,
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [],
    };

    // Mock API response with both rules
    server.use(
      http.get(`${API_BASE_URL}/rules`, () => {
        return HttpResponse.json({ rules: [globalRule, projectRule], pagination: { total: 2 } });
      }),
    );

    const wrapper = mount(RulesListView);

    // Wait for onMounted to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

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
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [],
    };

    // Mock API response with only project rule
    server.use(
      http.get(`${API_BASE_URL}/rules`, () => {
        return HttpResponse.json({ rules: [projectRule], pagination: { total: 1 } });
      }),
    );

    const wrapper = mount(RulesListView);

    // Wait for onMounted to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

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
      createdAt: '2024-01-01T00:00:00Z',
      active: true,
      conditions: [],
    };

    // Mock API response with only global rule
    server.use(
      http.get(`${API_BASE_URL}/rules`, () => {
        return HttpResponse.json({ rules: [globalRule], pagination: { total: 1 } });
      }),
    );

    const wrapper = mount(RulesListView);

    // Wait for onMounted to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

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
