<script setup lang="ts">
import { NButton, NCard, NEmpty, NPageHeader, NSpace, NSpin, NText, useDialog } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ProjectStatistics from '../components/ProjectStatistics.vue';
import ProjectStatusBadge from '../components/ProjectStatusBadge.vue';
import { type ProjectDetails, useProjectsStore } from '../stores/projects';

const route = useRoute();
const router = useRouter();
const projectsStore = useProjectsStore();
const dialog = useDialog();

const projectId = computed(() => route.params.projectId as string);
const loading = ref(true);
const error = ref<string | null>(null);

const project = computed(() => projectsStore.currentProject);

// Type guard for ProjectDetails
const isProjectDetails = (p: typeof project.value): p is ProjectDetails => {
  return p !== null && 'statistics' in p && 'config' in p;
};

const projectDetails = computed(() => {
  const p = project.value;
  return isProjectDetails(p) ? p : null;
});

const loadProject = async () => {
  loading.value = true;
  error.value = null;

  try {
    await projectsStore.fetchProjectById(projectId.value);
  } catch (err) {
    error.value = 'Project not found';
    console.error('Failed to load project:', err);
  } finally {
    loading.value = false;
  }
};

const handleBack = () => {
  router.push({ name: 'projects' });
};

const handleCreateRun = () => {
  router.push({
    name: 'run-create',
    params: { projectId: projectId.value },
  });
};

const handleDelete = async () => {
  if (!project.value) return;

  dialog.warning({
    title: 'Confirm Delete',
    content: `Are you sure you want to delete project "${project.value.name}"?`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        await projectsStore.deleteProject(projectId.value);
        await router.push({ name: 'projects' });
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    },
  });
};

onMounted(() => {
  loadProject();
});
</script>

<template>
  <div class="project-detail-view">
    <NSpin :show="loading" description="Loading project...">
      <div v-if="error" class="error-container">
        <NEmpty description="Project not found">
          <template #extra>
            <NButton @click="handleBack">Back to Projects</NButton>
          </template>
        </NEmpty>
      </div>

      <div v-else-if="project">
        <NPageHeader :title="project.name" @back="handleBack">
          <template #subtitle>
            <NText depth="3">{{ project.baseUrl }}</NText>
          </template>

          <template #extra>
            <NSpace>
              <ProjectStatusBadge :status="project.status" />
              <NButton data-test="back-button" @click="handleBack">Back</NButton>
              <NButton type="primary" data-test="create-run-button" @click="handleCreateRun">
                New Run
              </NButton>
              <NButton type="error" secondary data-test="delete-button" @click="handleDelete">
                Delete
              </NButton>
            </NSpace>
          </template>
        </NPageHeader>

        <NSpace vertical :size="24" class="content">
          <NCard v-if="project.description" title="Description">
            <NText>{{ project.description }}</NText>
          </NCard>

          <NCard v-if="projectDetails?.statistics" title="Statistics">
            <ProjectStatistics :statistics="projectDetails.statistics" />
          </NCard>

          <NCard v-if="projectDetails?.config" title="Configuration">
            <NSpace vertical :size="8">
              <NText>
                <strong>Crawl:</strong> {{ projectDetails.config.crawl ? 'Enabled' : 'Disabled' }}
              </NText>
              <NText v-if="projectDetails.config.maxPages">
                <strong>Max Pages:</strong> {{ projectDetails.config.maxPages }}
              </NText>
              <NText>
                <strong>Viewport:</strong> {{ projectDetails.config.viewport.width }}x{{
                  projectDetails.config.viewport.height
                }}
              </NText>
              <NText>
                <strong>Visual Diff Threshold:</strong>
                {{ (projectDetails.config.visualDiffThreshold * 100).toFixed(1) }}%
              </NText>
            </NSpace>
          </NCard>
        </NSpace>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.project-detail-view {
  padding: 24px;
}

.content {
  margin-top: 24px;
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>
