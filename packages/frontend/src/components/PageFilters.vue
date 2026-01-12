<script setup lang="ts">
import type { DiffType } from '@gander-tools/diff-voyager-shared';
import { NButton, NCard, NCheckbox, NInput, NSelect, NSpace } from 'naive-ui';
import { computed, ref, watch } from 'vue';

/**
 * Page filter values
 */
export interface PageFilterValues {
  changeTypes: DiffType[];
  statuses: PageFilterStatus[];
  urlPattern: string;
  showMuted: boolean;
}

/**
 * Page filter status options
 */
export type PageFilterStatus = 'changed' | 'unchanged' | 'error';

const emit = defineEmits<{
  change: [filters: PageFilterValues];
}>();

// Filter state
const changeTypes = ref<DiffType[]>([]);
const statuses = ref<PageFilterStatus[]>([]);
const urlPattern = ref('');
const showMuted = ref(false);

// Change type options (SEO, Visual, Performance)
const changeTypeOptions = [
  { label: 'SEO Changes', value: 'seo' as DiffType },
  { label: 'Visual Changes', value: 'visual' as DiffType },
  { label: 'Performance Changes', value: 'performance' as DiffType },
];

// Status options (changed, unchanged, errors)
const statusOptions = [
  { label: 'Changed', value: 'changed' as PageFilterStatus },
  { label: 'Unchanged', value: 'unchanged' as PageFilterStatus },
  { label: 'Errors', value: 'error' as PageFilterStatus },
];

// Computed filter values
const filterValues = computed<PageFilterValues>(() => ({
  changeTypes: changeTypes.value,
  statuses: statuses.value,
  urlPattern: urlPattern.value,
  showMuted: showMuted.value,
}));

// Emit change event when filters change
watch(
  filterValues,
  (newFilters) => {
    emit('change', newFilters);
  },
  { immediate: true },
);

// Reset all filters
const handleReset = () => {
  changeTypes.value = [];
  statuses.value = [];
  urlPattern.value = '';
  showMuted.value = false;
};

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return (
    changeTypes.value.length > 0 ||
    statuses.value.length > 0 ||
    urlPattern.value !== '' ||
    showMuted.value !== false
  );
});
</script>

<template>
  <NCard title="Filters" size="small" class="page-filters">
    <NSpace vertical :size="16">
      <!-- Change Type Filter -->
      <div class="filter-item">
        <label class="filter-label">Change Type</label>
        <NSelect
          v-model:value="changeTypes"
          multiple
          :options="changeTypeOptions"
          placeholder="Select change types"
          clearable
          data-test="change-type-select"
        />
      </div>

      <!-- Status Filter -->
      <div class="filter-item">
        <label class="filter-label">Status</label>
        <NSelect
          v-model:value="statuses"
          multiple
          :options="statusOptions"
          placeholder="Select statuses"
          clearable
          data-test="status-select"
        />
      </div>

      <!-- URL Pattern Filter -->
      <div class="filter-item">
        <label class="filter-label">URL Pattern</label>
        <NInput
          v-model:value="urlPattern"
          placeholder="Search by URL pattern..."
          clearable
          data-test="url-pattern-input"
        />
      </div>

      <!-- Show Muted Toggle -->
      <div class="filter-item">
        <NCheckbox v-model:checked="showMuted" data-test="show-muted-checkbox">
          Show muted items
        </NCheckbox>
      </div>

      <!-- Reset Button -->
      <div v-if="hasActiveFilters" class="filter-actions">
        <NButton secondary size="small" data-test="reset-filters-btn" @click="handleReset">
          Reset Filters
        </NButton>
      </div>
    </NSpace>
  </NCard>
</template>

<style scoped>
.page-filters {
  width: 100%;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #e0e0e6;
}
</style>
