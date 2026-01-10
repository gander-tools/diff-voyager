<script setup lang="ts">
import {
  NButton,
  NCard,
  NEmpty,
  NLi,
  NModal,
  NP,
  NPageHeader,
  NSpace,
  NSpin,
  NText,
  NUl,
  useDialog,
  useNotification,
} from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ProjectStatistics from '../components/ProjectStatistics.vue';
import ProjectStatusBadge from '../components/ProjectStatusBadge.vue';
import { createRun, listRuns, retryRun } from '../services/api';
import { type ProjectDetails, useProjectsStore } from '../stores/projects';

const route = useRoute();
const router = useRouter();
const projectsStore = useProjectsStore();
const dialog = useDialog();
const notification = useNotification();

const projectId = computed(() => route.params.projectId as string);
const loading = ref(true);
const error = ref<string | null>(null);

// Retry state
const retryingFailed = ref(false);
const rescanning = ref(false);
const showRetryDialog = ref(false);
const showRescanDialog = ref(false);

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

const handleRetryFailedDialog = () => {
  showRetryDialog.value = true;
};

const handleRetryFailed = async (scope: 'failed' | 'all') => {
  if (!project.value) return;

  retryingFailed.value = true;
  showRetryDialog.value = false;

  try {
    // Get latest run
    const runs = await listRuns(project.value.id);
    const latestRun = runs[0];

    if (!latestRun) {
      throw new Error('No run found for this project');
    }

    const result = await retryRun(latestRun.id, scope);

    notification.success({
      title: 'Retry Complete',
      content: result.message,
      duration: 5000,
    });

    // Refresh project data
    await projectsStore.fetchProjectById(project.value.id);
  } catch (err) {
    notification.error({
      title: 'Retry Failed',
      content: (err as Error).message,
      duration: 5000,
    });
  } finally {
    retryingFailed.value = false;
  }
};

const handleRescanDialog = () => {
  showRescanDialog.value = true;
};

const handleRescan = async () => {
  if (!project.value) return;

  rescanning.value = true;
  showRescanDialog.value = false;

  try {
    const result = await createRun(project.value.id, {
      url: project.value.baseUrl,
      viewport: projectDetails.value?.config.viewport || { width: 1920, height: 1080 },
      collectHar: false,
      waitAfterLoad: 1000,
    });

    notification.success({
      title: 'Re-scan Started',
      content: 'New comparison run created. Redirecting...',
      duration: 3000,
    });

    // Navigate to new run
    router.push(`/runs/${result.runId}`);
  } catch (err) {
    notification.error({
      title: 'Re-scan Failed',
      content: (err as Error).message,
      duration: 5000,
    });
  } finally {
    rescanning.value = false;
  }
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

              <!-- Retry Failed Pages button -->
              <NButton
                v-if="projectDetails?.statistics && projectDetails.statistics.errorPages > 0"
                type="warning"
                :loading="retryingFailed"
                @click="handleRetryFailedDialog"
              >
                Retry Failed Pages ({{ projectDetails.statistics.errorPages }})
              </NButton>

              <!-- Re-scan Project button -->
              <NButton type="primary" :loading="rescanning" @click="handleRescanDialog">
                Re-scan Project
              </NButton>

              <NButton data-test="back-button" @click="handleBack">Back</NButton>
              <NButton secondary data-test="create-run-button" @click="handleCreateRun">
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

    <!-- Retry Failed Pages Dialog -->
    <NModal
      v-model:show="showRetryDialog"
      preset="dialog"
      title="Retry Failed Pages"
      positive-text="Retry Failed Only"
      negative-text="Retry All Pages"
      @positive-click="() => handleRetryFailed('failed')"
      @negative-click="() => handleRetryFailed('all')"
    >
      <NP>Choose which pages to retry in the current run:</NP>
      <NUl>
        <NLi>
          <strong>Retry Failed Only:</strong> Retry only
          {{ projectDetails?.statistics?.errorPages || 0 }} failed pages
        </NLi>
        <NLi>
          <strong>Retry All Pages:</strong> Retry all
          {{ projectDetails?.statistics?.totalPages || 0 }} pages (both successful and failed)
        </NLi>
      </NUl>
    </NModal>

    <!-- Re-scan Project Dialog -->
    <NModal
      v-model:show="showRescanDialog"
      preset="dialog"
      title="Re-scan Project"
      positive-text="Create New Run"
      negative-text="Cancel"
      @positive-click="handleRescan"
    >
      <NP>
        This will create a new comparison run and scan all
        {{ projectDetails?.statistics?.totalPages || 0 }} pages again.
      </NP>
      <NP>The baseline and previous runs will remain unchanged.</NP>
    </NModal>
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
