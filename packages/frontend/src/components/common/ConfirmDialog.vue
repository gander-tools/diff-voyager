<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in template
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

const { t } = useI18n();

const emit = defineEmits<{
  'update:show': [value: boolean];
  confirm: [];
  cancel: [];
}>();

function handleClose() {
  emit('update:show', false);
}

function handleCancel() {
  emit('cancel');
  handleClose();
}

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
