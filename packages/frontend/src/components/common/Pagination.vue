<script setup lang="ts">
import { NPagination } from 'naive-ui';
import { computed } from 'vue';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  pageSizes?: number[];
  showSizePicker?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  pageSizes: () => [10, 20, 50, 100],
  showSizePicker: true,
});

const emit = defineEmits<{
  'update:page': [value: number];
  'update:pageSize': [value: number];
}>();

const pageCount = computed(() => Math.ceil(props.total / props.pageSize));

function handlePageChange(page: number) {
  emit('update:page', page);
}

function handlePageSizeChange(pageSize: number) {
  emit('update:pageSize', pageSize);
  // Reset to page 1 when changing page size
  if (props.page !== 1) {
    emit('update:page', 1);
  }
}
</script>

<template>
  <div class="pagination-wrapper">
    <NPagination
      :page="page"
      :page-size="pageSize"
      :page-count="pageCount"
      :page-sizes="pageSizes"
      :show-size-picker="showSizePicker"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />
  </div>
</template>

<style scoped>
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}
</style>
