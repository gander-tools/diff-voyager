<script setup lang="ts">
import type { PerformanceData } from '@gander-tools/diff-voyager-shared';
import { Download } from '@vicons/tabler';
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NIcon,
  NSpace,
  NStatistic,
  NTag,
  NText,
} from 'naive-ui';
import { computed } from 'vue';
import type { PerformanceChangeResponse } from '../../services/api/pages';

interface Props {
  pageId: string;
  performanceData?: PerformanceData;
  performanceChanges: PerformanceChangeResponse[];
  artifacts: {
    screenshotUrl?: string;
    baselineScreenshotUrl?: string;
    diffImageUrl?: string;
    harUrl?: string;
    htmlUrl?: string;
  };
}

const props = defineProps<Props>();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const harUrl = computed(() => {
  if (props.artifacts.harUrl) {
    return props.artifacts.harUrl;
  }
  return `${API_BASE_URL}/artifacts/${props.pageId}/har`;
});

const hasChanges = computed(() => props.performanceChanges.length > 0);

const getSeverityType = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'default';
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
};

const formatMs = (ms: number): string => {
  if (ms < 1000) {
    return `${ms.toFixed(0)} ms`;
  }
  return `${(ms / 1000).toFixed(2)} s`;
};

const handleDownloadHar = () => {
  window.open(harUrl.value, '_blank');
};
</script>

<template>
  <NSpace vertical :size="16">
    <!-- Changes Summary -->
    <NAlert v-if="hasChanges" type="warning" title="Performance Changes Detected">
      {{ performanceChanges.length }} performance metric(s) have changed from the baseline.
    </NAlert>

    <NAlert v-else type="success" title="No Performance Changes">
      All performance metrics match the baseline.
    </NAlert>

    <!-- Performance Changes -->
    <NCard v-if="hasChanges" title="Performance Changes">
      <NSpace vertical :size="12">
        <div v-for="change in performanceChanges" :key="change.metric" class="perf-change">
          <NSpace vertical :size="4">
            <div>
              <NText strong>{{ change.metric }}</NText>
              <NTag :type="getSeverityType(change.severity)" size="small" style="margin-left: 8px">
                {{ change.severity }}
              </NTag>
            </div>
            <div class="change-values">
              <div class="value-row">
                <NText depth="3" size="small">Baseline:</NText>
                <NText code>{{ change.baselineValue }}</NText>
              </div>
              <div class="value-row">
                <NText depth="3" size="small">Current:</NText>
                <NText code>{{ change.currentValue }}</NText>
              </div>
              <div class="value-row">
                <NText depth="3" size="small">Change:</NText>
                <NText
                  :type="change.percentageChange > 0 ? 'error' : 'success'"
                  code
                >
                  {{ change.percentageChange > 0 ? '+' : '' }}{{ change.percentageChange.toFixed(2) }}%
                </NText>
              </div>
            </div>
          </NSpace>
        </div>
      </NSpace>
    </NCard>

    <!-- Current Performance Metrics -->
    <NCard title="Performance Metrics">
      <NSpace v-if="performanceData" vertical :size="16">
        <NSpace :size="24">
          <NStatistic label="Load Time">
            {{ formatMs(performanceData.loadTimeMs) }}
          </NStatistic>
          <NStatistic label="Requests">
            {{ performanceData.requestCount }}
          </NStatistic>
          <NStatistic label="Total Size">
            {{ formatBytes(performanceData.totalSizeBytes) }}
          </NStatistic>
        </NSpace>

        <!-- Resource Timings -->
        <NDescriptions
          v-if="performanceData.resourceTimings && performanceData.resourceTimings.length > 0"
          title="Top Resources"
          :column="1"
          label-placement="left"
        >
          <NDescriptionsItem
            v-for="(resource, index) in performanceData.resourceTimings.slice(0, 10)"
            :key="index"
            :label="`${resource.type}`"
          >
            <NSpace vertical :size="2">
              <NText>{{ resource.url }}</NText>
              <NText depth="3" size="small">
                Duration: {{ formatMs(resource.durationMs) }} | Size: {{ formatBytes(resource.sizeBytes) }}
              </NText>
            </NSpace>
          </NDescriptionsItem>
        </NDescriptions>
      </NSpace>
      <NEmpty v-else description="No performance data available" />
    </NCard>

    <!-- HAR File -->
    <NCard title="HAR File">
      <NSpace vertical :size="12">
        <NText depth="3">
          Download the HTTP Archive (HAR) file to analyze detailed network activity, timings, and resource loading.
        </NText>
        <NButton @click="handleDownloadHar">
          <template #icon>
            <NIcon>
              <Download />
            </NIcon>
          </template>
          Download HAR File
        </NButton>
      </NSpace>
    </NCard>
  </NSpace>
</template>

<style scoped>
.perf-change {
  padding: 12px;
  border-left: 3px solid var(--n-border-color);
  background-color: var(--n-color-hover);
  border-radius: 4px;
}

.change-values {
  margin-left: 12px;
}

.value-row {
  margin-top: 4px;
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 8px;
}
</style>
