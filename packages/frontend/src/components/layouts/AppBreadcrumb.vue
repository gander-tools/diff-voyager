<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in template
import { NBreadcrumb, NBreadcrumbItem } from 'naive-ui';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

interface BreadcrumbItem {
  title: string;
  path?: string;
}

// biome-ignore lint/correctness/noUnusedVariables: used in template
const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [];
  const pathSegments = route.path.split('/').filter(Boolean);

  // Always add home
  items.push({
    title: t('nav.dashboard'),
    path: '/',
  });

  // Build breadcrumbs from path segments
  let currentPath = '';
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;

    // Get title from route meta or translate segment
    let title = segment;

    // Try to get from route name/meta
    const matchedRoute = router.getRoutes().find((r) => r.path === currentPath);
    if (matchedRoute?.meta?.title) {
      title = t(matchedRoute.meta.title as string);
    } else {
      // Try common translations
      const translationKey = `nav.${segment}`;
      const translated = t(translationKey);
      if (translated !== translationKey) {
        title = translated;
      }
    }

    items.push({
      title,
      path: currentPath,
    });
  }

  return items;
});

// biome-ignore lint/correctness/noUnusedVariables: used in template
function handleClick(path?: string) {
  if (path && path !== route.path) {
    router.push(path);
  }
}
</script>

<template>
  <NBreadcrumb class="app-breadcrumb">
    <NBreadcrumbItem
      v-for="(item, index) in breadcrumbs"
      :key="item.path || index"
      :clickable="!!item.path && item.path !== route.path"
      @click="handleClick(item.path)"
    >
      {{ item.title }}
    </NBreadcrumbItem>
  </NBreadcrumb>
</template>

<style scoped>
.app-breadcrumb {
  padding: 16px 24px;
}
</style>
