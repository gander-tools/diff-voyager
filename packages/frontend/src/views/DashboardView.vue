<script setup lang="ts">
import { NButton, NCard, NEmpty, NGrid, NGridItem, NSpin, NStatistic } from 'naive-ui';
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import ProjectCard from '../components/ProjectCard.vue';
import { useProjectsStore } from '../stores/projects';

const { t } = useI18n();

const router = useRouter();
const projectsStore = useProjectsStore();

onMounted(async () => {
  try {
    await projectsStore.fetchProjects({ limit: 5 });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
  }
});

const handleNewProject = () => {
  router.push('/projects/new');
};

const handleViewAll = () => {
  router.push('/projects');
};

const handleProjectClick = (projectId: string) => {
  router.push(`/projects/${projectId}`);
};

const handleDeleteProject = async (projectId: string) => {
  try {
    await projectsStore.deleteProject(projectId);
    // Refresh the recent projects list
    await projectsStore.fetchProjects({ limit: 5 });
  } catch (error) {
    console.error('Failed to delete project:', error);
  }
};
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>{{ t('dashboard.welcome') }}</h1>
      <p class="subtitle">{{ t('dashboard.subtitle') }}</p>
    </div>

    <NSpin :show="projectsStore.loading">
      <div v-if="projectsStore.loading" class="loading-container">
        <p>{{ t('common.loading') }}</p>
      </div>

      <div v-else>
        <NGrid :cols="2" :x-gap="16" :y-gap="16" class="quick-actions-grid">
          <NGridItem>
            <NCard :title="t('dashboard.quickActions')">
              <div class="actions">
                <NButton type="primary" data-test="new-project-btn" @click="handleNewProject">
                  {{ t('dashboard.newProject') }}
                </NButton>
                <NButton data-test="view-all-btn" @click="handleViewAll">
                  {{ t('dashboard.viewAllProjects') }}
                </NButton>
              </div>
            </NCard>
          </NGridItem>

          <NGridItem>
            <NCard :title="t('dashboard.statistics')">
              <NStatistic :label="t('dashboard.totalProjects')" :value="projectsStore.pagination.total" />
            </NCard>
          </NGridItem>
        </NGrid>

        <NCard :title="t('dashboard.recentProjects')" class="recent-projects">
          <div v-if="projectsStore.projectList.length === 0">
            <NEmpty :description="t('dashboard.noProjects')" />
          </div>

          <NGrid v-else :cols="1" :x-gap="12" :y-gap="12">
            <NGridItem
              v-for="project in projectsStore.recentProjects(5)"
              :key="project.id"
            >
              <ProjectCard
                :project="project"
                @click="handleProjectClick(project.id)"
                @delete="handleDeleteProject"
              />
            </NGridItem>
          </NGrid>
        </NCard>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.dashboard-header {
  margin-bottom: 32px;
}

.dashboard-header h1 {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.quick-actions-grid {
  margin-bottom: 24px;
}

.actions {
  display: flex;
  gap: 12px;
  flex-direction: column;
}

.recent-projects {
  margin-top: 24px;
}

.loading-container {
  padding: 48px;
  text-align: center;
}
</style>
