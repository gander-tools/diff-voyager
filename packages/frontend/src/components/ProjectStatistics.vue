<script setup lang="ts">
import { NGrid, NGridItem, NStatistic } from 'naive-ui';

interface ProjectStats {
  totalPages: number;
  completedPages: number;
  errorPages: number;
  pendingPages: number;
  totalRuns: number;
  acceptedDiffs: number;
  pendingDiffs: number;
  mutedDiffs: number;
}

interface Props {
  statistics: ProjectStats;
  compact?: boolean;
}

withDefaults(defineProps<Props>(), {
  compact: false,
});
</script>

<template>
  <NGrid :cols="compact ? 2 : 4" :x-gap="12" :y-gap="12" data-test="statistics-grid">
    <NGridItem>
      <NStatistic label="Total Pages" :value="statistics.totalPages" />
    </NGridItem>

    <NGridItem>
      <NStatistic label="Completed" :value="statistics.completedPages" />
    </NGridItem>

    <NGridItem>
      <NStatistic label="Errors" :value="statistics.errorPages" />
    </NGridItem>

    <NGridItem>
      <NStatistic label="Pending" :value="statistics.pendingPages" />
    </NGridItem>

    <NGridItem>
      <NStatistic label="Total Runs" :value="statistics.totalRuns" />
    </NGridItem>

    <NGridItem>
      <NStatistic label="Accepted" :value="statistics.acceptedDiffs" />
    </NGridItem>

    <NGridItem>
      <NStatistic label="Pending Diffs" :value="statistics.pendingDiffs" />
    </NGridItem>

    <NGridItem>
      <NStatistic label="Muted" :value="statistics.mutedDiffs" />
    </NGridItem>
  </NGrid>
</template>

<style scoped>
/* NGrid and NStatistic styles are handled by Naive UI */
</style>
