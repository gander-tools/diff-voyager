<script setup lang="ts">
import { DiffType, RuleScope } from '@gander-tools/diff-voyager-shared';
import { toTypedSchema } from '@vee-validate/zod';
import { NAlert, NButton, NForm, NFormItem, NInput, NSelect, NSpace, NSwitch } from 'naive-ui';
import { useForm } from 'vee-validate';
import { computed, watch } from 'vue';
import {
  type CreateRuleInput,
  createRuleSchema,
  type RuleConditionBuilderInput,
} from '../utils/validators';
import RuleConditionBuilder from './RuleConditionBuilder.vue';

interface Props {
  modelValue?: Partial<CreateRuleInput>;
  projectId?: string;
  loading?: boolean;
  submitError?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [value: CreateRuleInput];
  cancel: [];
}>();

// Determine if scope should be locked to 'project' based on projectId
const isProjectScoped = computed(() => !!props.projectId);

// vee-validate setup with Zod schema
const { handleSubmit, errors, defineField, values, setFieldValue } = useForm({
  validationSchema: toTypedSchema(createRuleSchema),
  initialValues: {
    name: props.modelValue?.name || '',
    description: props.modelValue?.description || '',
    scope:
      props.modelValue?.scope || (isProjectScoped.value ? RuleScope.PROJECT : RuleScope.GLOBAL),
    active: props.modelValue?.active ?? true,
    conditions: props.modelValue?.conditions || {
      operator: 'AND' as const,
      conditions: [
        {
          diffType: DiffType.SEO,
          cssSelector: '',
          xpathSelector: '',
          fieldPattern: '',
          headerName: '',
          valuePattern: '',
        },
      ],
    },
  },
});

// Define form fields
const [name] = defineField('name');
const [description] = defineField('description');
const [scope] = defineField('scope');
const [active] = defineField('active');
const [conditionsField] = defineField('conditions');

// Computed value to properly type conditions for RuleConditionBuilder
const conditions = computed({
  get: () => conditionsField.value as RuleConditionBuilderInput,
  set: (value) => {
    conditionsField.value = value;
  },
});

// Scope options
const scopeOptions = computed(() => {
  if (isProjectScoped.value) {
    return [{ label: 'Project', value: RuleScope.PROJECT }];
  }
  return [
    { label: 'Global', value: RuleScope.GLOBAL },
    { label: 'Project', value: RuleScope.PROJECT },
  ];
});

// Lock scope to 'project' when projectId is provided
watch(
  () => props.projectId,
  (newProjectId) => {
    if (newProjectId && scope.value !== RuleScope.PROJECT) {
      setFieldValue('scope', RuleScope.PROJECT);
    }
  },
  { immediate: true },
);

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

    <!-- Name -->
    <NFormItem label="Rule Name *" :validation-status="errors.name ? 'error' : undefined" :feedback="errors.name">
      <NInput
        v-model:value="name"
        placeholder="Enter a descriptive name for this rule"
        :disabled="loading"
        data-test="name-input"
      />
    </NFormItem>

    <!-- Description -->
    <NFormItem
      label="Description"
      :validation-status="errors.description ? 'error' : undefined"
      :feedback="errors.description"
    >
      <NInput
        v-model:value="description"
        type="textarea"
        placeholder="Optional description of what this rule does"
        :disabled="loading"
        :rows="3"
        data-test="description-input"
      />
    </NFormItem>

    <!-- Scope -->
    <NFormItem label="Scope *" :validation-status="errors.scope ? 'error' : undefined" :feedback="errors.scope">
      <NSelect
        v-model:value="scope"
        :options="scopeOptions"
        :disabled="loading || isProjectScoped"
        data-test="scope-select"
      />
    </NFormItem>

    <!-- Active Toggle -->
    <NFormItem label="Active">
      <NSwitch v-model:value="active" :disabled="loading" data-test="active-switch">
        <template #checked>Enabled</template>
        <template #unchecked>Disabled</template>
      </NSwitch>
    </NFormItem>

    <!-- Conditions Builder -->
    <NFormItem
      label="Conditions *"
      :validation-status="errors['conditions.conditions'] ? 'error' : undefined"
      :feedback="errors['conditions.conditions']"
    >
      <RuleConditionBuilder v-model="conditions" :disabled="loading" />
    </NFormItem>

    <!-- Actions -->
    <NFormItem>
      <NSpace>
        <NButton type="primary" :loading="loading" :disabled="loading" @click="onSubmit" data-test="submit-button">
          {{ modelValue ? 'Update Rule' : 'Create Rule' }}
        </NButton>
        <NButton :disabled="loading" @click="handleCancel" data-test="cancel-button">
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
