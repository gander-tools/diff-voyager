<script setup lang="ts">
import { NButton, NEmpty, NRadioButton, NRadioGroup, NSpace, NSpin } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import RuleCard from '../components/RuleCard.vue';
import type { MuteRule } from '../stores/rules';
import { useRulesStore } from '../stores/rules';

const { t } = useI18n();

const router = useRouter();
const rulesStore = useRulesStore();

// Filter state: 'all', 'global', 'project'
const scopeFilter = ref<'all' | 'global' | 'project'>('all');

onMounted(async () => {
  try {
    await rulesStore.fetchRules();
  } catch (error) {
    console.error('Failed to fetch rules:', error);
  }
});

// Computed filtered rules based on scope filter
const filteredRules = computed(() => {
  if (scopeFilter.value === 'all') {
    return rulesStore.rules;
  }
  if (scopeFilter.value === 'global') {
    return rulesStore.globalRules;
  }
  return rulesStore.projectRules;
});

const handleNewRule = () => {
  router.push('/rules/new');
};

const handleRuleClick = (rule: MuteRule) => {
  // TODO: Navigate to rule detail/edit view when implemented
  console.log('Rule clicked:', rule);
};

const handleEditRule = (id: string) => {
  // TODO: Navigate to rule edit view when implemented
  console.log('Edit rule:', id);
};

const handleDeleteRule = async (id: string) => {
  try {
    await rulesStore.deleteRule(id);
  } catch (error) {
    console.error('Failed to delete rule:', error);
  }
};

const handleToggleActive = async (id: string, active: boolean) => {
  try {
    await rulesStore.updateRule(id, { active });
  } catch (error) {
    console.error('Failed to toggle rule:', error);
  }
};
</script>

<template>
  <div class="rules-list">
    <div class="header">
      <div>
        <h1>{{ t('rules.title') }}</h1>
        <p class="subtitle">{{ t('rules.subtitle') }}</p>
      </div>
      <NButton type="primary" data-test="new-rule-btn" @click="handleNewRule">
        + {{ t('rules.create') }}
      </NButton>
    </div>

    <!-- Scope Filter -->
    <div class="filters">
      <NSpace align="center">
        <span class="filter-label">{{ t('rules.filterByScope') }}</span>
        <NRadioGroup v-model:value="scopeFilter" data-test="scope-filter">
          <NRadioButton value="all" data-test="filter-all">
            {{ t('rules.scopeAll') }} ({{ rulesStore.rulesCount }})
          </NRadioButton>
          <NRadioButton value="global" data-test="filter-global">
            {{ t('rules.scopeGlobal') }} ({{ rulesStore.globalRules.length }})
          </NRadioButton>
          <NRadioButton value="project" data-test="filter-project">
            {{ t('rules.scopeProject') }} ({{ rulesStore.projectRules.length }})
          </NRadioButton>
        </NRadioGroup>
      </NSpace>
    </div>

    <NSpin :show="rulesStore.loading">
      <div v-if="rulesStore.loading" class="loading-container">
        <p>{{ t('rules.loadingRules') }}</p>
      </div>

      <div v-else>
        <div v-if="filteredRules.length === 0" class="empty-state">
          <NEmpty
            v-if="scopeFilter === 'all'"
            :description="t('rules.createFirst')"
          />
          <NEmpty
            v-else-if="scopeFilter === 'global'"
            :description="t('rules.noGlobalRules')"
          />
          <NEmpty
            v-else
            :description="t('rules.noProjectRules')"
          />
        </div>

        <div v-else class="rules-container">
          <RuleCard
            v-for="rule in filteredRules"
            :key="rule.id"
            :rule="rule"
            @click="handleRuleClick(rule)"
            @edit="handleEditRule"
            @delete="handleDeleteRule"
            @toggle-active="handleToggleActive"
          />
        </div>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.rules-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.filters {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.filter-label {
  font-weight: 500;
  color: #333;
}

.loading-container {
  padding: 48px;
  text-align: center;
}

.empty-state {
  padding: 48px;
  text-align: center;
}

.rules-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
