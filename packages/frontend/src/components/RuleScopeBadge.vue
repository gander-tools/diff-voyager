<script setup lang="ts">
import { RuleScope } from '@gander-tools/diff-voyager-shared';
import { NBadge } from 'naive-ui';
import { computed } from 'vue';

interface Props {
  scope: RuleScope;
  size?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
});

interface ScopeConfig {
  label: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'default';
}

const scopeConfig = computed<ScopeConfig>(() => {
  const configs: Record<RuleScope, ScopeConfig> = {
    [RuleScope.GLOBAL]: { label: 'Global', type: 'info' },
    [RuleScope.PROJECT]: { label: 'Project', type: 'default' },
  };

  return configs[props.scope] || { label: String(props.scope), type: 'default' };
});
</script>

<template>
  <NBadge
    :value="scopeConfig.label"
    :type="scopeConfig.type"
    :size="size"
    data-test="rule-scope-badge"
  />
</template>

<style scoped>
/* NBadge styles are handled by Naive UI */
</style>
