import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { rulesApi } from '../services/api';
import type { CreateRuleInput, RuleConditionBuilderInput } from '../utils/validators';

export type MuteRule = {
  id: string;
  name: string;
  scope: 'global' | 'project';
  description?: string;
  active: boolean;
  conditions: RuleConditionBuilderInput;
  createdAt: string;
  updatedAt?: string;
};

/**
 * Rules Store
 * Manages mute rules state
 */
export const useRulesStore = defineStore('rules', () => {
  // State
  const rules = ref<MuteRule[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const rulesCount = computed(() => rules.value.length);
  const globalRules = computed(() => rules.value.filter((r) => r.scope === 'global'));
  const projectRules = computed(() => rules.value.filter((r) => r.scope === 'project'));

  // Actions
  async function fetchRules() {
    loading.value = true;
    error.value = null;

    try {
      const response = await rulesApi.listRules();
      rules.value = response.rules.map((r) => ({
        id: r.id,
        name: r.name,
        scope: r.scope,
        description: r.description,
        active: r.active,
        conditions: {
          operator: 'AND' as const,
          conditions: r.conditions,
        },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createRule(input: CreateRuleInput & { projectId?: string }) {
    loading.value = true;
    error.value = null;

    try {
      const createdRule = await rulesApi.createRule({
        projectId: input.projectId,
        name: input.name,
        description: input.description,
        scope: input.scope,
        active: input.active,
        conditions: input.conditions.conditions,
      });

      const rule: MuteRule = {
        id: createdRule.id,
        name: createdRule.name,
        scope: createdRule.scope,
        description: createdRule.description,
        active: createdRule.active,
        conditions: {
          operator: 'AND' as const,
          conditions: createdRule.conditions,
        },
        createdAt: createdRule.createdAt,
        updatedAt: createdRule.updatedAt,
      };

      rules.value.push(rule);
      return rule;
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateRule(id: string, input: Partial<CreateRuleInput>) {
    loading.value = true;
    error.value = null;

    try {
      const updatedRule = await rulesApi.updateRule(id, {
        name: input.name,
        description: input.description,
        active: input.active,
        conditions: input.conditions?.conditions,
      });

      const index = rules.value.findIndex((r) => r.id === id);
      if (index !== -1) {
        rules.value[index] = {
          id: updatedRule.id,
          name: updatedRule.name,
          scope: updatedRule.scope,
          description: updatedRule.description,
          active: updatedRule.active,
          conditions: {
            operator: 'AND' as const,
            conditions: updatedRule.conditions,
          },
          createdAt: updatedRule.createdAt,
          updatedAt: updatedRule.updatedAt,
        };
      }
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteRule(id: string) {
    loading.value = true;
    error.value = null;

    try {
      await rulesApi.deleteRule(id);
      rules.value = rules.value.filter((r) => r.id !== id);
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    rules,
    loading,
    error,

    // Computed
    rulesCount,
    globalRules,
    projectRules,

    // Actions
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    clearError,
  };
});
