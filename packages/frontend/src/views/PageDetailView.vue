<script setup lang="ts">
import { ArrowLeft, ChevronLeft, ChevronRight } from '@vicons/tabler';
import {
  NButton,
  NCard,
  NIcon,
  NSpace,
  NSpin,
  NTabPane,
  NTabs,
  NTag,
  NText,
  useMessage,
} from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ErrorAlert from '../components/common/ErrorAlert.vue';
import LoadingSpinner from '../components/common/LoadingSpinner.vue';
import HeadersTab from '../components/page-detail/HeadersTab.vue';
import PerformanceTab from '../components/page-detail/PerformanceTab.vue';
import SeoComparisonTab from '../components/page-detail/SeoComparisonTab.vue';
import VisualDiffTab from '../components/page-detail/VisualDiffTab.vue';
import type { PageDetailsResponse, PageDiffResponse } from '../services/api/pages';
import { getPage, getPageDiff } from '../services/api/pages';

const route = useRoute();
const router = useRouter();
const message = useMessage();

const pageId = computed(() => route.params.pageId as string);
const loading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref('seo');

const pageDetails = ref<PageDetailsResponse | null>(null);
const pageDiff = ref<PageDiffResponse | null>(null);

const loadPageData = async () => {
  loading.value = true;
  error.value = null;

  try {
    const [details, diff] = await Promise.all([
      getPage(pageId.value),
      getPageDiff(pageId.value).catch(() => null), // Diff might not exist for all pages
    ]);

    pageDetails.value = details;
    pageDiff.value = diff;
  } catch (err) {
    error.value = (err as Error).message;
    console.error('Failed to load page data:', err);
  } finally {
    loading.value = false;
  }
};

const handleBack = () => {
  router.back();
};

const handlePreviousPage = () => {
  // TODO: Navigate to previous page in the run
  message.info('Previous page navigation - to be implemented');
};

const handleNextPage = () => {
  // TODO: Navigate to next page in the run
  message.info('Next page navigation - to be implemented');
};

const handleAcceptDiff = () => {
  // TODO: Accept differences for this page
  message.success('Diff accepted - to be implemented');
};

const handleMuteDiff = () => {
  // TODO: Mute differences for this page
  message.success('Diff muted - to be implemented');
};

const handleCreateRule = () => {
  // TODO: Create a rule from this diff
  router.push({ name: 'rule-create' });
};

onMounted(() => {
  loadPageData();
});
</script>

<template>
  <div class="page-detail-view">
    <!-- Header -->
    <NSpace vertical :size="16">
      <NSpace justify="space-between" align="center">
        <NButton quaternary @click="handleBack">
          <template #icon>
            <NIcon>
              <ArrowLeft />
            </NIcon>
          </template>
          Back
        </NButton>

        <NSpace>
          <NButton @click="handlePreviousPage">
            <template #icon>
              <NIcon>
                <ChevronLeft />
              </NIcon>
            </template>
            Previous
          </NButton>
          <NButton @click="handleNextPage">
            <template #icon>
              <NIcon>
                <ChevronRight />
              </NIcon>
            </template>
            Next
          </NButton>
        </NSpace>
      </NSpace>

      <!-- Loading State -->
      <LoadingSpinner v-if="loading" message="Loading page details..." />

      <!-- Error State -->
      <ErrorAlert v-else-if="error" :error="error" />

      <!-- Content -->
      <template v-else-if="pageDetails">
        <!-- Page Info Card -->
        <NCard title="Page Details">
          <NSpace vertical :size="8">
            <div>
              <NText strong>URL: </NText>
              <NText>{{ pageDetails.url }}</NText>
            </div>
            <div v-if="pageDetails.httpStatus">
              <NText strong>HTTP Status: </NText>
              <NTag
                :type="pageDetails.httpStatus === 200 ? 'success' : 'error'"
                size="small"
              >
                {{ pageDetails.httpStatus }}
              </NTag>
            </div>
            <div v-if="pageDetails.capturedAt">
              <NText strong>Captured: </NText>
              <NText>{{ new Date(pageDetails.capturedAt).toLocaleString() }}</NText>
            </div>
            <div v-if="pageDiff">
              <NText strong>Changes: </NText>
              <NSpace :size="8">
                <NTag
                  v-if="pageDiff.summary.criticalChanges > 0"
                  type="error"
                  size="small"
                >
                  {{ pageDiff.summary.criticalChanges }} critical
                </NTag>
                <NTag
                  v-if="pageDiff.summary.warningChanges > 0"
                  type="warning"
                  size="small"
                >
                  {{ pageDiff.summary.warningChanges }} warnings
                </NTag>
                <NTag
                  v-if="pageDiff.summary.infoChanges > 0"
                  type="info"
                  size="small"
                >
                  {{ pageDiff.summary.infoChanges }} info
                </NTag>
                <NTag
                  v-if="pageDiff.summary.totalChanges === 0"
                  type="success"
                  size="small"
                >
                  No changes
                </NTag>
              </NSpace>
            </div>
          </NSpace>

          <!-- Diff Actions -->
          <template #action v-if="pageDiff && pageDiff.summary.totalChanges > 0">
            <NSpace>
              <NButton type="success" @click="handleAcceptDiff">
                Accept Changes
              </NButton>
              <NButton @click="handleMuteDiff">Mute</NButton>
              <NButton @click="handleCreateRule">Create Rule</NButton>
            </NSpace>
          </template>
        </NCard>

        <!-- Tabs -->
        <NCard>
          <NTabs v-model:value="activeTab" type="line" animated>
            <NTabPane name="seo" tab="SEO & Content">
              <SeoComparisonTab
                :seo-data="pageDetails.seoData"
                :seo-changes="pageDiff?.seoChanges || []"
              />
            </NTabPane>

            <NTabPane name="visual" tab="Visual Diff">
              <VisualDiffTab
                :page-id="pageId"
                :artifacts="pageDetails.artifacts"
                :visual-diff="pageDiff?.visualDiff"
              />
            </NTabPane>

            <NTabPane name="performance" tab="Performance">
              <PerformanceTab
                :page-id="pageId"
                :performance-data="pageDetails.performanceData"
                :performance-changes="pageDiff?.performanceChanges || []"
                :artifacts="pageDetails.artifacts"
              />
            </NTabPane>

            <NTabPane name="headers" tab="Headers">
              <HeadersTab
                :http-headers="pageDetails.httpHeaders"
                :header-changes="pageDiff?.headerChanges || []"
              />
            </NTabPane>
          </NTabs>
        </NCard>
      </template>
    </NSpace>
  </div>
</template>

<style scoped>
.page-detail-view {
  padding: 24px;
}
</style>
