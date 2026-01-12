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
    pending: { label: 'Pending', type: 'default' },
    in_progress: { label: 'In Progress', type: 'warning' },
    completed: { label: 'Completed', type: 'success' },
    error: { label: 'Error', type: 'error' },
    failed: { label: 'Failed', type: 'error' },
    cancelled: { label: 'Cancelled', type: 'default' },
    interrupted: { label: 'Interrupted', type: 'warning' },
  };

  return configs[props.status] || { label: props.status, type: 'default' };
});
</script>

<template>
  <NBadge
    :value="statusConfig.label"
    :type="statusConfig.type"
    :size="size"
    data-test="run-status-badge"
  />
</template>

<style scoped>
/* NBadge styles are handled by Naive UI */
</style>
