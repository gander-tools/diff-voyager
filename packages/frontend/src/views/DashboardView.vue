<script setup lang="ts">
import { NCard } from 'naive-ui';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="dashboard">
    <NCard :title="t('dashboard.title')">
      <p>{{ t('dashboard.welcome') }}</p>
      <p>{{ t('dashboard.subtitle') }}</p>
    </NCard>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
}
</style>
