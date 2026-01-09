<script setup lang="ts">
import { NButton, NCard, NEmpty, NGrid, NGridItem, NSpin, NStatistic } from 'naive-ui';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ProjectCard from '../components/ProjectCard.vue';
import { useProjectsStore } from '../stores/projects';

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
      <h1>Diff Voyager</h1>
      <p class="subtitle">Website version comparison tool</p>
    </div>

    <NSpin :show="projectsStore.loading">
      <div v-if="projectsStore.loading" class="loading-container">
        <p>Loading...</p>
      </div>

      <div v-else>
        <NGrid :cols="2" :x-gap="16" :y-gap="16" class="quick-actions-grid">
          <NGridItem>
            <NCard title="Quick Actions">
              <div class="actions">
                <NButton type="primary" data-test="new-project-btn" @click="handleNewProject">
                  New Project
                </NButton>
                <NButton data-test="view-all-btn" @click="handleViewAll"> View All Projects </NButton>
              </div>
            </NCard>
          </NGridItem>

          <NGridItem>
            <NCard title="Statistics">
              <NStatistic label="Total Projects" :value="projectsStore.pagination.total" />
            </NCard>
          </NGridItem>
        </NGrid>

        <NCard title="Recent Projects" class="recent-projects">
          <div v-if="projectsStore.projectList.length === 0">
            <NEmpty description="No projects yet. Create your first project to get started." />
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
