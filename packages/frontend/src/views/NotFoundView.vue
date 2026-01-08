<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

// biome-ignore lint/correctness/noUnusedVariables: used in template
const { t } = useI18n();
const router = useRouter();

// biome-ignore lint/correctness/noUnusedVariables: used in template
function goHome() {
  router.push('/');
}

// biome-ignore lint/correctness/noUnusedVariables: used in template
function goBack() {
  router.back();
}
</script>

<template>
  <div class="not-found">
    <NCard>
      <div class="not-found-content">
        <h1 class="error-code">404</h1>
        <h2>{{ t('errors.notFound') }}</h2>
        <p>{{ t('errors.generic') }}</p>

        <NSpace class="actions">
          <NButton @click="goBack">
            {{ t('errors.goBack') }}
          </NButton>
          <NButton type="primary" @click="goHome">
            {{ t('errors.goHome') }}
          </NButton>
        </NSpace>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  max-width: 600px;
  margin: 0 auto;
}

.not-found-content {
  text-align: center;
  padding: 40px 20px;
}

.error-code {
  font-size: 96px;
  font-weight: 700;
  margin: 0;
  color: #d03050;
}

.not-found-content h2 {
  font-size: 24px;
  margin: 20px 0 10px;
}

.not-found-content p {
  color: #666;
  margin-bottom: 30px;
}

.actions {
  justify-content: center;
}
</style>
