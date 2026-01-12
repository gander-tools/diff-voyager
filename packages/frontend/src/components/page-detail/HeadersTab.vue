<script setup lang="ts">
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
import type { HeaderChangeResponse } from '../../services/api/pages';

interface Props {
  httpHeaders?: Record<string, string>;
  headerChanges: HeaderChangeResponse[];
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

const hasChanges = props.headerChanges.length > 0;
</script>

<template>
  <NSpace vertical :size="16">
    <!-- Changes Summary -->
    <NAlert v-if="hasChanges" type="warning" title="HTTP Header Changes Detected">
      {{ headerChanges.length }} HTTP header(s) have changed from the baseline.
    </NAlert>

    <NAlert v-else type="success" title="No Header Changes">
      All HTTP headers match the baseline.
    </NAlert>

    <!-- Header Changes -->
    <NCard v-if="hasChanges" title="Header Changes">
      <NSpace vertical :size="12">
        <div v-for="change in headerChanges" :key="change.headerName" class="header-change">
          <NSpace vertical :size="4">
            <div>
              <NText strong>{{ change.headerName }}</NText>
              <NTag :type="getSeverityType(change.severity)" size="small" style="margin-left: 8px">
                {{ change.severity }}
              </NTag>
            </div>
            <div class="change-values">
              <div class="value-row">
                <NText depth="3" size="small">Baseline:</NText>
                <NText code>{{ change.baselineValue || '(not set)' }}</NText>
              </div>
              <div class="value-row">
                <NText depth="3" size="small">Current:</NText>
                <NText code>{{ change.currentValue || '(not set)' }}</NText>
              </div>
            </div>
          </NSpace>
        </div>
      </NSpace>
    </NCard>

    <!-- Current HTTP Headers -->
    <NCard title="HTTP Headers">
      <NDescriptions v-if="httpHeaders && Object.keys(httpHeaders).length > 0" :column="1" label-placement="left">
        <NDescriptionsItem
          v-for="(value, key) in httpHeaders"
          :key="key"
          :label="String(key)"
        >
          <NText code>{{ value }}</NText>
        </NDescriptionsItem>
      </NDescriptions>
      <NEmpty v-else description="No HTTP headers available" />
    </NCard>
  </NSpace>
</template>

<style scoped>
.header-change {
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
