/**
 * RuleCreateView tests
 * Tests rule creation form with validation
 */

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { useRulesStore } from '../../../src/stores/rules';
import RuleCreateView from '../../../src/views/RuleCreateView.vue';

const mockRouter = {
  push: vi.fn(),
};

const mockRoute = {
  query: {},
};

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRoute,
}));

describe('RuleCreateView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRouter.push.mockClear();
    mockRoute.query = {};
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render page header with title', () => {
    const wrapper = mount(RuleCreateView);
    expect(wrapper.text()).toContain('Create New Rule');
  });

  it('should render page header with subtitle', () => {
    const wrapper = mount(RuleCreateView);
    expect(wrapper.text()).toContain('Define conditions to mute or accept differences');
  });

  it('should render RuleForm component', () => {
    const wrapper = mount(RuleCreateView);
    // RuleForm should be present in the component
    expect(wrapper.findComponent({ name: 'RuleForm' }).exists()).toBe(true);
  });

  it('should render back button', () => {
    const wrapper = mount(RuleCreateView);
    const backButton = wrapper.find('[data-test="back-button"]');
    expect(backButton.exists()).toBe(true);
    expect(backButton.text()).toContain('Cancel');
  });

  it('should navigate back to rules list when back button clicked', async () => {
    const wrapper = mount(RuleCreateView);
    const backButton = wrapper.find('[data-test="back-button"]');

    await backButton.trigger('click');
    expect(mockRouter.push).toHaveBeenCalledWith({ name: 'rules' });
  });

  it('should pass projectId to RuleForm when provided in query', () => {
    mockRoute.query = { projectId: 'test-project-123' };
    const wrapper = mount(RuleCreateView);

    const ruleForm = wrapper.findComponent({ name: 'RuleForm' });
    expect(ruleForm.props('projectId')).toBe('test-project-123');
  });

  it('should not pass projectId to RuleForm when not in query', () => {
    mockRoute.query = {};
    const wrapper = mount(RuleCreateView);

    const ruleForm = wrapper.findComponent({ name: 'RuleForm' });
    expect(ruleForm.props('projectId')).toBeUndefined();
  });

  it('should handle form submission', async () => {
    const rulesStore = useRulesStore();
    const createRuleSpy = vi.spyOn(rulesStore, 'createRule');

    const wrapper = mount(RuleCreateView);
    const ruleForm = wrapper.findComponent({ name: 'RuleForm' });

    const formData = {
      name: 'Test Rule',
      scope: 'global' as const,
      active: true,
      description: 'Test description',
      conditions: {
        operator: 'and' as const,
        conditions: [],
      },
    };

    // Emit submit event from RuleForm
    await ruleForm.vm.$emit('submit', formData);
    await nextTick();

    expect(createRuleSpy).toHaveBeenCalledWith(formData);
  });

  it('should navigate to rules list after successful creation', async () => {
    const rulesStore = useRulesStore();
    vi.spyOn(rulesStore, 'createRule').mockResolvedValue({
      id: 'rule-123',
      name: 'Test Rule',
      scope: 'global',
      active: true,
      conditions: { operator: 'and', conditions: [] },
      createdAt: '2024-01-01T00:00:00Z',
    });

    const wrapper = mount(RuleCreateView);
    const ruleForm = wrapper.findComponent({ name: 'RuleForm' });

    const formData = {
      name: 'Test Rule',
      scope: 'global' as const,
      active: true,
      description: 'Test description',
      conditions: {
        operator: 'and' as const,
        conditions: [],
      },
    };

    // Emit submit event
    await ruleForm.vm.$emit('submit', formData);
    await nextTick();

    // Should navigate to rules list
    expect(mockRouter.push).toHaveBeenCalledWith({ name: 'rules' });
  });

  it('should handle form cancellation', async () => {
    const wrapper = mount(RuleCreateView);
    const ruleForm = wrapper.findComponent({ name: 'RuleForm' });

    // Emit cancel event from RuleForm
    await ruleForm.vm.$emit('cancel');
    await nextTick();

    expect(mockRouter.push).toHaveBeenCalledWith({ name: 'rules' });
  });

  it('should pass loading state to RuleForm during creation', async () => {
    const rulesStore = useRulesStore();

    // Mock createRule to be slow
    vi.spyOn(rulesStore, 'createRule').mockImplementation(async () => {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 10));
      return {
        id: 'rule-123',
        name: 'Test Rule',
        scope: 'global',
        active: true,
        conditions: { operator: 'and', conditions: [] },
        createdAt: '2024-01-01T00:00:00Z',
      };
    });

    const wrapper = mount(RuleCreateView);
    const ruleForm = wrapper.findComponent({ name: 'RuleForm' });

    const formData = {
      name: 'Test Rule',
      scope: 'global' as const,
      active: true,
      conditions: {
        operator: 'and' as const,
        conditions: [],
      },
    };

    // Emit submit - should set loading to true
    const submitPromise = ruleForm.vm.$emit('submit', formData);
    await nextTick();

    // Loading should be true while creating
    expect(ruleForm.props('loading')).toBe(true);

    // Wait for promise to resolve
    await submitPromise;
    await nextTick();

    // Loading should be false after completion
    await vi.waitFor(() => {
      expect(ruleForm.props('loading')).toBe(false);
    });
  });

  it('should display error message on creation failure', async () => {
    const rulesStore = useRulesStore();
    const error = new Error('Failed to create rule');
    vi.spyOn(rulesStore, 'createRule').mockRejectedValue(error);
    vi.spyOn(console, 'error').mockImplementation(() => {
      // Suppress console.error output in test
    });

    const wrapper = mount(RuleCreateView);
    const ruleForm = wrapper.findComponent({ name: 'RuleForm' });

    const formData = {
      name: 'Test Rule',
      scope: 'global' as const,
      active: true,
      conditions: {
        operator: 'and' as const,
        conditions: [],
      },
    };

    // Emit submit event
    await ruleForm.vm.$emit('submit', formData);
    await nextTick();

    // Should pass error to form
    expect(ruleForm.props('submitError')).toBe('Failed to create rule');
  });
});
