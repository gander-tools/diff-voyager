<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch,
} from 'naive-ui';
import { useForm } from 'vee-validate';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { type CreateRunInput, createRunSchema } from '../utils/validators';

const { t } = useI18n();

interface Props {
  projectUrl?: string;
  loading?: boolean;
  submitError?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [value: CreateRunInput];
  cancel: [];
}>();

// vee-validate setup with Zod schema
const { handleSubmit, errors, defineField, values } = useForm({
  validationSchema: toTypedSchema(createRunSchema),
  initialValues: {
    url: props.projectUrl || '',
    viewport: { width: 1920, height: 1080 },
    collectHar: false,
    waitAfterLoad: 1000,
  },
});

// Define form fields
const [url] = defineField('url');
const [viewportWidth] = defineField('viewport.width');
const [viewportHeight] = defineField('viewport.height');
const [collectHar] = defineField('collectHar');
const [waitAfterLoad] = defineField('waitAfterLoad');

const viewportPresets = computed(() => [
  { label: t('projects.viewport.presets.desktop'), value: '1920x1080' },
  { label: t('projects.viewport.presets.laptop'), value: '1366x768' },
  { label: t('projects.viewport.presets.tablet'), value: '768x1024' },
  { label: t('projects.viewport.presets.mobile'), value: '375x667' },
]);

const selectedPreset = ref('1920x1080');

const handlePresetChange = (value: string) => {
  const [width, height] = value.split('x').map(Number);
  viewportWidth.value = width;
  viewportHeight.value = height;
  selectedPreset.value = value;
};

const onSubmit = handleSubmit((formValues) => {
  emit('submit', formValues);
});

const handleCancel = () => {
  emit('cancel');
};
</script>

<template>
  <NForm :model="values" label-placement="top" label-width="auto">
    <!-- Submission Error Alert -->
    <NAlert
      v-if="submitError"
      type="error"
      :title="submitError"
      closable
      style="margin-bottom: 24px"
      data-test="submit-error-alert"
    />

    <!-- URL -->
    <NFormItem :label="t('runs.form.url')" :validation-status="errors.url ? 'error' : undefined" :feedback="errors.url">
      <NInput
        v-model:value="url"
        :placeholder="t('runs.form.urlPlaceholder')"
        :disabled="loading"
        data-test="url-input"
      />
    </NFormItem>

    <!-- Viewport Settings -->
    <NFormItem :label="t('runs.form.viewport')">
      <NSpace vertical style="width: 100%">
        <NSelect
          v-model:value="selectedPreset"
          :options="viewportPresets"
          :disabled="loading"
          @update:value="handlePresetChange"
          data-test="viewport-preset-select"
        />
        <NSpace>
          <NFormItem
            :label="t('runs.form.viewportWidth')"
            :validation-status="errors['viewport.width'] ? 'error' : undefined"
            :feedback="errors['viewport.width']"
          >
            <NInputNumber
              v-model:value="viewportWidth"
              :min="320"
              :max="3840"
              :step="10"
              :disabled="loading"
              style="width: 150px"
              data-test="viewport-width-input"
            />
          </NFormItem>
          <NFormItem
            :label="t('runs.form.viewportHeight')"
            :validation-status="errors['viewport.height'] ? 'error' : undefined"
            :feedback="errors['viewport.height']"
          >
            <NInputNumber
              v-model:value="viewportHeight"
              :min="240"
              :max="2160"
              :step="10"
              :disabled="loading"
              style="width: 150px"
              data-test="viewport-height-input"
            />
          </NFormItem>
        </NSpace>
      </NSpace>
    </NFormItem>

    <!-- Advanced Options -->
    <NFormItem :label="t('runs.form.collectHar')">
      <NSwitch v-model:value="collectHar" :disabled="loading" data-test="collect-har-switch">
        <template #checked>{{ t('common.yes') }}</template>
        <template #unchecked>{{ t('common.no') }}</template>
      </NSwitch>
    </NFormItem>

    <NFormItem :label="t('runs.form.waitAfterLoad')">
      <NInputNumber
        v-model:value="waitAfterLoad"
        :min="0"
        :max="30000"
        :step="100"
        :disabled="loading"
        style="width: 200px"
        data-test="wait-after-load-input"
      />
    </NFormItem>

    <!-- Actions -->
    <NFormItem>
      <NSpace>
        <NButton type="primary" :loading="loading" :disabled="loading" @click="onSubmit" data-test="submit-button">
          {{ t('runs.create') }}
        </NButton>
        <NButton :disabled="loading" @click="handleCancel" data-test="cancel-button">
          {{ t('common.cancel') }}
        </NButton>
      </NSpace>
    </NFormItem>
  </NForm>
</template>

<style scoped>
.n-form-item {
  margin-bottom: 24px;
}
</style>
