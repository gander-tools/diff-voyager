<script setup lang="ts">
import { NButton, NCard, NProgress, NSpace, NText, NTime } from 'naive-ui';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RunDetailsResponse } from '@/services/api';
import RunStatusBadge from './RunStatusBadge.vue';

const { t } = useI18n();

interface Props {
  run: RunDetailsResponse;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [];
}>();

const handleCardClick = () => {
  emit('click');
};

const progress = computed(() => {
  const { totalPages, completedPages, errorPages } = props.run.statistics;
  if (totalPages === 0) return 0;
  return Math.round(((completedPages + errorPages) / totalPages) * 100);
});

const isInProgress = computed(() => {
  return props.run.status === 'in_progress' || props.run.status === 'pending';
});

const createdDate = computed(() => {
  return new Date(props.run.createdAt);
});

const completedDate = computed(() => {
  return props.run.completedAt ? new Date(props.run.completedAt) : null;
});
</script>

<template>
  <NCard
    class="run-card"
    hoverable
    data-test="run-card"
    @click="handleCardClick"
  >
    <template #header>
      <NSpace justify="space-between" align="center">
        <NText strong>Run #{{ run.id.slice(0, 8) }}</NText>
        <RunStatusBadge :status="run.status" size="small" />
      </NSpace>
    </template>

    <NSpace vertical :size="12">
      <!-- Progress bar for in-progress runs -->
      <div v-if="isInProgress">
        <NText depth="3" style="font-size: 12px; display: block; margin-bottom: 4px">
          {{ t('runs.progressLabel') }}: {{ run.statistics.completedPages + run.statistics.errorPages }} /
          {{ run.statistics.totalPages }} {{ t('runs.pagesLabel') }}
        </NText>
        <NProgress
          type="line"
          :percentage="progress"
          :status="run.statistics.errorPages > 0 ? 'error' : 'default'"
        />
      </div>

      <!-- Statistics for completed runs -->
      <NSpace v-else :size="16">
        <NText depth="3">
          <strong>{{ run.statistics.totalPages }}</strong> {{ t('runs.pagesLabel') }}
        </NText>
        <NText v-if="run.statistics.diffsCount > 0" type="warning">
          <strong>{{ run.statistics.diffsCount }}</strong> {{ t('runs.diffsLabel') }}
        </NText>
        <NText v-if="run.statistics.errorPages > 0" type="error">
          <strong>{{ run.statistics.errorPages }}</strong> {{ t('runs.errorsLabel') }}
        </NText>
      </NSpace>

      <!-- Timestamps -->
      <NSpace vertical :size="4">
        <NText depth="3" style="font-size: 12px">
          {{ t('runs.createdLabel') }} <NTime :time="createdDate" format="yyyy-MM-dd HH:mm" />
        </NText>
        <NText v-if="completedDate" depth="3" style="font-size: 12px">
          {{ t('runs.completedLabel') }} <NTime :time="completedDate" format="yyyy-MM-dd HH:mm" />
        </NText>
      </NSpace>
    </NSpace>

    <template #footer>
      <NSpace justify="end">
        <NButton
          size="small"
          type="primary"
          secondary
          data-test="view-button"
          @click.stop="handleCardClick"
        >
          {{ t('runs.viewDetails') }}
        </NButton>
      </NSpace>
    </template>
  </NCard>
</template>

<style scoped>
.run-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.run-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
