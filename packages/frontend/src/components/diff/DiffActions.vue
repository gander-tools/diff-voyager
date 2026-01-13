<script setup lang="ts">
import type { DiffStatus } from '@gander-tools/diff-voyager-shared';
import { NButton, NPopconfirm, NSpace, useNotification } from 'naive-ui';
import { ref } from 'vue';

interface Props {
  changeId: string;
  currentStatus: DiffStatus;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  accept: [changeId: string];
  mute: [changeId: string];
  createMuteRule: [changeId: string];
  undo: [changeId: string];
}>();

const notification = useNotification();

// Loading states for each action
const isAccepting = ref(false);
const isMuting = ref(false);
const isCreatingRule = ref(false);
const isUndoing = ref(false);

/**
 * Handle accept action
 */
async function handleAccept() {
  isAccepting.value = true;
  try {
    emit('accept', props.changeId);
    notification.success({
      title: 'Change Accepted',
      content: 'The difference has been marked as accepted.',
      duration: 3000,
    });
  } catch (error) {
    notification.error({
      title: 'Accept Failed',
      content: error instanceof Error ? error.message : 'Failed to accept the change.',
      duration: 5000,
    });
  } finally {
    isAccepting.value = false;
  }
}

/**
 * Handle mute action
 */
async function handleMute() {
  isMuting.value = true;
  try {
    emit('mute', props.changeId);
    notification.success({
      title: 'Change Muted',
      content: 'The difference has been muted.',
      duration: 3000,
    });
  } catch (error) {
    notification.error({
      title: 'Mute Failed',
      content: error instanceof Error ? error.message : 'Failed to mute the change.',
      duration: 5000,
    });
  } finally {
    isMuting.value = false;
  }
}

/**
 * Handle create mute rule action
 */
async function handleCreateMuteRule() {
  isCreatingRule.value = true;
  try {
    emit('createMuteRule', props.changeId);
    notification.success({
      title: 'Mute Rule Created',
      content: 'A new mute rule has been created from this difference.',
      duration: 3000,
    });
  } catch (error) {
    notification.error({
      title: 'Rule Creation Failed',
      content: error instanceof Error ? error.message : 'Failed to create mute rule.',
      duration: 5000,
    });
  } finally {
    isCreatingRule.value = false;
  }
}

/**
 * Handle undo action (revert to NEW status)
 */
async function handleUndo() {
  isUndoing.value = true;
  try {
    emit('undo', props.changeId);
    notification.success({
      title: 'Change Reverted',
      content: 'The difference status has been reverted to new.',
      duration: 3000,
    });
  } catch (error) {
    notification.error({
      title: 'Undo Failed',
      content: error instanceof Error ? error.message : 'Failed to undo the change.',
      duration: 5000,
    });
  } finally {
    isUndoing.value = false;
  }
}
</script>

<template>
  <NSpace data-test="diff-actions" :size="8">
    <!-- Accept button - shown when status is NEW -->
    <NPopconfirm
      v-if="currentStatus === DiffStatus.NEW"
      @positive-click="handleAccept"
      positive-text="Accept"
      negative-text="Cancel"
    >
      <template #trigger>
        <NButton
          type="success"
          size="small"
          :disabled="disabled || isAccepting"
          :loading="isAccepting"
          data-test="accept-button"
        >
          Accept
        </NButton>
      </template>
      <span>Are you sure you want to accept this change?</span>
    </NPopconfirm>

    <!-- Mute button - shown when status is NEW -->
    <NPopconfirm
      v-if="currentStatus === DiffStatus.NEW"
      @positive-click="handleMute"
      positive-text="Mute"
      negative-text="Cancel"
    >
      <template #trigger>
        <NButton
          type="warning"
          size="small"
          :disabled="disabled || isMuting"
          :loading="isMuting"
          data-test="mute-button"
        >
          Mute
        </NButton>
      </template>
      <span>Are you sure you want to mute this change?</span>
    </NPopconfirm>

    <!-- Create Mute Rule button - shown when status is NEW -->
    <NPopconfirm
      v-if="currentStatus === DiffStatus.NEW"
      @positive-click="handleCreateMuteRule"
      positive-text="Create Rule"
      negative-text="Cancel"
    >
      <template #trigger>
        <NButton
          type="primary"
          size="small"
          :disabled="disabled || isCreatingRule"
          :loading="isCreatingRule"
          data-test="create-rule-button"
        >
          Create Rule
        </NButton>
      </template>
      <span>Create a mute rule from this change? This will mute similar changes in the future.</span>
    </NPopconfirm>

    <!-- Undo button - shown when status is ACCEPTED or MUTED -->
    <NPopconfirm
      v-if="currentStatus === DiffStatus.ACCEPTED || currentStatus === DiffStatus.MUTED"
      @positive-click="handleUndo"
      positive-text="Undo"
      negative-text="Cancel"
    >
      <template #trigger>
        <NButton
          type="default"
          size="small"
          :disabled="disabled || isUndoing"
          :loading="isUndoing"
          data-test="undo-button"
        >
          Undo
        </NButton>
      </template>
      <span>Are you sure you want to revert this change to NEW status?</span>
    </NPopconfirm>
  </NSpace>
</template>

<style scoped>
/* Styles handled by Naive UI components */
</style>
