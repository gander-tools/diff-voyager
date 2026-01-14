<script setup lang="ts">
import { NButton, NEmpty, NGrid, NGridItem, NPagination, NSpin, useDialog } from 'naive-ui';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import ProjectCard from '../components/ProjectCard.vue';
import { useProjectsStore } from '../stores/projects';

const { t } = useI18n();
const dialog = useDialog();

const router = useRouter();
const projectsStore = useProjectsStore();
const page = ref(1);
const pageSize = 12;

onMounted(async () => {
  try {
    await projectsStore.fetchProjects({ limit: pageSize, offset: 0 });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
  }
});

const handlePageChange = async (newPage: number) => {
  page.value = newPage;
  const offset = (newPage - 1) * pageSize;
  await projectsStore.fetchProjects({ limit: pageSize, offset });
};

const handleNewProject = () => {
  router.push('/projects/new');
};

const handleProjectClick = (projectId: string) => {
  router.push(`/projects/${projectId}`);
};

const handleDeleteProject = async (projectId: string) => {
  const project = projectsStore.projectList.find((p) => p.id === projectId);
  if (!project) return;

  dialog.warning({
    title: 'Confirm Delete',
    content: `Are you sure you want to delete project "${project.name}"?`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        await projectsStore.deleteProject(projectId);
        // Refresh the list
        const offset = (page.value - 1) * pageSize;
        await projectsStore.fetchProjects({ limit: pageSize, offset });
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    },
  });
};
</script>

<template>
  <div class="project-list">
    <div class="header">
      <div>
        <h1>{{ t('projects.title') }}</h1>
        <p class="subtitle">{{ t('projects.subtitle') }}</p>
      </div>
      <NButton type="primary" data-test="new-project-btn" @click="handleNewProject">
        + {{ t('projects.create') }}
      </NButton>
    </div>

    <NSpin :show="projectsStore.loading">
      <div v-if="projectsStore.loading" class="loading-container">
        <p>{{ t('projects.loadingProjects') }}</p>
      </div>

      <div v-else>
        <div v-if="projectsStore.projectList.length === 0" class="empty-state">
          <NEmpty :description="t('dashboard.noProjects')" />
        </div>

        <div v-else>
          <NGrid :cols="3" :x-gap="16" :y-gap="16" class="projects-grid">
            <NGridItem v-for="project in projectsStore.projectList" :key="project.id">
              <ProjectCard
                :project="project"
                @click="handleProjectClick(project.id)"
                @delete="handleDeleteProject"
              />
            </NGridItem>
          </NGrid>

          <div v-if="projectsStore.pagination.total > pageSize" class="pagination">
            <NPagination
              :page="page"
              :page-size="pageSize"
              :item-count="projectsStore.pagination.total"
              @update:page="handlePageChange"
            />
          </div>
        </div>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.project-list {
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

.loading-container {
  padding: 48px;
  text-align: center;
}

.empty-state {
  padding: 48px;
  text-align: center;
}

.projects-grid {
  margin-bottom: 24px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
