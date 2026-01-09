<script setup lang="ts">
import { NBadge } from 'naive-ui';
import { computed } from 'vue';

interface Props {
  status: string;
  size?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
});

interface StatusConfig {
  label: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'default';
}

const statusConfig = computed<StatusConfig>(() => {
  const configs: Record<string, StatusConfig> = {
    new: { label: 'New', type: 'info' },
    in_progress: { label: 'In Progress', type: 'warning' },
    completed: { label: 'Completed', type: 'success' },
    failed: { label: 'Failed', type: 'error' },
    interrupted: { label: 'Interrupted', type: 'warning' },
  };

  return configs[props.status] || { label: 'Unknown', type: 'default' };
});
</script>

<template>
  <NBadge
    :value="statusConfig.label"
    :type="statusConfig.type"
    :size="size"
    data-test="status-badge"
  />
</template>

<style scoped>
/* NBadge styles are handled by Naive UI */
</style>
