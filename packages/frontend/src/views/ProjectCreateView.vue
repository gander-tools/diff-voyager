<script setup lang="ts">
import { NButton, NCard, NPageHeader, NSpin } from 'naive-ui';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import ProjectForm from '../components/ProjectForm.vue';
import { useProjectsStore } from '../stores/projects';
import type { CreateProjectInput } from '../utils/validators';

const { t } = useI18n();

const router = useRouter();
const projectsStore = useProjectsStore();

const isCreating = ref(false);

const handleSubmit = async (formData: CreateProjectInput) => {
  isCreating.value = true;

  try {
    const project = await projectsStore.createProject(formData);

    if (project) {
      await router.push({
        name: 'project-detail',
        params: { projectId: project.id },
      });
    }
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
    <NPageHeader :title="t('projects.create')" @back="handleBack">
      <template #extra>
        <NButton data-test="back-button" @click="handleBack">{{ t('common.cancel') }}</NButton>
      </template>
    </NPageHeader>

    <NCard class="form-card">
      <NSpin :show="isCreating" :description="t('projects.form.creating')">
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
