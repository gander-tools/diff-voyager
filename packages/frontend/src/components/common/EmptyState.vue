<script setup lang="ts">
import { NEmpty } from 'naive-ui';

interface Props {
  description?: string;
  size?: 'small' | 'medium' | 'large' | 'huge';
}

withDefaults(defineProps<Props>(), {
  size: 'medium',
});
</script>

<template>
  <div class="empty-state">
    <NEmpty :description="description" :size="size">
      <template v-if="$slots.extra" #extra>
        <slot name="extra" />
      </template>
    </NEmpty>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: 40px 20px;
}
</style>
