<script setup lang="ts">
import { NButton, NCard, NPageHeader, NSpin } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import RunForm from '../components/RunForm.vue';
import { useProjectsStore } from '../stores/projects';
import { useRunsStore } from '../stores/runs';
import type { CreateRunInput } from '../utils/validators';

const route = useRoute();
const router = useRouter();
const projectsStore = useProjectsStore();
const runsStore = useRunsStore();

const projectId = computed(() => route.params.projectId as string);
const project = computed(() => projectsStore.currentProject);
const isCreating = ref(false);
const isLoading = ref(true);
const submitError = ref<string | undefined>(undefined);

// Load project data on mount
onMounted(async () => {
  try {
    await projectsStore.fetchProjectById(projectId.value);
  } catch (error) {
    console.error('Failed to load project:', error);
  } finally {
    isLoading.value = false;
  }
});

const handleSubmit = async (formData: CreateRunInput) => {
  isCreating.value = true;
  submitError.value = undefined;

  try {
    const response = await runsStore.createNewRun(projectId.value, formData);

    if (response && response.runId) {
      await router.push({
        name: 'run-detail',
        params: { runId: response.runId },
      });
    }
  } catch (error) {
    console.error('Failed to create run:', error);
    submitError.value =
      error instanceof Error ? error.message : 'Failed to create run. Please try again.';
  } finally {
    isCreating.value = false;
  }
};

const handleCancel = () => {
  router.push({
    name: 'runs',
    params: { projectId: projectId.value },
  });
};

const handleBack = () => {
  router.push({
    name: 'runs',
    params: { projectId: projectId.value },
  });
};
</script>

<template>
  <div class="run-create-view">
    <NPageHeader title="Create New Run" @back="handleBack">
      <template #subtitle>
        <span v-if="project">{{ project.name }}</span>
      </template>
      <template #extra>
        <NButton data-test="back-button" @click="handleBack">Cancel</NButton>
      </template>
    </NPageHeader>

    <NCard class="form-card">
      <NSpin v-if="isLoading" description="Loading project...">
        <div style="min-height: 400px"></div>
      </NSpin>
      <RunForm
        v-else-if="project"
        :project-url="project.baseUrl"
        :loading="isCreating"
        :submit-error="submitError"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </NCard>
  </div>
</template>

<style scoped>
.run-create-view {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.form-card {
  margin-top: 24px;
}
</style>

