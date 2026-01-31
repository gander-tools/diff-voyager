<script setup lang="ts">
import { DiffType } from '@gander-tools/diff-voyager-shared';
import { toTypedSchema } from '@vee-validate/zod';
import { Help, Plus, Trash } from '@vicons/tabler';
import {
  NButton,
  NCard,
  NDivider,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NSelect,
  NSpace,
  NTooltip,
} from 'naive-ui';
import { useFieldArray, useForm } from 'vee-validate';
import { computed } from 'vue';
import {
  type RuleConditionBuilderInput,
  type RuleConditionInput,
  ruleConditionBuilderSchema,
} from '../utils/validators';

interface Props {
  modelValue?: RuleConditionBuilderInput;
  disabled?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: RuleConditionBuilderInput];
}>();

// vee-validate setup with Zod schema
const { handleSubmit, errors, defineField, values } = useForm({
  validationSchema: toTypedSchema(ruleConditionBuilderSchema),
  initialValues: props.modelValue || {
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
});

// Define operator field
const [operator] = defineField('operator');

// Setup field array for conditions
const { fields, push, remove } = useFieldArray('conditions');

// Diff type options
const diffTypeOptions = [
  { label: 'SEO', value: 'seo' },
  { label: 'Visual', value: 'visual' },
  { label: 'Content', value: 'content' },
  { label: 'Performance', value: 'performance' },
  { label: 'HTTP Status', value: 'http_status' },
  { label: 'Headers', value: 'headers' },
];

// Operator options
const operatorOptions = [
  { label: 'AND (All conditions must match)', value: 'AND' },
  { label: 'OR (Any condition can match)', value: 'OR' },
];

// Helper text for tooltips
const helpText = {
  diffType: 'Select the type of difference this condition should match',
  cssSelector: 'CSS selector to target specific elements (e.g., ".header", "#main")',
  xpathSelector:
    'XPath expression for precise element selection (e.g., "//div[@class=\'content\']")',
  fieldPattern: 'Field name pattern to match (e.g., "title", "description")',
  headerName: 'HTTP header name to match (e.g., "Content-Type", "Cache-Control")',
  valuePattern: 'Value pattern to match (supports regex, e.g., "^https://.*")',
  operator: 'AND requires all conditions to match, OR requires at least one',
};

// Add new condition
const addCondition = () => {
  push({
    diffType: 'seo',
    cssSelector: '',
    xpathSelector: '',
    fieldPattern: '',
    headerName: '',
    valuePattern: '',
  });
};

// Remove condition
const removeCondition = (index: number) => {
  if (fields.value.length > 1) {
    remove(index);
  }
};

// Emit value changes
const emitUpdate = () => {
  emit('update:modelValue', values as RuleConditionBuilderInput);
};

// Watch for changes and emit
const conditionsChanged = computed(() => JSON.stringify(values));
watch(conditionsChanged, emitUpdate);

// Import watch from vue
import { watch } from 'vue';
</script>

<template>
  <div class="rule-condition-builder">
    <NForm :model="values" label-placement="top" label-width="auto">
      <!-- Operator Selection -->
      <NFormItem :validation-status="errors.operator ? 'error' : undefined" :feedback="errors.operator">
        <template #label>
          <NSpace align="center" :size="4">
            <span>Logical Operator</span>
            <NTooltip>
              <template #trigger>
                <NIcon :size="16" style="cursor: help">
                  <Help />
                </NIcon>
              </template>
              {{ helpText.operator }}
            </NTooltip>
          </NSpace>
        </template>
        <NSelect
          v-model:value="operator"
          :options="operatorOptions"
          :disabled="disabled"
          data-test="operator-select"
        />
      </NFormItem>

      <NDivider />

      <!-- Conditions List -->
      <div
        v-for="(field, index) in fields"
        :key="field.key"
        class="condition-item"
        :data-test="`condition-${index}`"
      >
        <NCard :title="`Condition ${index + 1}`" size="small">
          <template #header-extra>
            <NButton
              v-if="fields.length > 1"
              text
              type="error"
              :disabled="disabled"
              @click="removeCondition(index)"
              :data-test="`remove-condition-${index}`"
            >
              <template #icon>
                <NIcon>
                  <Trash />
                </NIcon>
              </template>
              Remove
            </NButton>
          </template>

          <!-- Diff Type -->
          <NFormItem
            :label-width="0"
            :validation-status="errors[`conditions[${index}].diffType`] ? 'error' : undefined"
            :feedback="errors[`conditions[${index}].diffType`]"
          >
            <template #label>
              <NSpace align="center" :size="4">
                <span>Diff Type *</span>
                <NTooltip>
                  <template #trigger>
                    <NIcon :size="16" style="cursor: help">
                      <Help />
                    </NIcon>
                  </template>
                  {{ helpText.diffType }}
                </NTooltip>
              </NSpace>
            </template>
            <NSelect
              v-model:value="(field.value as RuleConditionInput).diffType"
              :options="diffTypeOptions"
              :disabled="disabled"
              :data-test="`diffType-select-${index}`"
            />
          </NFormItem>

          <!-- CSS Selector -->
          <NFormItem
            :validation-status="errors[`conditions[${index}].cssSelector`] ? 'error' : undefined"
            :feedback="errors[`conditions[${index}].cssSelector`]"
          >
            <template #label>
              <NSpace align="center" :size="4">
                <span>CSS Selector</span>
                <NTooltip>
                  <template #trigger>
                    <NIcon :size="16" style="cursor: help">
                      <Help />
                    </NIcon>
                  </template>
                  {{ helpText.cssSelector }}
                </NTooltip>
              </NSpace>
            </template>
            <NInput
              v-model:value="(field.value as RuleConditionInput).cssSelector"
              placeholder=".header, #main, .content > div"
              :disabled="disabled"
              :data-test="`cssSelector-input-${index}`"
            />
          </NFormItem>

          <!-- XPath Selector -->
          <NFormItem
            :validation-status="errors[`conditions[${index}].xpathSelector`] ? 'error' : undefined"
            :feedback="errors[`conditions[${index}].xpathSelector`]"
          >
            <template #label>
              <NSpace align="center" :size="4">
                <span>XPath Selector</span>
                <NTooltip>
                  <template #trigger>
                    <NIcon :size="16" style="cursor: help">
                      <Help />
                    </NIcon>
                  </template>
                  {{ helpText.xpathSelector }}
                </NTooltip>
              </NSpace>
            </template>
            <NInput
              v-model:value="(field.value as RuleConditionInput).xpathSelector"
              placeholder="//div[@class='content']"
              :disabled="disabled"
              :data-test="`xpathSelector-input-${index}`"
            />
          </NFormItem>

          <!-- Field Pattern -->
          <NFormItem
            :validation-status="errors[`conditions[${index}].fieldPattern`] ? 'error' : undefined"
            :feedback="errors[`conditions[${index}].fieldPattern`]"
          >
            <template #label>
              <NSpace align="center" :size="4">
                <span>Field Pattern</span>
                <NTooltip>
                  <template #trigger>
                    <NIcon :size="16" style="cursor: help">
                      <Help />
                    </NIcon>
                  </template>
                  {{ helpText.fieldPattern }}
                </NTooltip>
              </NSpace>
            </template>
            <NInput
              v-model:value="(field.value as RuleConditionInput).fieldPattern"
              placeholder="title, description, canonical"
              :disabled="disabled"
              :data-test="`fieldPattern-input-${index}`"
            />
          </NFormItem>

          <!-- Header Name -->
          <NFormItem
            :validation-status="errors[`conditions[${index}].headerName`] ? 'error' : undefined"
            :feedback="errors[`conditions[${index}].headerName`]"
          >
            <template #label>
              <NSpace align="center" :size="4">
                <span>Header Name</span>
                <NTooltip>
                  <template #trigger>
                    <NIcon :size="16" style="cursor: help">
                      <Help />
                    </NIcon>
                  </template>
                  {{ helpText.headerName }}
                </NTooltip>
              </NSpace>
            </template>
            <NInput
              v-model:value="(field.value as RuleConditionInput).headerName"
              placeholder="Content-Type, Cache-Control"
              :disabled="disabled"
              :data-test="`headerName-input-${index}`"
            />
          </NFormItem>

          <!-- Value Pattern -->
          <NFormItem
            :validation-status="errors[`conditions[${index}].valuePattern`] ? 'error' : undefined"
            :feedback="errors[`conditions[${index}].valuePattern`]"
          >
            <template #label>
              <NSpace align="center" :size="4">
                <span>Value Pattern</span>
                <NTooltip>
                  <template #trigger>
                    <NIcon :size="16" style="cursor: help">
                      <Help />
                    </NIcon>
                  </template>
                  {{ helpText.valuePattern }}
                </NTooltip>
              </NSpace>
            </template>
            <NInput
              v-model:value="(field.value as RuleConditionInput).valuePattern"
              placeholder="^https://.*"
              :disabled="disabled"
              :data-test="`valuePattern-input-${index}`"
            />
          </NFormItem>
        </NCard>
      </div>

      <!-- Add Condition Button -->
      <NButton
        type="primary"
        dashed
        block
        :disabled="disabled"
        @click="addCondition"
        data-test="add-condition-button"
        style="margin-top: 16px"
      >
        <template #icon>
          <NIcon>
            <Plus />
          </NIcon>
        </template>
        Add Condition
      </NButton>
    </NForm>
  </div>
</template>

<style scoped>
.rule-condition-builder {
  width: 100%;
}

.condition-item {
  margin-bottom: 16px;
}

.condition-item:last-of-type {
  margin-bottom: 0;
}

.n-form-item {
  margin-bottom: 16px;
}
</style>
