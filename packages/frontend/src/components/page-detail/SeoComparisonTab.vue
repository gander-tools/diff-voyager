<script setup lang="ts">
import type { SeoData } from '@gander-tools/diff-voyager-shared';
import {
  NAlert,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NSpace,
  NTag,
  NText,
} from 'naive-ui';
import type { SeoChangeResponse } from '../../services/api/pages';

interface Props {
  seoData?: SeoData;
  seoChanges: SeoChangeResponse[];
}

const props = defineProps<Props>();

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

const hasChanges = props.seoChanges.length > 0;
</script>

<template>
  <NSpace vertical :size="16">
    <!-- Changes Summary -->
    <NAlert v-if="hasChanges" type="warning" title="SEO Changes Detected">
      {{ seoChanges.length }} SEO field(s) have changed from the baseline.
    </NAlert>

    <NAlert v-else type="success" title="No SEO Changes">
      All SEO fields match the baseline.
    </NAlert>

    <!-- SEO Changes -->
    <NCard v-if="hasChanges" title="Changes">
      <NSpace vertical :size="12">
        <div v-for="change in seoChanges" :key="change.field" class="seo-change">
          <NSpace vertical :size="4">
            <div>
              <NText strong>{{ change.field }}</NText>
              <NTag :type="getSeverityType(change.severity)" size="small" style="margin-left: 8px">
                {{ change.severity }}
              </NTag>
            </div>
            <div class="change-values">
              <div class="value-row">
                <NText depth="3" size="small">Baseline:</NText>
                <NText code>{{ change.baselineValue || '(empty)' }}</NText>
              </div>
              <div class="value-row">
                <NText depth="3" size="small">Current:</NText>
                <NText code>{{ change.currentValue || '(empty)' }}</NText>
              </div>
            </div>
          </NSpace>
        </div>
      </NSpace>
    </NCard>

    <!-- Current SEO Data -->
    <NCard title="SEO Metadata">
      <NDescriptions v-if="seoData" :column="1" label-placement="left">
        <NDescriptionsItem label="Title">
          {{ seoData.title || '(not set)' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Meta Description">
          {{ seoData.metaDescription || '(not set)' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Canonical">
          {{ seoData.canonical || '(not set)' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Robots">
          {{ seoData.robots || '(not set)' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Language">
          {{ seoData.lang || '(not set)' }}
        </NDescriptionsItem>
        <NDescriptionsItem v-if="seoData.h1 && seoData.h1.length > 0" label="H1 Tags">
          <NSpace vertical :size="4">
            <div v-for="(h1, index) in seoData.h1" :key="index">
              {{ h1 }}
            </div>
          </NSpace>
        </NDescriptionsItem>
        <NDescriptionsItem v-if="seoData.h2 && seoData.h2.length > 0" label="H2 Tags">
          <NSpace vertical :size="4">
            <div v-for="(h2, index) in seoData.h2" :key="index">
              {{ h2 }}
            </div>
          </NSpace>
        </NDescriptionsItem>
        <NDescriptionsItem v-if="seoData.openGraph" label="Open Graph">
          <NSpace vertical :size="4">
            <div v-for="(value, key) in seoData.openGraph" :key="key">
              <NText code size="small">{{ key }}:</NText> {{ value }}
            </div>
          </NSpace>
        </NDescriptionsItem>
        <NDescriptionsItem v-if="seoData.twitterCard" label="Twitter Card">
          <NSpace vertical :size="4">
            <div v-for="(value, key) in seoData.twitterCard" :key="key">
              <NText code size="small">{{ key }}:</NText> {{ value }}
            </div>
          </NSpace>
        </NDescriptionsItem>
      </NDescriptions>
      <NEmpty v-else description="No SEO data available" />
    </NCard>
  </NSpace>
</template>

<style scoped>
.seo-change {
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
