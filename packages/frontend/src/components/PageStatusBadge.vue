<script setup lang="ts">
import { PageStatus } from '@gander-tools/diff-voyager-shared';
import { NBadge } from 'naive-ui';
import { computed } from 'vue';

interface Props {
  status: PageStatus;
  size?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
});

interface StatusConfig {
  label: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'default';
  animated: boolean;
}

const statusConfig = computed<StatusConfig>(() => {
  const configs: Record<PageStatus, StatusConfig> = {
    [PageStatus.PENDING]: { label: 'Pending', type: 'default', animated: false },
    [PageStatus.IN_PROGRESS]: { label: 'Processing', type: 'info', animated: true },
    [PageStatus.COMPLETED]: { label: 'Completed', type: 'success', animated: false },
    [PageStatus.PARTIAL]: { label: 'Partial', type: 'warning', animated: false },
    [PageStatus.ERROR]: { label: 'Error', type: 'error', animated: false },
  };

  return configs[props.status] || { label: String(props.status), type: 'default', animated: false };
});
</script>

<template>
  <span :class="{ 'badge-animated': statusConfig.animated }">
    <NBadge
      :value="statusConfig.label"
      :type="statusConfig.type"
      :size="size"
      data-test="page-status-badge"
    />
  </span>
</template>

<style scoped>
.badge-animated {
  display: inline-block;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
