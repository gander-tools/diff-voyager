<script setup lang="ts">
import { DiffSeverity, DiffStatus, DiffType } from '@gander-tools/diff-voyager-shared';
import { NBadge } from 'naive-ui';
import { computed } from 'vue';

type BadgeVariant = 'type' | 'severity' | 'status';

interface Props {
  variant: BadgeVariant;
  type?: DiffType;
  severity?: DiffSeverity;
  status?: DiffStatus;
  size?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
});

interface BadgeConfig {
  label: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'default';
}

const badgeConfig = computed<BadgeConfig>(() => {
  if (props.variant === 'type' && props.type) {
    const typeConfigs: Record<DiffType, BadgeConfig> = {
      [DiffType.SEO]: { label: 'SEO', type: 'info' },
      [DiffType.VISUAL]: { label: 'Visual', type: 'warning' },
      [DiffType.CONTENT]: { label: 'Content', type: 'info' },
      [DiffType.PERFORMANCE]: { label: 'Performance', type: 'warning' },
      [DiffType.HTTP_STATUS]: { label: 'HTTP Status', type: 'error' },
      [DiffType.HEADERS]: { label: 'Headers', type: 'info' },
    };
    return typeConfigs[props.type] || { label: String(props.type), type: 'default' };
  }

  if (props.variant === 'severity' && props.severity) {
    const severityConfigs: Record<DiffSeverity, BadgeConfig> = {
      [DiffSeverity.CRITICAL]: { label: 'Critical', type: 'error' },
      [DiffSeverity.WARNING]: { label: 'Warning', type: 'warning' },
      [DiffSeverity.INFO]: { label: 'Info', type: 'info' },
    };
    return severityConfigs[props.severity] || { label: String(props.severity), type: 'default' };
  }

  if (props.variant === 'status' && props.status) {
    const statusConfigs: Record<DiffStatus, BadgeConfig> = {
      [DiffStatus.NEW]: { label: 'New', type: 'warning' },
      [DiffStatus.ACCEPTED]: { label: 'Accepted', type: 'success' },
      [DiffStatus.MUTED]: { label: 'Muted', type: 'default' },
    };
    return statusConfigs[props.status] || { label: String(props.status), type: 'default' };
  }

  return { label: 'Unknown', type: 'default' };
});
</script>

<template>
  <NBadge
    :value="badgeConfig.label"
    :type="badgeConfig.type"
    :size="size"
    data-test="diff-badge"
  />
</template>

<style scoped>
/* Additional styles can be added here if needed */
</style>
