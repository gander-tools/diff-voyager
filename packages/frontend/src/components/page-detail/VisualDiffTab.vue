<script setup lang="ts">
import { NAlert, NCard, NEmpty, NImage, NImageGroup, NSpace, NStatistic, NText } from 'naive-ui';
import { computed } from 'vue';
import type { VisualDiffResponse } from '../../services/api/pages';

interface Props {
  pageId: string;
  artifacts: {
    screenshotUrl?: string;
    baselineScreenshotUrl?: string;
    diffImageUrl?: string;
    harUrl?: string;
    htmlUrl?: string;
  };
  visualDiff?: VisualDiffResponse;
}

const props = defineProps<Props>();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const screenshotUrl = computed(() => {
  if (props.artifacts.screenshotUrl) {
    return props.artifacts.screenshotUrl;
  }
  return `${API_BASE_URL}/artifacts/${props.pageId}/screenshot`;
});

const baselineScreenshotUrl = computed(() => {
  if (props.artifacts.baselineScreenshotUrl) {
    return props.artifacts.baselineScreenshotUrl;
  }
  return `${API_BASE_URL}/artifacts/${props.pageId}/baseline-screenshot`;
});

const diffImageUrl = computed(() => {
  if (props.artifacts.diffImageUrl) {
    return props.artifacts.diffImageUrl;
  }
  return `${API_BASE_URL}/artifacts/${props.pageId}/diff`;
});

const hasVisualDiff = computed(() => props.visualDiff !== undefined);
const thresholdExceeded = computed(() => props.visualDiff?.thresholdExceeded ?? false);
</script>

<template>
  <NSpace vertical :size="16">
    <!-- Visual Diff Summary -->
    <NAlert
      v-if="hasVisualDiff && thresholdExceeded"
      type="warning"
      title="Visual Differences Detected"
    >
      The page has visual differences that exceed the configured threshold.
    </NAlert>

    <NAlert
      v-else-if="hasVisualDiff && !thresholdExceeded"
      type="success"
      title="No Significant Visual Changes"
    >
      Visual differences are below the threshold.
    </NAlert>

    <!-- Statistics -->
    <NCard v-if="hasVisualDiff" title="Diff Statistics">
      <NSpace :size="24">
        <NStatistic label="Difference %">
          <template #default>
            {{ (visualDiff!.diffPercentage * 100).toFixed(2) }}%
          </template>
        </NStatistic>
        <NStatistic label="Pixels Changed">
          {{ visualDiff!.diffPixels.toLocaleString() }}
        </NStatistic>
        <NStatistic label="Threshold Exceeded">
          <template #default>
            {{ thresholdExceeded ? 'Yes' : 'No' }}
          </template>
        </NStatistic>
      </NSpace>
    </NCard>

    <!-- Screenshots -->
    <NCard title="Screenshots">
      <NSpace vertical :size="16">
        <NText depth="3">
          Click on any image to view in full screen. Use arrow keys to navigate between images.
        </NText>

        <NImageGroup>
          <NSpace :size="16" vertical>
            <!-- Baseline Screenshot -->
            <div class="screenshot-container">
              <NText strong>Baseline Screenshot</NText>
              <NImage
                :src="baselineScreenshotUrl"
                alt="Baseline Screenshot"
                object-fit="contain"
                style="max-width: 100%; border: 1px solid var(--n-border-color); border-radius: 4px;"
                lazy
              />
            </div>

            <!-- Current Screenshot -->
            <div class="screenshot-container">
              <NText strong>Current Screenshot</NText>
              <NImage
                :src="screenshotUrl"
                alt="Current Screenshot"
                object-fit="contain"
                style="max-width: 100%; border: 1px solid var(--n-border-color); border-radius: 4px;"
                lazy
              />
            </div>

            <!-- Diff Image -->
            <div v-if="hasVisualDiff" class="screenshot-container">
              <NText strong>Visual Diff (Highlighted Changes)</NText>
              <NImage
                :src="diffImageUrl"
                alt="Visual Diff"
                object-fit="contain"
                style="max-width: 100%; border: 1px solid var(--n-border-color); border-radius: 4px;"
                lazy
              />
            </div>
          </NSpace>
        </NImageGroup>

        <NEmpty v-if="!artifacts.screenshotUrl && !artifacts.baselineScreenshotUrl" description="No screenshots available" />
      </NSpace>
    </NCard>
  </NSpace>
</template>

<style scoped>
.screenshot-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
