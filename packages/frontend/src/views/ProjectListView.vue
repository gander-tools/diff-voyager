<script setup lang="ts">
import { NButton, NCard, NEmpty, NGrid, NGridItem, NPagination, NSpin } from 'naive-ui';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectsStore } from '../stores/projects';

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
</script>

<template>
  <div class="project-list">
    <div class="header">
      <div>
        <h1>Projects</h1>
        <p class="subtitle">Manage your website comparison projects</p>
      </div>
      <NButton type="primary" data-test="new-project-btn" @click="handleNewProject">
        + New Project
      </NButton>
    </div>

    <NSpin :show="projectsStore.loading">
      <div v-if="projectsStore.loading" class="loading-container">
        <p>Loading projects...</p>
      </div>

      <div v-else>
        <div v-if="projectsStore.projectList.length === 0" class="empty-state">
          <NEmpty description="No projects yet. Create your first project to get started." />
        </div>

        <div v-else>
          <NGrid :cols="3" :x-gap="16" :y-gap="16" class="projects-grid">
            <NGridItem v-for="project in projectsStore.projectList" :key="project.id">
              <NCard
                hoverable
                class="project-card"
                @click="handleProjectClick(project.id)"
              >
                <div class="project-card-content">
                  <h3>{{ project.name }}</h3>
                  <p class="project-url">{{ project.baseUrl }}</p>
                  <div class="project-meta">
                    <span class="status">{{ project.status }}</span>
                    <span class="date">{{ new Date(project.createdAt).toLocaleDateString() }}</span>
                  </div>
                </div>
              </NCard>
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

.project-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.project-card:hover {
  transform: translateY(-2px);
}

.project-card-content h3 {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 8px 0;
}

.project-url {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
  word-break: break-all;
}

.project-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #e0e0e0;
  font-weight: 500;
}

.date {
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
