<script setup lang="ts">
import type { SeoChangeResponse } from '@gander-tools/diff-voyager-shared';
import { DiffSeverity } from '@gander-tools/diff-voyager-shared';
import { NBadge, NCard, NEmpty, NText } from 'naive-ui';
import { computed } from 'vue';

interface Props {
  seoChanges: SeoChangeResponse[];
  showTitle?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showTitle: true,
});

// Map field names to human-readable labels
const fieldLabels: Record<string, string> = {
  title: 'Page Title',
  metaDescription: 'Meta Description',
  canonical: 'Canonical URL',
  robots: 'Robots Meta Tag',
  h1: 'H1 Headings',
  h2: 'H2 Headings',
  lang: 'Language',
  'openGraph.title': 'OG: Title',
  'openGraph.description': 'OG: Description',
  'openGraph.image': 'OG: Image',
  'openGraph.url': 'OG: URL',
  'openGraph.type': 'OG: Type',
  'twitterCard.card': 'Twitter: Card Type',
  'twitterCard.title': 'Twitter: Title',
  'twitterCard.description': 'Twitter: Description',
  'twitterCard.image': 'Twitter: Image',
};

const getFieldLabel = (field: string): string => {
  return fieldLabels[field] || field;
};

interface SeverityConfig {
  label: string;
  type: 'error' | 'warning' | 'info' | 'success' | 'default';
}

const getSeverityConfig = (severity: DiffSeverity): SeverityConfig => {
  const configs: Record<DiffSeverity, SeverityConfig> = {
    [DiffSeverity.CRITICAL]: { label: 'Critical', type: 'error' },
    [DiffSeverity.WARNING]: { label: 'Warning', type: 'warning' },
    [DiffSeverity.INFO]: { label: 'Info', type: 'info' },
  };
  return configs[severity] || { label: String(severity), type: 'default' };
};

const formatValue = (value: string | null): string => {
  if (value === null || value === undefined) {
    return '(not set)';
  }
  if (value === '') {
    return '(empty)';
  }
  // Truncate long values
  if (value.length > 100) {
    return `${value.substring(0, 100)}...`;
  }
  return value;
};

const hasChanges = computed(() => props.seoChanges.length > 0);
</script>

<template>
  <NCard v-if="showTitle" title="SEO Changes" data-test="seo-diff-view">
    <NEmpty v-if="!hasChanges" description="No SEO changes detected" />

    <div v-else class="seo-changes">
      <div
        v-for="(change, index) in seoChanges"
        :key="`${change.field}-${index}`"
        class="seo-change-item"
        :data-test="`seo-change-${change.field}`"
      >
        <div class="change-header">
          <NText strong>{{ getFieldLabel(change.field) }}</NText>
          <NBadge
            :value="getSeverityConfig(change.severity).label"
            :type="getSeverityConfig(change.severity).type"
            data-test="severity-badge"
          />
        </div>

        <div class="change-values">
          <div class="value-section">
            <NText depth="3" style="font-size: 12px">Baseline</NText>
            <NText class="value-text" data-test="baseline-value">
              {{ formatValue(change.baselineValue) }}
            </NText>
          </div>

          <div class="arrow">→</div>

          <div class="value-section">
            <NText depth="3" style="font-size: 12px">Current</NText>
            <NText class="value-text" data-test="current-value">
              {{ formatValue(change.currentValue) }}
            </NText>
          </div>
        </div>
      </div>
    </div>
  </NCard>

  <div v-else data-test="seo-diff-view">
    <NEmpty v-if="!hasChanges" description="No SEO changes detected" />

    <div v-else class="seo-changes">
      <div
        v-for="(change, index) in seoChanges"
        :key="`${change.field}-${index}`"
        class="seo-change-item"
        :data-test="`seo-change-${change.field}`"
      >
        <div class="change-header">
          <NText strong>{{ getFieldLabel(change.field) }}</NText>
          <NBadge
            :value="getSeverityConfig(change.severity).label"
            :type="getSeverityConfig(change.severity).type"
            data-test="severity-badge"
          />
        </div>

        <div class="change-values">
          <div class="value-section">
            <NText depth="3" style="font-size: 12px">Baseline</NText>
            <NText class="value-text" data-test="baseline-value">
              {{ formatValue(change.baselineValue) }}
            </NText>
          </div>

          <div class="arrow">→</div>

          <div class="value-section">
            <NText depth="3" style="font-size: 12px">Current</NText>
            <NText class="value-text" data-test="current-value">
              {{ formatValue(change.currentValue) }}
            </NText>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seo-changes {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.seo-change-item {
  padding: 16px;
  background-color: #fafafa;
  border-radius: 4px;
  border-left: 3px solid #e0e0e6;
}

.change-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.change-values {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: center;
}

.value-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.value-text {
  padding: 8px;
  background-color: white;
  border: 1px solid #e0e0e6;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  word-break: break-word;
}

.arrow {
  font-size: 20px;
  color: #909399;
  font-weight: bold;
}
</style>
