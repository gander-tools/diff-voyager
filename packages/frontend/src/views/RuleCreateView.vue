<script setup lang="ts">
import { NButton, NCard, NPageHeader } from 'naive-ui';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import RuleForm from '../components/RuleForm.vue';
import { useRulesStore } from '../stores/rules';
import type { CreateRuleInput } from '../utils/validators';

const route = useRoute();
const router = useRouter();
const rulesStore = useRulesStore();

const isCreating = ref(false);
const submitError = ref<string | undefined>(undefined);

// Check if projectId is provided in query params for project-scoped rules
const projectId = route.query.projectId as string | undefined;

const handleSubmit = async (formData: CreateRuleInput) => {
  isCreating.value = true;
  submitError.value = undefined;

  try {
    await rulesStore.createRule(formData);

    // Navigate back to rules list on success
    await router.push({ name: 'rules' });
  } catch (error) {
    console.error('Failed to create rule:', error);
    submitError.value =
      error instanceof Error ? error.message : 'Failed to create rule. Please try again.';
  } finally {
    isCreating.value = false;
  }
};

const handleCancel = () => {
  router.push({ name: 'rules' });
};

const handleBack = () => {
  router.push({ name: 'rules' });
};
</script>

<template>
  <div class="rule-create-view">
    <NPageHeader title="Create New Rule" @back="handleBack">
      <template #subtitle>
        Define conditions to mute or accept differences
      </template>
      <template #extra>
        <NButton data-test="back-button" @click="handleBack">Cancel</NButton>
      </template>
    </NPageHeader>

    <NCard class="form-card">
      <RuleForm
        :project-id="projectId"
        :loading="isCreating"
        :submit-error="submitError"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </NCard>
  </div>
</template>

<style scoped>
.rule-create-view {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.form-card {
  margin-top: 24px;
}
</style>
