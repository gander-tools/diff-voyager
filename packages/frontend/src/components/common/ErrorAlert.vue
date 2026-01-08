<script setup lang="ts">
import { NAlert } from 'naive-ui';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  error: string | Error | null;
  title?: string;
  closable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  closable: false,
});

const { t } = useI18n();

const emit = defineEmits<{
  close: [];
}>();

const errorMessage = computed(() => {
  if (!props.error) return '';
  return typeof props.error === 'string' ? props.error : props.error.message;
});
</script>

<template>
  <NAlert
    v-if="error"
    type="error"
    :title="title || t('common.error')"
    :closable="closable"
    @close="emit('close')"
  >
    {{ errorMessage }}
  </NAlert>
</template>
