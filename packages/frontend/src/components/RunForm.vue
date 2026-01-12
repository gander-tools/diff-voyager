<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import {
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
import { ref } from 'vue';
import { type CreateRunInput, createRunSchema } from '../utils/validators';

interface Props {
  projectUrl?: string;
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

const viewportPresets = [
  { label: 'Desktop (1920x1080)', value: '1920x1080' },
  { label: 'Laptop (1366x768)', value: '1366x768' },
  { label: 'Tablet (768x1024)', value: '768x1024' },
  { label: 'Mobile (375x667)', value: '375x667' },
];

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
    <!-- URL -->
    <NFormItem label="URL" :validation-status="errors.url ? 'error' : undefined" :feedback="errors.url">
      <NInput
        v-model:value="url"
        placeholder="https://example.com"
        data-test="url-input"
      />
    </NFormItem>

    <!-- Viewport Settings -->
    <NFormItem label="Viewport">
      <NSpace vertical style="width: 100%">
        <NSelect
          v-model:value="selectedPreset"
          :options="viewportPresets"
          @update:value="handlePresetChange"
          data-test="viewport-preset-select"
        />
        <NSpace>
          <NFormItem
            label="Width"
            :validation-status="errors['viewport.width'] ? 'error' : undefined"
            :feedback="errors['viewport.width']"
          >
            <NInputNumber
              v-model:value="viewportWidth"
              :min="320"
              :max="3840"
              :step="10"
              style="width: 150px"
              data-test="viewport-width-input"
            />
          </NFormItem>
          <NFormItem
            label="Height"
            :validation-status="errors['viewport.height'] ? 'error' : undefined"
            :feedback="errors['viewport.height']"
          >
            <NInputNumber
              v-model:value="viewportHeight"
              :min="240"
              :max="2160"
              :step="10"
              style="width: 150px"
              data-test="viewport-height-input"
            />
          </NFormItem>
        </NSpace>
      </NSpace>
    </NFormItem>

    <!-- Advanced Options -->
    <NFormItem label="Collect HAR Files">
      <NSwitch v-model:value="collectHar" data-test="collect-har-switch">
        <template #checked>Yes</template>
        <template #unchecked>No</template>
      </NSwitch>
    </NFormItem>

    <NFormItem label="Wait After Load (ms)">
      <NInputNumber
        v-model:value="waitAfterLoad"
        :min="0"
        :max="30000"
        :step="100"
        style="width: 200px"
        data-test="wait-after-load-input"
      />
    </NFormItem>

    <!-- Actions -->
    <NFormItem>
      <NSpace>
        <NButton type="primary" @click="onSubmit" data-test="submit-button">
          Create Run
        </NButton>
        <NButton @click="handleCancel" data-test="cancel-button">
          Cancel
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
