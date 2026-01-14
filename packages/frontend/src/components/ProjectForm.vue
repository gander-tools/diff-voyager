<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSlider,
  NStep,
  NSteps,
  NSwitch,
  useMessage,
} from 'naive-ui';
import { useForm } from 'vee-validate';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { type CreateProjectInput, createProjectSchema } from '../utils/validators';

const { t } = useI18n();

const emit = defineEmits<{
  submit: [value: CreateProjectInput];
}>();

const message = useMessage();
const currentStep = ref(0);

// vee-validate setup with Zod schema
const { handleSubmit, errors, defineField, validate, values } = useForm({
  validationSchema: toTypedSchema(createProjectSchema),
  initialValues: {
    name: '',
    url: '',
    description: '',
    crawl: false,
    viewport: { width: 1920, height: 1080 },
    collectHar: false,
    waitAfterLoad: 1000,
    visualDiffThreshold: 0.01,
    maxPages: undefined,
  },
});

// Define form fields
const [name] = defineField('name');
const [url] = defineField('url');
const [description] = defineField('description');
const [crawl] = defineField('crawl');
const [maxPages] = defineField('maxPages');
const [viewportWidth] = defineField('viewport.width');
const [viewportHeight] = defineField('viewport.height');
const [collectHar] = defineField('collectHar');
const [waitAfterLoad] = defineField('waitAfterLoad');
const [visualDiffThreshold] = defineField('visualDiffThreshold');

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

const validateStep1 = async (): Promise<boolean> => {
  // Validate only step 1 fields (name is optional, only url is required)
  const result = await validate();

  // Check if there are errors in step 1 fields (url is the only required field)
  const step1Errors = ['url'].some((field) => (errors.value as any)[field]);

  return !step1Errors && result.valid;
};

const handleNext = async () => {
  if (currentStep.value === 0) {
    const isValid = await validateStep1();
    if (!isValid) {
      message.error(t('projects.form.validationErrors'));
      return;
    }
  }

  if (currentStep.value < 2) {
    currentStep.value++;
  }
};

const handlePrev = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const onSubmit = handleSubmit((formValues) => {
  emit('submit', formValues);
});

const handleSubmitClick = async () => {
  if (currentStep.value !== 2) {
    currentStep.value = 0;
    message.error(t('projects.form.completeAllSteps'));
    return;
  }

  const isValid = await validateStep1();
  if (!isValid) {
    currentStep.value = 0;
    message.error(t('projects.form.validationErrors'));
    return;
  }

  onSubmit();
};

const isLastStep = computed(() => currentStep.value === 2);
</script>

<template>
  <div class="project-form">
    <NSteps :current="currentStep + 1" class="steps">
      <NStep :title="t('projects.form.stepBasicInfo')" />
      <NStep :title="t('projects.form.stepCrawlSettings')" />
      <NStep :title="t('projects.form.stepRunProfile')" />
    </NSteps>

    <NForm class="form-content">
      <!-- Step 1: Basic Info -->
      <div v-if="currentStep === 0" class="step-content">
        <NFormItem
          :label="t('projects.form.websiteUrl')"
          :validation-status="errors.url ? 'error' : undefined"
        >
          <NInput
            v-model:value="url"
            :placeholder="t('projects.form.websiteUrlPlaceholder')"
            data-test="url-input"
          />
          <div v-if="errors.url" class="error-message">
            {{ errors.url }}
          </div>
        </NFormItem>

        <NFormItem
          :label="t('projects.form.projectNameOptional')"
          :validation-status="errors.name ? 'error' : undefined"
        >
          <NInput
            v-model:value="name"
            :placeholder="t('projects.form.projectNameHint')"
            data-test="name-input"
          />
          <div v-if="errors.name" class="error-message">
            {{ errors.name }}
          </div>
          <div v-else class="help-text">
            {{ t('projects.form.projectNameDescription') }}
          </div>
        </NFormItem>

        <NFormItem :label="t('projects.form.descriptionOptional')">
          <NInput
            v-model:value="description"
            type="textarea"
            :placeholder="t('projects.form.descriptionHint')"
          />
        </NFormItem>
      </div>

      <!-- Step 2: Crawl Settings -->
      <div v-if="currentStep === 1" class="step-content">
        <NFormItem :label="t('projects.form.enableCrawling')">
          <NSwitch v-model:value="crawl" />
          <div class="help-text">
            {{ t('projects.form.enableCrawlingHint') }}
          </div>
        </NFormItem>

        <NFormItem v-if="crawl" :label="t('projects.form.maxPagesLabel')">
          <NInputNumber
            v-model:value="maxPages"
            :min="1"
            :placeholder="t('projects.form.maxPagesPlaceholder')"
          />
          <div class="help-text">
            {{ t('projects.form.maxPagesHint') }}
          </div>
        </NFormItem>
      </div>

      <!-- Step 3: Run Profile -->
      <div v-if="currentStep === 2" class="step-content">
        <NFormItem :label="t('projects.form.viewportSize')">
          <NSelect
            :value="selectedPreset"
            :options="viewportPresets"
            @update:value="handlePresetChange"
          />
        </NFormItem>

        <NFormItem :label="t('projects.form.customViewport')">
          <div class="viewport-inputs">
            <NInputNumber v-model:value="viewportWidth" :min="320" :max="3840" />
            <span>×</span>
            <NInputNumber v-model:value="viewportHeight" :min="240" :max="2160" />
          </div>
        </NFormItem>

        <NFormItem :label="t('projects.form.collectHarFiles')">
          <NSwitch v-model:value="collectHar" />
          <div class="help-text">{{ t('projects.form.collectHarFilesHint') }}</div>
        </NFormItem>

        <NFormItem :label="t('projects.form.waitAfterLoadLabel')">
          <NInputNumber
            v-model:value="waitAfterLoad"
            :min="0"
            :max="30000"
          />
          <div class="help-text">{{ t('projects.form.waitAfterLoadHint') }}</div>
        </NFormItem>

        <NFormItem :label="t('projects.form.visualDiffThreshold')">
          <NSlider
            v-model:value="visualDiffThreshold"
            :min="0"
            :max="1"
            :step="0.01"
          />
          <div class="help-text">
            {{ ((visualDiffThreshold ?? 0) * 100).toFixed(0) }}{{ t('projects.form.visualDiffThresholdHint') }}
          </div>
        </NFormItem>
      </div>
    </NForm>

    <div class="form-actions">
      <NButton v-if="currentStep > 0" data-test="prev-step-btn" @click="handlePrev">
        {{ t('common.previous') }}
      </NButton>

      <NButton
        v-if="!isLastStep"
        type="primary"
        data-test="next-step-btn"
        @click="handleNext"
      >
        {{ t('common.next') }}
      </NButton>

      <NButton
        v-if="isLastStep"
        type="primary"
        data-test="submit-btn"
        @click="handleSubmitClick"
      >
        {{ t('projects.create') }}
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.project-form {
  max-width: 800px;
  margin: 0 auto;
}

.steps {
  margin-bottom: 32px;
}

.form-content {
  min-height: 400px;
}

.step-content {
  padding: 24px 0;
}

.error-message {
  color: #d03050;
  font-size: 12px;
  margin-top: 4px;
}

.help-text {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.viewport-inputs {
  display: flex;
  gap: 12px;
  align-items: center;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}
</style>
