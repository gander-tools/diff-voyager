<script setup lang="ts">
import { NGrid, NGridItem, NStatistic } from 'naive-ui';

interface RunStats {
  totalPages: number;
  completedPages: number;
  errorPages: number;
  unchangedPages: number;
  changedPages: number;
  criticalDifferences: number;
  acceptedDifferences: number;
  mutedDifferences: number;
}

interface Props {
  statistics: RunStats;
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
      <NStatistic label="Changed" :value="statistics.changedPages" />
    </NGridItem>

    <NGridItem>
      <NStatistic label="Unchanged" :value="statistics.unchangedPages" />
    </NGridItem>

    <NGridItem>
      <NStatistic label="Critical" :value="statistics.criticalDifferences" />
    </NGridItem>

    <NGridItem>
      <NStatistic label="Accepted" :value="statistics.acceptedDifferences" />
    </NGridItem>

    <NGridItem>
      <NStatistic label="Muted" :value="statistics.mutedDifferences" />
    </NGridItem>
  </NGrid>
</template>

<style scoped>
/* NGrid and NStatistic styles are handled by Naive UI */
</style>
