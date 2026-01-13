<script setup lang="ts">
import type { PageResponse, PageStatus } from '@gander-tools/diff-voyager-shared';
import { type DataTableColumns, NBadge, NDataTable, NEmpty, NSpace, NSpin } from 'naive-ui';
import { computed, h } from 'vue';
import PageStatusBadge from './PageStatusBadge.vue';

interface Props {
  pages: PageResponse[];
  loading?: boolean;
  pageSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pageSize: 20,
});

const emit = defineEmits<{
  pageClick: [pageId: string];
}>();

// Handle page row click
const handlePageClick = (pageId: string) => {
  emit('pageClick', pageId);
};

// Get diff type badges for a page
const getDiffBadges = (page: PageResponse) => {
  if (!page.diff || !page.diff.summary) {
    return [];
  }

  const badges: Array<{ type: string; count: number; color: string }> = [];

  // Check for SEO changes
  if (page.diff.seoChanges && page.diff.seoChanges.length > 0) {
    badges.push({
      type: 'SEO',
      count: page.diff.seoChanges.length,
      color: '#f0a020',
    });
  }

  // Check for header changes
  if (page.diff.headerChanges && page.diff.headerChanges.length > 0) {
    badges.push({
      type: 'Headers',
      count: page.diff.headerChanges.length,
      color: '#409eff',
    });
  }

  // Check for performance changes
  if (page.diff.performanceChanges && page.diff.performanceChanges.length > 0) {
    badges.push({
      type: 'Performance',
      count: page.diff.performanceChanges.length,
      color: '#e6a23c',
    });
  }

  // Check for visual diff
  if (page.diff.visualDiff?.thresholdExceeded) {
    badges.push({
      type: 'Visual',
      count: 1,
      color: '#d03050',
    });
  }

  return badges;
};

// Get total changes count
const getTotalChanges = (page: PageResponse): number => {
  if (!page.diff || !page.diff.summary) {
    return 0;
  }
  return page.diff.summary.totalChanges || 0;
};

// Data table columns
const columns = computed<DataTableColumns<PageResponse>>(() => [
  {
    title: 'URL',
    key: 'url',
    ellipsis: {
      tooltip: true,
    },
    sorter: (a, b) => a.url.localeCompare(b.url),
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
    width: 140,
    sorter: (a, b) => a.status.localeCompare(b.status),
    render: (row) => {
      return h(PageStatusBadge, {
        status: row.status as PageStatus,
        size: 'small',
      });
    },
  },
  {
    title: 'HTTP Status',
    key: 'httpStatus',
    width: 120,
    sorter: (a, b) => (a.httpStatus || 0) - (b.httpStatus || 0),
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
  {
    title: 'Changes',
    key: 'changes',
    width: 100,
    sorter: (a, b) => getTotalChanges(a) - getTotalChanges(b),
    render: (row) => {
      const totalChanges = getTotalChanges(row);
      if (totalChanges === 0) {
        return h('span', { style: { color: '#909399' } }, '-');
      }
      return h(
        'span',
        {
          style: {
            color: totalChanges > 0 ? '#d03050' : '#18a058',
            fontWeight: '600',
          },
        },
        String(totalChanges),
      );
    },
  },
  {
    title: 'Diff Types',
    key: 'diffTypes',
    width: 220,
    render: (row) => {
      const badges = getDiffBadges(row);
      if (badges.length === 0) {
        return h('span', { style: { color: '#909399', fontSize: '12px' } }, 'No changes');
      }

      return h(
        NSpace,
        { size: 4 },
        {
          default: () =>
            badges.map((badge) =>
              h(NBadge, {
                value: `${badge.type} (${badge.count})`,
                color: badge.color,
                size: 'small',
              }),
            ),
        },
      );
    },
  },
]);
</script>

<template>
  <div class="page-list">
    <NSpin :show="loading">
      <div v-if="pages.length === 0 && !loading" class="empty-pages">
        <NEmpty description="No pages found" />
      </div>

      <NDataTable
        v-else
        :columns="columns"
        :data="pages"
        :bordered="false"
        :single-line="false"
        data-test="pages-table"
      />
    </NSpin>
  </div>
</template>

<style scoped>
.page-list {
  width: 100%;
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
</style>
