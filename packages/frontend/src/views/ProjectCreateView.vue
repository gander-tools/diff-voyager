<script setup lang="ts">
import { NButton, NCard, NPageHeader, NSpin } from 'naive-ui';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ProjectForm from '../components/ProjectForm.vue';
import { useProjectsStore } from '../stores/projects';
import type { CreateProjectInput } from '../utils/validators';

const router = useRouter();
const projectsStore = useProjectsStore();

const isCreating = ref(false);

const handleSubmit = async (formData: CreateProjectInput) => {
  isCreating.value = true;

  try {
    // Create project in async mode - returns immediately with project ID
    const { projectId } = await projectsStore.createProject(formData);

    // Immediately redirect to project detail view
    // Project will show "processing" status initially
    await router.push({
      name: 'project-detail',
      params: { projectId },
    });
  } catch (error) {
    console.error('Failed to create project:', error);
  } finally {
    isCreating.value = false;
  }
};

const handleBack = () => {
  router.push({ name: 'projects' });
};
</script>

<template>
  <div class="project-create-view">
    <NPageHeader title="Create New Project" @back="handleBack">
      <template #extra>
        <NButton data-test="back-button" @click="handleBack">Cancel</NButton>
      </template>
    </NPageHeader>

    <NCard class="form-card">
      <NSpin :show="isCreating" description="Creating project...">
        <ProjectForm @submit="handleSubmit" />
      </NSpin>
    </NCard>
  </div>
</template>

<style scoped>
.project-create-view {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.form-card {
  margin-top: 24px;
}
</style>
