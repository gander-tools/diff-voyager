<script setup lang="ts">
import { NButton, NModal, NSpace } from 'naive-ui';
import { useI18n } from 'vue-i18n';

interface Props {
  show: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  type?: 'default' | 'error' | 'warning' | 'success';
}

withDefaults(defineProps<Props>(), {
  loading: false,
  type: 'default',
});

// biome-ignore lint/correctness/noUnusedVariables: used in template
const { t } = useI18n();

const emit = defineEmits<{
  'update:show': [value: boolean];
  confirm: [];
  cancel: [];
}>();

function handleClose() {
  emit('update:show', false);
}

// biome-ignore lint/correctness/noUnusedVariables: used in template
function handleCancel() {
  emit('cancel');
  handleClose();
}

// biome-ignore lint/correctness/noUnusedVariables: used in template
function handleConfirm() {
  emit('confirm');
}
</script>

<template>
  <NModal
    :show="show"
    :title="title"
    preset="dialog"
    :type="type"
    @update:show="emit('update:show', $event)"
  >
    <p>{{ message }}</p>

    <template #action>
      <NSpace>
        <NButton @click="handleCancel">
          {{ cancelText || t('common.cancel') }}
        </NButton>
        <NButton
          type="primary"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ confirmText || t('common.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
