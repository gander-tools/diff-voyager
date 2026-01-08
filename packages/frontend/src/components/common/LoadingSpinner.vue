<script setup lang="ts">
interface Props {
  size?: 'small' | 'medium' | 'large';
  description?: string;
}

withDefaults(defineProps<Props>(), {
  size: 'medium',
});
</script>

<template>
  <div class="loading-spinner">
    <NSpin :size="size" :description="description" />
  </div>
</template>

<style scoped>
.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>
