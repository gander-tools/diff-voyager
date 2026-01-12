<script setup lang="ts">
import type { DiffSummary as DiffSummaryType, DiffType } from '@gander-tools/diff-voyager-shared';
import { NGrid, NGridItem, NStatistic, NText } from 'naive-ui';
import { computed } from 'vue';

interface Props {
  summary: DiffSummaryType;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
});

// Computed property to format visual diff percentage
const visualDiffFormatted = computed(() => {
  if (props.summary.visualDiffPercentage === undefined) {
    return 'N/A';
  }
  return `${props.summary.visualDiffPercentage.toFixed(2)}%`;
});

// Type labels for better display
const typeLabels: Record<DiffType, string> = {
  seo: 'SEO',
  visual: 'Visual',
  content: 'Content',
  performance: 'Performance',
  http_status: 'HTTP Status',
  headers: 'Headers',
};

// Get count for a specific type with fallback to 0
const getTypeCount = (type: DiffType): number => {
  return props.summary.changesByType[type] || 0;
};
</script>

<template>
  <div data-test="diff-summary">
    <!-- Main Statistics -->
    <NGrid :cols="compact ? 2 : 4" :x-gap="12" :y-gap="12" data-test="main-statistics">
      <NGridItem>
        <NStatistic label="Total Changes" :value="summary.totalChanges" />
      </NGridItem>

      <NGridItem>
        <NStatistic label="Critical" :value="summary.criticalChanges" />
      </NGridItem>

      <NGridItem>
        <NStatistic label="Accepted" :value="summary.acceptedChanges" />
      </NGridItem>

      <NGridItem>
        <NStatistic label="Muted" :value="summary.mutedChanges" />
      </NGridItem>
    </NGrid>

    <!-- Visual Diff Section (if available) -->
    <div v-if="summary.visualDiffPercentage !== undefined" style="margin-top: 16px">
      <NGrid :cols="compact ? 1 : 2" :x-gap="12" :y-gap="12" data-test="visual-diff-statistics">
        <NGridItem>
          <NStatistic label="Visual Diff %" :value="visualDiffFormatted" />
        </NGridItem>

        <NGridItem v-if="summary.visualDiffPixels !== undefined">
          <NStatistic label="Pixels Changed" :value="summary.visualDiffPixels" />
        </NGridItem>
      </NGrid>

      <div v-if="summary.thresholdExceeded" style="margin-top: 8px">
        <NText type="warning" data-test="threshold-warning">
          ⚠ Visual difference threshold exceeded
        </NText>
      </div>
    </div>

    <!-- Changes by Type -->
    <div v-if="summary.changesByType && Object.keys(summary.changesByType).length > 0" style="margin-top: 16px">
      <NText strong style="display: block; margin-bottom: 12px">
        Changes by Type
      </NText>

      <NGrid :cols="compact ? 2 : 3" :x-gap="12" :y-gap="12" data-test="type-breakdown">
        <NGridItem v-for="(label, type) in typeLabels" :key="type">
          <NStatistic :label="label" :value="getTypeCount(type as DiffType)" />
        </NGridItem>
      </NGrid>
    </div>
  </div>
</template>

<style scoped>
/* NGrid and NStatistic styles are handled by Naive UI */
</style>
