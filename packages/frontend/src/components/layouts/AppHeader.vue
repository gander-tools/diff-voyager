<script setup lang="ts">
import { Globe, Moon, Sun } from '@vicons/tabler';
import { useI18n } from 'vue-i18n';
import { availableLocales } from '@/i18n';
import type { Theme } from '@/stores/ui';
import { useUiStore } from '@/stores/ui';

const { t } = useI18n();
const uiStore = useUiStore();

const _languageOptions = availableLocales.map((locale) => ({
  label: locale.name,
  key: locale.code,
}));

const _themeOptions = [
  { label: t('settings.theme.light'), key: 'light' as Theme, icon: Sun },
  { label: t('settings.theme.dark'), key: 'dark' as Theme, icon: Moon },
  { label: t('settings.theme.auto'), key: 'auto' as Theme, icon: Globe },
];

function _handleLanguageSelect(key: string) {
  uiStore.setLanguage(key as 'en' | 'pl');
}

function _handleThemeSelect(key: string) {
  uiStore.setTheme(key as Theme);
}
</script>

<template>
  <NLayoutHeader bordered class="app-header">
    <div class="header-content">
      <div class="logo">
        <h1>Diff Voyager</h1>
      </div>

      <NSpace class="header-actions">
        <!-- Language Switcher -->
        <NDropdown
          :options="languageOptions"
          @select="handleLanguageSelect"
        >
          <NButton text>
            <template #icon>
              <NIcon :component="Globe" />
            </template>
            {{ uiStore.locale.toUpperCase() }}
          </NButton>
        </NDropdown>

        <!-- Theme Switcher -->
        <NDropdown
          :options="themeOptions"
          @select="handleThemeSelect"
        >
          <NButton text>
            <template #icon>
              <NIcon
                :component="uiStore.theme === 'dark' ? Moon : uiStore.theme === 'light' ? Sun : Globe"
              />
            </template>
          </NButton>
        </NDropdown>
      </NSpace>
    </div>
  </NLayoutHeader>
</template>

<style scoped>
.app-header {
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.logo h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
