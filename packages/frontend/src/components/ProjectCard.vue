<script setup lang="ts">
import { NButton, NCard, NSpace, NText, NTime } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import ProjectStatusBadge from './ProjectStatusBadge.vue';

const { t } = useI18n();

interface Project {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Props {
  project: Project;
}

defineProps<Props>();

const emit = defineEmits<{
  click: [];
  delete: [id: string];
}>();

const handleCardClick = () => {
  emit('click');
};

const handleDelete = (event: Event, projectId: string) => {
  event.stopPropagation();
  emit('delete', projectId);
};
</script>

<template>
  <NCard
    class="project-card"
    hoverable
    data-test="project-card"
    @click="handleCardClick"
  >
    <template #header>
      <NSpace justify="space-between" align="center">
        <NText strong>{{ project.name }}</NText>
        <ProjectStatusBadge :status="project.status" size="small" />
      </NSpace>
    </template>

    <NSpace vertical :size="8">
      <NText v-if="project.description" depth="3">{{ project.description }}</NText>
      <NText depth="3" type="info">{{ project.baseUrl }}</NText>
      <NText depth="3" style="font-size: 12px">
        {{ t('projects.createdLabel') }} <NTime :time="project.createdAt" format="yyyy-MM-dd HH:mm" />
      </NText>
    </NSpace>

    <template #footer>
      <NSpace justify="end">
        <NButton
          size="small"
          type="error"
          secondary
          data-test="delete-button"
          @click="(e) => handleDelete(e, project.id)"
        >
          {{ t('common.delete') }}
        </NButton>
      </NSpace>
    </template>
  </NCard>
</template>

<style scoped>
.project-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
