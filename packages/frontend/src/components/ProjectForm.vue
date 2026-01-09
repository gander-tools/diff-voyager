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
import { type CreateProjectInput, createProjectSchema } from '../utils/validators';

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

const validateStep1 = async (): Promise<boolean> => {
  // Validate only step 1 fields
  const result = await validate();

  // Check if there are errors in step 1 fields
  const step1Errors = ['name', 'url', 'description'].some((field) => errors.value[field]);

  return !step1Errors && result.valid;
};

const handleNext = async () => {
  if (currentStep.value === 0) {
    const isValid = await validateStep1();
    if (!isValid) {
      message.error('Please fix validation errors');
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
    message.error('Please complete all steps');
    return;
  }

  const isValid = await validateStep1();
  if (!isValid) {
    currentStep.value = 0;
    message.error('Please fix validation errors');
    return;
  }

  onSubmit();
};

const isLastStep = computed(() => currentStep.value === 2);
</script>

<template>
  <div class="project-form">
    <NSteps :current="currentStep" class="steps">
      <NStep title="Basic Info" />
      <NStep title="Crawl Settings" />
      <NStep title="Run Profile" />
    </NSteps>

    <NForm class="form-content">
      <!-- Step 1: Basic Info -->
      <div v-if="currentStep === 0" class="step-content">
        <NFormItem
          label="Project Name"
          :validation-status="errors.name ? 'error' : undefined"
        >
          <NInput
            v-model:value="name"
            placeholder="Enter project name"
            data-test="name-input"
          />
          <div v-if="errors.name" class="error-message">
            {{ errors.name }}
          </div>
        </NFormItem>

        <NFormItem
          label="Website URL"
          :validation-status="errors.url ? 'error' : undefined"
        >
          <NInput
            v-model:value="url"
            placeholder="https://example.com"
            data-test="url-input"
          />
          <div v-if="errors.url" class="error-message">
            {{ errors.url }}
          </div>
        </NFormItem>

        <NFormItem label="Description (optional)">
          <NInput
            v-model:value="description"
            type="textarea"
            placeholder="Optional project description"
          />
        </NFormItem>
      </div>

      <!-- Step 2: Crawl Settings -->
      <div v-if="currentStep === 1" class="step-content">
        <NFormItem label="Enable Crawling">
          <NSwitch v-model:value="crawl" />
          <div class="help-text">
            Automatically discover pages by following links
          </div>
        </NFormItem>

        <NFormItem v-if="crawl" label="Maximum Pages">
          <NInputNumber
            v-model:value="maxPages"
            :min="1"
            placeholder="Unlimited"
          />
          <div class="help-text">
            Limit the number of pages to crawl (leave empty for unlimited)
          </div>
        </NFormItem>
      </div>

      <!-- Step 3: Run Profile -->
      <div v-if="currentStep === 2" class="step-content">
        <NFormItem label="Viewport Size">
          <NSelect
            :value="selectedPreset"
            :options="viewportPresets"
            @update:value="handlePresetChange"
          />
        </NFormItem>

        <NFormItem label="Custom Viewport">
          <div class="viewport-inputs">
            <NInputNumber v-model:value="viewportWidth" :min="320" :max="3840" />
            <span>×</span>
            <NInputNumber v-model:value="viewportHeight" :min="240" :max="2160" />
          </div>
        </NFormItem>

        <NFormItem label="Collect HAR Files">
          <NSwitch v-model:value="collectHar" />
          <div class="help-text">Record network activity for performance analysis</div>
        </NFormItem>

        <NFormItem label="Wait After Load (ms)">
          <NInputNumber
            v-model:value="waitAfterLoad"
            :min="0"
            :max="30000"
          />
          <div class="help-text">Wait time for dynamic content to load</div>
        </NFormItem>

        <NFormItem label="Visual Diff Threshold">
          <NSlider
            v-model:value="visualDiffThreshold"
            :min="0"
            :max="1"
            :step="0.01"
          />
          <div class="help-text">
            {{ (visualDiffThreshold * 100).toFixed(0) }}% - Percentage of pixel difference to flag as changed
          </div>
        </NFormItem>
      </div>
    </NForm>

    <div class="form-actions">
      <NButton v-if="currentStep > 0" data-test="prev-step-btn" @click="handlePrev">
        Previous
      </NButton>

      <NButton
        v-if="!isLastStep"
        type="primary"
        data-test="next-step-btn"
        @click="handleNext"
      >
        Next
      </NButton>

      <NButton
        v-if="isLastStep"
        type="primary"
        data-test="submit-btn"
        @click="handleSubmitClick"
      >
        Create Project
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
