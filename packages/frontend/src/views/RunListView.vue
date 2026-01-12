<script setup lang="ts">
import { NButton, NEmpty, NGrid, NGridItem, NPagination, NSpin, NText } from 'naive-ui';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import RunCard from '../components/RunCard.vue';
import { useProjectsStore } from '../stores/projects';
import { useRunsStore } from '../stores/runs';

const route = useRoute();
const router = useRouter();
const projectsStore = useProjectsStore();
const runsStore = useRunsStore();

const projectId = computed(() => route.params.projectId as string);
const page = ref(1);
const pageSize = 12;
const totalRuns = ref(0);

const loading = ref(true);
const error = ref<string | null>(null);

const project = computed(() => projectsStore.currentProject);
const runs = computed(() => runsStore.runs[projectId.value] || []);

const loadData = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Fetch project info if not already loaded
    if (!project.value || project.value.id !== projectId.value) {
      await projectsStore.fetchProjectById(projectId.value);
    }

    // Fetch runs
    const offset = (page.value - 1) * pageSize;
    const projectRuns = await runsStore.fetchRuns(projectId.value, {
      limit: pageSize,
      offset,
    });

    // Note: API doesn't return total count yet, using array length for now
    totalRuns.value = projectRuns.length;
  } catch (err) {
    error.value = (err as Error).message;
    console.error('Failed to load runs:', err);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = async (newPage: number) => {
  page.value = newPage;
  await loadData();
};

const handleNewRun = () => {
  router.push({
    name: 'run-create',
    params: { projectId: projectId.value },
  });
};

const handleRunClick = (runId: string) => {
  router.push({
    name: 'run-detail',
    params: { runId },
  });
};

const handleBackToProject = () => {
  router.push({
    name: 'project-detail',
    params: { projectId: projectId.value },
  });
};

// Load data on mount and when projectId changes
onMounted(() => {
  loadData();
});

watch(
  () => route.params.projectId,
  () => {
    page.value = 1;
    loadData();
  },
);
</script>

<template>
  <div class="run-list-view">
    <div class="header">
      <div>
        <h1>Runs</h1>
        <p v-if="project" class="subtitle">
          {{ project.name }} - All comparison runs
        </p>
        <p v-else class="subtitle">Loading project...</p>
      </div>
      <div class="header-actions">
        <NButton data-test="back-button" @click="handleBackToProject">
          Back to Project
        </NButton>
        <NButton type="primary" data-test="new-run-btn" @click="handleNewRun">
          + New Run
        </NButton>
      </div>
    </div>

    <NSpin :show="loading">
      <div v-if="loading" class="loading-container">
        <p>Loading runs...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <NEmpty :description="error">
          <template #extra>
            <NButton @click="loadData">Retry</NButton>
          </template>
        </NEmpty>
      </div>

      <div v-else>
        <div v-if="runs.length === 0" class="empty-state">
          <NEmpty description="No runs yet">
            <template #extra>
              <NText depth="3" style="display: block; margin-bottom: 16px">
                Create a new comparison run to see differences.
              </NText>
              <NButton type="primary" @click="handleNewRun">Create First Run</NButton>
            </template>
          </NEmpty>
        </div>

        <div v-else>
          <NGrid :cols="3" :x-gap="16" :y-gap="16" class="runs-grid">
            <NGridItem v-for="run in runs" :key="run.id">
              <RunCard :run="run" @click="handleRunClick(run.id)" />
            </NGridItem>
          </NGrid>

          <div v-if="totalRuns > pageSize" class="pagination">
            <NPagination
              :page="page"
              :page-size="pageSize"
              :item-count="totalRuns"
              @update:page="handlePageChange"
            />
          </div>
        </div>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.run-list-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.header h1 {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.loading-container {
  padding: 48px;
  text-align: center;
}

.error-container {
  padding: 48px;
  text-align: center;
}

.empty-state {
  padding: 48px;
  text-align: center;
}

.runs-grid {
  margin-bottom: 24px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
