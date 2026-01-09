<script setup lang="ts">
import { NButton, NCard, NEmpty, NGrid, NGridItem, NSpin, NStatistic } from 'naive-ui';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
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

          <div v-else class="projects-list">
            <div
              v-for="project in projectsStore.recentProjects(5)"
              :key="project.id"
              class="project-item"
            >
              <div class="project-info">
                <h3>{{ project.name }}</h3>
                <p class="project-url">{{ project.baseUrl }}</p>
              </div>
              <div class="project-status">
                <span>{{ project.status }}</span>
              </div>
            </div>
          </div>
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

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.project-item:hover {
  background-color: #f5f5f5;
}

.project-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
}

.project-url {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.project-status {
  font-size: 14px;
  font-weight: 500;
}

.loading-container {
  padding: 48px;
  text-align: center;
}
</style>
