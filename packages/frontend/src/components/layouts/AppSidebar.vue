<script setup lang="ts">
import { Dashboard, Filter, FolderOpen, PlaylistAdd, Settings } from '@vicons/tabler';
import type { MenuOption } from 'naive-ui';
import { NIcon } from 'naive-ui';
import { computed, h } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useUiStore } from '@/stores/ui';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const _uiStore = useUiStore();

const _menuOptions = computed<MenuOption[]>(() => [
  {
    label: t('nav.dashboard'),
    key: '/',
    icon: () => h(NIcon, null, { default: () => h(Dashboard) }),
  },
  {
    label: t('nav.projects'),
    key: '/projects',
    icon: () => h(NIcon, null, { default: () => h(FolderOpen) }),
  },
  {
    label: t('nav.runs'),
    key: '/runs',
    icon: () => h(NIcon, null, { default: () => h(PlaylistAdd) }),
  },
  {
    label: t('nav.rules'),
    key: '/rules',
    icon: () => h(NIcon, null, { default: () => h(Filter) }),
  },
  {
    label: t('nav.settings'),
    key: '/settings',
    icon: () => h(NIcon, null, { default: () => h(Settings) }),
  },
]);

const _activeKey = computed(() => {
  // Match the current route path to menu key
  const path = route.path;

  // Exact matches
  if (path === '/') return '/';
  if (path === '/settings') return '/settings';
  if (path === '/rules' || path.startsWith('/rules/')) return '/rules';

  // Prefix matches
  if (path.startsWith('/projects')) return '/projects';
  if (path.startsWith('/runs')) return '/runs';

  return '/';
});

function _handleMenuSelect(key: string) {
  router.push(key);
}
</script>

<template>
  <NLayoutSider
    bordered
    :collapsed="uiStore.sidebarCollapsed"
    collapse-mode="width"
    :collapsed-width="64"
    :width="240"
    show-trigger
    @collapse="uiStore.setSidebarCollapsed(true)"
    @expand="uiStore.setSidebarCollapsed(false)"
  >
    <NMenu
      :value="activeKey"
      :collapsed="uiStore.sidebarCollapsed"
      :collapsed-width="64"
      :collapsed-icon-size="22"
      :options="menuOptions"
      @update:value="handleMenuSelect"
    />
  </NLayoutSider>
</template>

<style scoped>
/* Additional styles if needed */
</style>
