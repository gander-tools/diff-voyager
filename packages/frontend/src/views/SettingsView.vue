<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NPageHeader,
  NSelect,
  NSpace,
  NSwitch,
  useMessage,
} from 'naive-ui';
import { useForm } from 'vee-validate';
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { availableLocales } from '@/i18n';
import { useSettingsStore } from '@/stores/settings';
import { useUiStore } from '@/stores/ui';
import { settingsSchema } from '@/utils/validators';

const { t } = useI18n();
const message = useMessage();
const settingsStore = useSettingsStore();
const uiStore = useUiStore();

// vee-validate setup with Zod schema
const { handleSubmit, errors, defineField, resetForm, setValues } = useForm({
  validationSchema: toTypedSchema(settingsSchema),
  initialValues: settingsStore.settings,
});

// Define form fields
const [language] = defineField('language');
const [dataDirectory] = defineField('dataDirectory');
const [defaultViewportWidth] = defineField('defaultViewport.width');
const [defaultViewportHeight] = defineField('defaultViewport.height');
const [defaultVisualDiffThreshold] = defineField('defaultVisualDiffThreshold');
const [defaultMaxPages] = defineField('defaultMaxPages');
const [defaultCollectHar] = defineField('defaultCollectHar');
const [defaultWaitAfterLoad] = defineField('defaultWaitAfterLoad');
const [theme] = defineField('theme');
const [compactMode] = defineField('compactMode');

// Options
const languageOptions = availableLocales.map((locale) => ({
  label: locale.name,
  value: locale.code,
}));

const themeOptions = [
  { label: t('settings.theme.light'), value: 'light' },
  { label: t('settings.theme.dark'), value: 'dark' },
  { label: t('settings.theme.auto'), value: 'auto' },
];

const viewportPresets = [
  { label: 'Desktop (1920x1080)', value: '1920x1080' },
  { label: 'Laptop (1366x768)', value: '1366x768' },
  { label: 'Tablet (768x1024)', value: '768x1024' },
  { label: 'Mobile (375x667)', value: '375x667' },
];

const selectedViewportPreset = computed({
  get: () => `${defaultViewportWidth.value}x${defaultViewportHeight.value}`,
  set: (value: string) => {
    const [width, height] = value.split('x').map(Number);
    defaultViewportWidth.value = width;
    defaultViewportHeight.value = height;
  },
});

// Computed threshold percentage for display
const thresholdPercentage = computed({
  get: () => (defaultVisualDiffThreshold.value || 0) * 100,
  set: (value: number) => {
    defaultVisualDiffThreshold.value = value / 100;
  },
});

const onSubmit = handleSubmit((values) => {
  settingsStore.updateSettings(values);

  // Apply theme and language changes immediately
  uiStore.setTheme(values.theme);
  uiStore.setLanguage(values.language);

  message.success(t('settings.saved'));
});

const handleReset = () => {
  settingsStore.resetSettings();
  setValues(settingsStore.settings);

  // Apply default theme and language
  uiStore.setTheme(settingsStore.settings.theme);
  uiStore.setLanguage(settingsStore.settings.language);

  message.success(t('settings.saved'));
};

// Load current settings on mount
onMounted(() => {
  setValues(settingsStore.settings);
});
</script>

<template>
  <div class="settings-view">
    <NPageHeader :title="t('settings.title')" />

    <div class="settings-content">
      <NForm>
        <!-- General Settings -->
        <NCard :title="t('settings.general')" class="settings-section">
          <NSpace vertical :size="24">
            <NFormItem
              :label="t('settings.language')"
              :validation-status="errors.language ? 'error' : undefined"
            >
              <NSelect
                v-model:value="language"
                :options="languageOptions"
                data-test="language-select"
              />
              <div v-if="errors.language" class="error-message">
                {{ errors.language }}
              </div>
            </NFormItem>

            <NFormItem
              label="Data Directory"
              :validation-status="errors.dataDirectory ? 'error' : undefined"
            >
              <NInput
                v-model:value="dataDirectory"
                placeholder="/path/to/data (optional)"
                data-test="data-directory-input"
              />
              <div v-if="errors.dataDirectory" class="error-message">
                {{ errors.dataDirectory }}
              </div>
            </NFormItem>
          </NSpace>
        </NCard>

        <!-- Default Scan Settings -->
        <NCard :title="t('settings.defaults')" class="settings-section">
          <NSpace vertical :size="24">
            <NFormItem label="Viewport Preset">
              <NSelect
                v-model:value="selectedViewportPreset"
                :options="viewportPresets"
                data-test="viewport-preset-select"
              />
            </NFormItem>

            <NSpace :size="16">
              <NFormItem
                label="Width"
                :validation-status="errors['defaultViewport.width'] ? 'error' : undefined"
              >
                <NInputNumber
                  v-model:value="defaultViewportWidth"
                  :min="320"
                  :max="3840"
                  :show-button="false"
                  data-test="viewport-width-input"
                />
                <div v-if="errors['defaultViewport.width']" class="error-message">
                  {{ errors['defaultViewport.width'] }}
                </div>
              </NFormItem>

              <NFormItem
                label="Height"
                :validation-status="errors['defaultViewport.height'] ? 'error' : undefined"
              >
                <NInputNumber
                  v-model:value="defaultViewportHeight"
                  :min="240"
                  :max="2160"
                  :show-button="false"
                  data-test="viewport-height-input"
                />
                <div v-if="errors['defaultViewport.height']" class="error-message">
                  {{ errors['defaultViewport.height'] }}
                </div>
              </NFormItem>
            </NSpace>

            <NFormItem
              :label="t('settings.defaultVisualThreshold')"
              :validation-status="
                errors.defaultVisualDiffThreshold ? 'error' : undefined
              "
            >
              <NSpace vertical style="width: 100%">
                <NInputNumber
                  v-model:value="thresholdPercentage"
                  :min="0"
                  :max="100"
                  :step="0.1"
                  :show-button="false"
                  data-test="visual-threshold-input"
                >
                  <template #suffix>%</template>
                </NInputNumber>
                <div class="hint-text">
                  Visual differences below this threshold will be ignored (0-100%)
                </div>
              </NSpace>
              <div v-if="errors.defaultVisualDiffThreshold" class="error-message">
                {{ errors.defaultVisualDiffThreshold }}
              </div>
            </NFormItem>

            <NFormItem
              label="Max Pages (for crawls)"
              :validation-status="errors.defaultMaxPages ? 'error' : undefined"
            >
              <NInputNumber
                v-model:value="defaultMaxPages"
                :min="1"
                :max="10000"
                :show-button="false"
                data-test="max-pages-input"
              />
              <div v-if="errors.defaultMaxPages" class="error-message">
                {{ errors.defaultMaxPages }}
              </div>
            </NFormItem>

            <NFormItem label="Collect HAR Files">
              <NSwitch
                v-model:value="defaultCollectHar"
                data-test="collect-har-switch"
              />
            </NFormItem>

            <NFormItem
              label="Wait After Load (ms)"
              :validation-status="errors.defaultWaitAfterLoad ? 'error' : undefined"
            >
              <NInputNumber
                v-model:value="defaultWaitAfterLoad"
                :min="0"
                :max="30000"
                :step="100"
                :show-button="false"
                data-test="wait-after-load-input"
              />
              <div v-if="errors.defaultWaitAfterLoad" class="error-message">
                {{ errors.defaultWaitAfterLoad }}
              </div>
            </NFormItem>
          </NSpace>
        </NCard>

        <!-- Appearance Settings -->
        <NCard title="Appearance" class="settings-section">
          <NSpace vertical :size="24">
            <NFormItem
              :label="t('settings.theme.label')"
              :validation-status="errors.theme ? 'error' : undefined"
            >
              <NSelect
                v-model:value="theme"
                :options="themeOptions"
                data-test="theme-select"
              />
              <div v-if="errors.theme" class="error-message">
                {{ errors.theme }}
              </div>
            </NFormItem>

            <NFormItem label="Compact Mode">
              <NSwitch v-model:value="compactMode" data-test="compact-mode-switch" />
              <div class="hint-text">Use compact UI for smaller screens</div>
            </NFormItem>
          </NSpace>
        </NCard>

        <!-- Actions -->
        <NCard class="settings-section">
          <NSpace>
            <NButton type="primary" data-test="save-button" @click="onSubmit">
              {{ t('common.save') }}
            </NButton>
            <NButton data-test="reset-button" @click="handleReset">
              Reset to Defaults
            </NButton>
          </NSpace>
        </NCard>
      </NForm>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.settings-content {
  margin-top: 24px;
}

.settings-section {
  margin-bottom: 24px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.error-message {
  color: var(--error-color);
  font-size: 12px;
  margin-top: 4px;
}

.hint-text {
  color: var(--text-color-3);
  font-size: 12px;
  margin-top: 4px;
}
</style>
