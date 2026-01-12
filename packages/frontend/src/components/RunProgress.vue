<script setup lang="ts">
import { NProgress, NSpace, NText } from 'naive-ui';
import { computed } from 'vue';

interface RunStatistics {
  totalPages: number;
  completedPages: number;
  errorPages: number;
  unchangedPages: number;
  changedPages: number;
  criticalDifferences: number;
  acceptedDifferences: number;
  mutedDifferences: number;
}

interface Run {
  id: string;
  projectId: string;
  baselineId: string;
  status: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  statistics: RunStatistics;
}

interface Props {
  run: Run;
  showEstimatedTime?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showEstimatedTime: true,
});

/**
 * Calculate progress percentage based on completed and error pages
 */
const progress = computed(() => {
  const { totalPages, completedPages, errorPages } = props.run.statistics;
  if (totalPages === 0) return 0;
  return Math.round(((completedPages + errorPages) / totalPages) * 100);
});

/**
 * Get current phase text based on run status
 */
const currentPhase = computed(() => {
  const statusPhases: Record<string, string> = {
    new: 'Initializing',
    pending: 'Queued',
    in_progress: 'Scanning pages',
    interrupted: 'Interrupted',
    completed: 'Completed',
    error: 'Failed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };

  return statusPhases[props.run.status] || 'Unknown';
});

/**
 * Get pages processed text
 */
const pagesProcessedText = computed(() => {
  const { completedPages, errorPages, totalPages } = props.run.statistics;
  const processed = completedPages + errorPages;
  return `${processed} / ${totalPages} pages`;
});

/**
 * Calculate estimated time remaining based on current progress
 * Returns null if not enough data to estimate
 */
const estimatedTimeRemaining = computed(() => {
  if (!props.showEstimatedTime || !props.run.startedAt) {
    return null;
  }

  const { totalPages, completedPages, errorPages } = props.run.statistics;
  const processed = completedPages + errorPages;

  // Need at least 10% progress to make a reasonable estimate
  if (processed === 0 || processed < totalPages * 0.1) {
    return null;
  }

  const startTime = new Date(props.run.startedAt).getTime();
  const currentTime = Date.now();
  const elapsedMs = currentTime - startTime;

  // Calculate average time per page
  const avgTimePerPage = elapsedMs / processed;
  const remainingPages = totalPages - processed;
  const estimatedRemainingMs = avgTimePerPage * remainingPages;

  // Format as human-readable time
  return formatDuration(estimatedRemainingMs);
});

/**
 * Format milliseconds into human-readable duration
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `~${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `~${minutes}m`;
  }
  return `~${seconds}s`;
}

/**
 * Determine progress bar status based on run status and errors
 */
const progressStatus = computed(() => {
  if (props.run.status === 'error' || props.run.status === 'failed') {
    return 'error';
  }
  if (props.run.status === 'interrupted' || props.run.status === 'cancelled') {
    return 'warning';
  }
  if (props.run.statistics.errorPages > 0) {
    return 'warning';
  }
  if (props.run.status === 'completed') {
    return 'success';
  }
  return 'default';
});
</script>

<template>
  <div class="run-progress" data-test="run-progress">
    <NSpace vertical :size="8">
      <!-- Current phase -->
      <NText depth="3" style="font-size: 13px; font-weight: 500" data-test="current-phase">
        {{ currentPhase }}
      </NText>

      <!-- Progress bar -->
      <NProgress
        type="line"
        :percentage="progress"
        :status="progressStatus"
        :show-indicator="true"
        data-test="progress-bar"
      />

      <!-- Pages processed and estimated time -->
      <NSpace justify="space-between" align="center" style="font-size: 12px">
        <NText depth="3" data-test="pages-processed">
          {{ pagesProcessedText }}
        </NText>
        <NText v-if="estimatedTimeRemaining" depth="3" data-test="estimated-time">
          {{ estimatedTimeRemaining }} remaining
        </NText>
      </NSpace>

      <!-- Error count if any -->
      <NText
        v-if="run.statistics.errorPages > 0"
        type="error"
        style="font-size: 12px"
        data-test="error-count"
      >
        {{ run.statistics.errorPages }} error{{ run.statistics.errorPages !== 1 ? 's' : '' }}
      </NText>
    </NSpace>
  </div>
</template>

<style scoped>
.run-progress {
  width: 100%;
}
</style>
