<script setup lang="ts">
import { RunStatus } from '@gander-tools/diff-voyager-shared';
import {
  type DataTableColumns,
  NButton,
  NCard,
  NDataTable,
  NEmpty,
  NPagination,
  NProgress,
  NSpace,
  NSpin,
  NText,
  NTime,
  useMessage,
} from 'naive-ui';
import { computed, h, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import RunStatusBadge from '../components/RunStatusBadge.vue';
import { listRunPages, type RunPageResponse, retryRun } from '../services/api/runs';
import { useRunsStore } from '../stores/runs';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const runsStore = useRunsStore();

const runId = computed(() => route.params.runId as string);
const loading = ref(true);
const error = ref<string | null>(null);
const retrying = ref(false);

// Pages list state
const pages = ref<RunPageResponse[]>([]);
const pagesLoading = ref(false);
const currentPage = ref(1);
const pageSize = 20;
const totalPages = ref(0);

const run = computed(() => runsStore.currentRun);

const progress = computed(() => {
  if (!run.value) return 0;
  const { totalPages, completedPages, errorPages } = run.value.statistics;
  if (totalPages === 0) return 0;
  return Math.round(((completedPages + errorPages) / totalPages) * 100);
});

const isInProgress = computed(() => {
  return run.value?.status === RunStatus.IN_PROGRESS || run.value?.status === RunStatus.NEW;
});

const createdDate = computed(() => {
  return run.value ? new Date(run.value.createdAt) : null;
});

const hasErrors = computed(() => {
  return run.value && run.value.statistics.errorPages > 0;
});

// Load run details
const loadRunDetails = async () => {
  loading.value = true;
  error.value = null;

  try {
    await runsStore.fetchRun(runId.value);
  } catch (err) {
    error.value = (err as Error).message;
    console.error('Failed to load run:', err);
  } finally {
    loading.value = false;
  }
};

// Load pages list
const loadPages = async () => {
  pagesLoading.value = true;

  try {
    const offset = (currentPage.value - 1) * pageSize;
    const result = await listRunPages(runId.value, {
      limit: pageSize,
      offset,
    });

    pages.value = result;
    // Note: API doesn't return total count yet, estimate from current results
    if (result.length === pageSize) {
      totalPages.value = Math.max(totalPages.value, offset + result.length + 1);
    } else {
      totalPages.value = offset + result.length;
    }
  } catch (err) {
    console.error('Failed to load pages:', err);
    message.error('Failed to load pages');
  } finally {
    pagesLoading.value = false;
  }
};

// Handle page change
const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await loadPages();
};

// Handle retry failed pages
const handleRetry = async () => {
  if (!run.value) return;

  retrying.value = true;
  try {
    await retryRun(runId.value, 'failed');
    message.success('Retrying failed pages...');
    // Reload run details to see updated status
    await loadRunDetails();
    await loadPages();
  } catch (err) {
    message.error(`Failed to retry: ${(err as Error).message}`);
  } finally {
    retrying.value = false;
  }
};

// Navigate to page detail
const handlePageClick = (pageId: string) => {
  router.push({
    name: 'page-detail',
    params: { pageId },
  });
};

// Navigate back to project
const handleBackToProject = () => {
  if (run.value) {
    router.push({
      name: 'project-detail',
      params: { projectId: run.value.projectId },
    });
  }
};

// Navigate back to runs list
const handleBackToRuns = () => {
  if (run.value) {
    router.push({
      name: 'runs',
      params: { projectId: run.value.projectId },
    });
  }
};

// Data table columns
const columns: DataTableColumns<RunPageResponse> = [
  {
    title: 'URL',
    key: 'url',
    ellipsis: {
      tooltip: true,
    },
    render: (row) => {
      return h(
        'a',
        {
          href: '#',
          class: 'page-url-link',
          onClick: (e: Event) => {
            e.preventDefault();
            handlePageClick(row.id);
          },
        },
        row.url,
      );
    },
  },
  {
    title: 'Status',
    key: 'status',
    width: 120,
    render: (row) => {
      const statusColors: Record<string, string> = {
        completed: '#18a058',
        error: '#d03050',
        pending: '#909399',
        processing: '#f0a020',
      };
      const color = statusColors[row.status] || '#909399';
      return h('span', { style: { color, fontWeight: '500' } }, row.status);
    },
  },
  {
    title: 'HTTP Status',
    key: 'httpStatus',
    width: 100,
    render: (row) => {
      if (!row.httpStatus) return '-';
      const isError = row.httpStatus >= 400;
      return h(
        'span',
        {
          style: {
            color: isError ? '#d03050' : '#606266',
            fontWeight: isError ? '600' : '400',
          },
        },
        String(row.httpStatus),
      );
    },
  },
];

// Initialize and cleanup
onMounted(async () => {
  await loadRunDetails();
  await loadPages();

  // Start polling if run is in progress
  if (isInProgress.value) {
    runsStore.startPolling(runId.value);
  }
});

onBeforeUnmount(() => {
  runsStore.stopPolling();
});
</script>

<template>
  <div class="run-detail-view">
    <NSpin :show="loading">
      <div v-if="loading" class="loading-container">
        <p>Loading run details...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <NEmpty :description="error">
          <template #extra>
            <NButton @click="loadRunDetails">Retry</NButton>
          </template>
        </NEmpty>
      </div>

      <div v-else-if="run" class="content">
        <!-- Header -->
        <div class="header">
          <div>
            <h1>Run #{{ run.id.slice(0, 8) }}</h1>
            <p class="subtitle">
              <RunStatusBadge :status="run.status" />
              <span v-if="createdDate" class="timestamp">
                Created: <NTime :time="createdDate" format="yyyy-MM-dd HH:mm:ss" />
              </span>
            </p>
          </div>
          <div class="header-actions">
            <NButton data-test="back-to-runs-btn" @click="handleBackToRuns">
              Back to Runs
            </NButton>
            <NButton data-test="back-to-project-btn" @click="handleBackToProject">
              Back to Project
            </NButton>
            <NButton
              v-if="hasErrors"
              type="warning"
              data-test="retry-btn"
              :loading="retrying"
              @click="handleRetry"
            >
              Retry Failed Pages
            </NButton>
          </div>
        </div>

        <!-- Statistics Card -->
        <NCard title="Run Statistics" class="stats-card">
          <NSpace vertical :size="16">
            <!-- Progress bar for in-progress runs -->
            <div v-if="isInProgress">
              <NText depth="3" style="font-size: 14px; display: block; margin-bottom: 8px">
                Progress: {{ run.statistics.completedPages + run.statistics.errorPages }} /
                {{ run.statistics.totalPages }} pages ({{ progress }}%)
              </NText>
              <NProgress
                type="line"
                :percentage="progress"
                :status="run.statistics.errorPages > 0 ? 'error' : 'default'"
              />
            </div>

            <!-- Statistics grid -->
            <div class="stats-grid">
              <div class="stat-item">
                <NText depth="3" style="font-size: 12px">Total Pages</NText>
                <NText strong style="font-size: 24px">
                  {{ run.statistics.totalPages }}
                </NText>
              </div>
              <div class="stat-item">
                <NText depth="3" style="font-size: 12px">Completed</NText>
                <NText strong style="font-size: 24px; color: #18a058">
                  {{ run.statistics.completedPages }}
                </NText>
              </div>
              <div class="stat-item">
                <NText depth="3" style="font-size: 12px">Errors</NText>
                <NText strong style="font-size: 24px; color: #d03050">
                  {{ run.statistics.errorPages }}
                </NText>
              </div>
            </div>

            <!-- Configuration -->
            <div class="config-section">
              <NText strong style="display: block; margin-bottom: 8px">Configuration</NText>
              <div class="config-grid">
                <div class="config-item">
                  <NText depth="3" style="font-size: 12px">Viewport</NText>
                  <NText>
                    {{ run.config.viewport.width }} × {{ run.config.viewport.height }}
                  </NText>
                </div>
                <div class="config-item">
                  <NText depth="3" style="font-size: 12px">Screenshots</NText>
                  <NText>{{ run.config.captureScreenshots ? 'Enabled' : 'Disabled' }}</NText>
                </div>
                <div class="config-item">
                  <NText depth="3" style="font-size: 12px">HAR Files</NText>
                  <NText>{{ run.config.captureHar ? 'Enabled' : 'Disabled' }}</NText>
                </div>
              </div>
            </div>
          </NSpace>
        </NCard>

        <!-- Pages List -->
        <NCard title="Pages" class="pages-card">
          <NSpin :show="pagesLoading">
            <div v-if="pages.length === 0 && !pagesLoading" class="empty-pages">
              <NEmpty description="No pages found" />
            </div>

            <div v-else>
              <NDataTable
                :columns="columns"
                :data="pages"
                :bordered="false"
                :single-line="false"
                data-test="pages-table"
              />

              <div v-if="totalPages > pageSize" class="pagination">
                <NPagination
                  :page="currentPage"
                  :page-size="pageSize"
                  :item-count="totalPages"
                  @update:page="handlePageChange"
                />
              </div>
            </div>
          </NSpin>
        </NCard>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.run-detail-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.subtitle {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #666;
  margin: 0;
}

.timestamp {
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.loading-container,
.error-container {
  padding: 48px;
  text-align: center;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-card,
.pages-card {
  width: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-section {
  padding-top: 16px;
  border-top: 1px solid #e0e0e6;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty-pages {
  padding: 48px;
  text-align: center;
}

.page-url-link {
  color: #1890ff;
  text-decoration: none;
  cursor: pointer;
}

.page-url-link:hover {
  text-decoration: underline;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
