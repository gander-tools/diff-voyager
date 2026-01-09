import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export type MuteRule = {
  id: string;
  name: string;
  scope: 'global' | 'project';
  diffType: string;
  selector: string;
  description?: string;
  createdAt: string;
};

export type CreateRuleInput = Omit<MuteRule, 'id' | 'createdAt'>;

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
      // TODO: Implement API call when backend endpoint is available
      // rules.value = await api.listRules();
      console.log('Fetch rules - API not implemented yet');
      rules.value = []; // Placeholder
    } catch (err) {
      error.value = (err as Error).message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createRule(input: CreateRuleInput) {
    loading.value = true;
    error.value = null;

    try {
      // TODO: Implement API call when backend endpoint is available
      // const rule = await api.createRule(input);
      console.log('Create rule:', input);

      // Temporary: Add to local state
      const rule: MuteRule = {
        ...input,
        id: `rule-${Date.now()}`,
        createdAt: new Date().toISOString(),
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
      // TODO: Implement API call when backend endpoint is available
      // const rule = await api.updateRule(id, input);
      console.log('Update rule:', id, input);

      // Temporary: Update local state
      const index = rules.value.findIndex((r) => r.id === id);
      if (index !== -1) {
        rules.value[index] = { ...rules.value[index], ...input } as MuteRule;
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
      // TODO: Implement API call when backend endpoint is available
      // await api.deleteRule(id);
      console.log('Delete rule:', id);

      // Temporary: Remove from local state
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
