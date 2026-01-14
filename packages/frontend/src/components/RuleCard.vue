<script setup lang="ts">
import { NButton, NCard, NSpace, NSwitch, NText, NTime } from 'naive-ui';
import { computed } from 'vue';
import type { MuteRule } from '../stores/rules';
import RuleScopeBadge from './RuleScopeBadge.vue';

interface Props {
  rule: MuteRule;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [];
  edit: [id: string];
  delete: [id: string];
  toggleActive: [id: string, active: boolean];
}>();

const handleCardClick = () => {
  emit('click');
};

const handleEdit = (event: Event) => {
  event.stopPropagation();
  emit('edit', props.rule.id);
};

const handleDelete = (event: Event) => {
  event.stopPropagation();
  emit('delete', props.rule.id);
};

const handleToggleActive = (value: boolean) => {
  emit('toggleActive', props.rule.id, value);
};

const conditionsSummary = computed(() => {
  const count = props.rule.conditions.conditions.length;
  if (count === 0) return 'No conditions defined';
  if (count === 1) return '1 condition';
  return `${count} conditions`;
});

const createdDate = computed(() => {
  return new Date(props.rule.createdAt);
});
</script>

<template>
  <NCard
    class="rule-card"
    hoverable
    data-test="rule-card"
    @click="handleCardClick"
  >
    <template #header>
      <NSpace justify="space-between" align="center">
        <NText strong>{{ rule.name }}</NText>
        <NSpace :size="8">
          <RuleScopeBadge :scope="rule.scope" size="small" />
          <NSwitch
            :value="rule.active"
            data-test="rule-active-toggle"
            @update:value="handleToggleActive"
            @click.stop
          >
            <template #checked>Active</template>
            <template #unchecked>Inactive</template>
          </NSwitch>
        </NSpace>
      </NSpace>
    </template>

    <NSpace vertical :size="8">
      <NText v-if="rule.description" depth="3">{{ rule.description }}</NText>
      <NText depth="3" type="info" style="font-size: 12px">
        {{ conditionsSummary }}
      </NText>
      <NText depth="3" style="font-size: 12px">
        Created: <NTime :time="createdDate" format="yyyy-MM-dd HH:mm" />
      </NText>
    </NSpace>

    <template #footer>
      <NSpace justify="end">
        <NButton
          size="small"
          type="primary"
          secondary
          data-test="edit-button"
          @click="handleEdit"
        >
          Edit
        </NButton>
        <NButton
          size="small"
          type="error"
          secondary
          data-test="delete-button"
          @click="handleDelete"
        >
          Delete
        </NButton>
      </NSpace>
    </template>
  </NCard>
</template>

<style scoped>
.rule-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.rule-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
