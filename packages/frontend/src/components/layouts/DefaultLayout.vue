<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in template
import { NLayout, NLayoutContent } from 'naive-ui';
// biome-ignore lint/correctness/noUnusedImports: used in template
import AppBreadcrumb from './AppBreadcrumb.vue';
// biome-ignore lint/correctness/noUnusedImports: used in template
import AppHeader from './AppHeader.vue';
// biome-ignore lint/correctness/noUnusedImports: used in template
import AppSidebar from './AppSidebar.vue';
</script>

<template>
  <NLayout has-sider class="default-layout">
    <AppSidebar />

    <NLayout>
      <AppHeader />

      <NLayoutContent class="layout-content">
        <AppBreadcrumb />

        <div class="content-wrapper">
          <slot />
        </div>
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>

<style scoped>
.default-layout {
  height: 100vh;
}

.layout-content {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  overflow: auto;
}

.content-wrapper {
  flex: 1;
  padding: 24px;
  overflow: auto;
}
</style>
