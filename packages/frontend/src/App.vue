<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in template
import { NConfigProvider, NDialogProvider, NMessageProvider } from 'naive-ui';
// biome-ignore lint/correctness/noUnusedImports: used in template
import { RouterView } from 'vue-router';
// biome-ignore lint/correctness/noUnusedImports: used in template
import DefaultLayout from './components/layouts/DefaultLayout.vue';

// Naive UI theme configuration
// biome-ignore lint/correctness/noUnusedVariables: used in template
const themeOverrides = {
  common: {
    primaryColor: '#18a058',
    primaryColorHover: '#36ad6a',
    primaryColorPressed: '#0c7a43',
  },
};
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverrides">
    <NMessageProvider>
      <NDialogProvider>
        <DefaultLayout>
          <RouterView />
        </DefaultLayout>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  height: 100vh;
}
</style>
