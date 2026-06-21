<template>
  <div class="compact-filter">
    <n-space align="center" justify="space-between" class="filter-row" :wrap="true">
      <n-space class="filter-controls" :wrap="true">
        <n-select
          v-model:value="queryParams.sourceId"
          clearable
          filterable
          placeholder="按数据源筛选"
          :options="sourceOptions"
          class="source-select"
          @update:value="handleSearch"
        />
        <n-select
          v-model:value="queryParams.tagIds"
          multiple
          filterable
          placeholder="按标签筛选"
          :options="tagOptions"
          class="tag-select"
          @update:value="handleSearch"
        />
        <n-input
          v-model:value="queryParams.keyword"
          placeholder="搜索项目名称或描述..."
          class="keyword-input"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix><n-icon><SearchOutline /></n-icon></template>
        </n-input>
        <n-button
          :type="queryParams.onlyFavorite ? 'warning' : 'default'"
          @click="toggleFavorite"
        >
          {{ queryParams.onlyFavorite ? '★ 我收藏的' : '☆ 我收藏的' }}
        </n-button>
      </n-space>
    </n-space>

    <n-space align="center" class="sort-row" :wrap="true">
      <span class="sort-label">排序：</span>
      <n-button-group>
        <n-button
          v-for="opt in sortOptions"
          :key="opt.field"
          size="small"
          :type="queryParams.sortField === opt.field ? 'primary' : 'default'"
          @click="toggleSort(opt.field)"
        >
          {{ opt.label }}
          <template v-if="queryParams.sortField === opt.field">
            {{ queryParams.sortOrder === 'desc' ? ' ↓' : ' ↑' }}
          </template>
        </n-button>
      </n-button-group>
    </n-space>
  </div>
</template>

<script setup>
import { NInput, NSelect, NSpace, NButton, NButtonGroup, NIcon } from 'naive-ui'
import { SearchOutline } from '@vicons/ionicons5'
import { reactive } from 'vue'

defineProps({
  tagOptions: { type: Array, default: () => [] },
  sourceOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['search'])

const queryParams = reactive({
  keyword: '',
  tagIds: [],
  sourceId: null,
  sortField: 'star_count',
  sortOrder: 'desc',
  onlyFavorite: false,
})

const sortOptions = [
  { field: 'star_count', label: 'Star' },
  { field: 'fork_count', label: 'Fork' },
  { field: 'last_commit_time', label: '最近提交' },
]

function toggleSort(field) {
  if (queryParams.sortField === field) {
    queryParams.sortOrder = queryParams.sortOrder === 'desc' ? 'asc' : 'desc'
  } else {
    queryParams.sortField = field
    queryParams.sortOrder = 'desc'
  }
  handleSearch()
}

function toggleFavorite() {
  queryParams.onlyFavorite = !queryParams.onlyFavorite
  handleSearch()
}

function handleSearch() {
  emit('search', { ...queryParams })
}
</script>

<style scoped>
.compact-filter {
  background: rgba(255, 255, 255, 0.74);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(20, 184, 166, 0.20);
  margin-bottom: 24px;
  box-shadow: 0 18px 46px rgba(8, 40, 50, 0.11);
  backdrop-filter: blur(16px);
}
.filter-row { margin-bottom: 12px; width: 100%; }
.filter-controls { width: 100%; }
.sort-row { width: 100%; }
.compact-filter :deep(.n-space) { row-gap: 10px; }
.compact-filter :deep(.n-input),
.compact-filter :deep(.n-base-selection) { --n-border: 1px solid rgba(30, 91, 103, 0.18) !important; --n-border-hover: 1px solid rgba(20, 184, 166, 0.56) !important; --n-border-focus: 1px solid rgba(14, 165, 164, 0.86) !important; --n-color: rgba(255, 255, 255, 0.88) !important; }
.source-select { width: 220px; }
.tag-select { width: 260px; }
.keyword-input { width: 240px; }
.sort-label { font-size: 13px; color: #315965; font-weight: 600; }
.compact-filter :deep(.n-button) { border-radius: 6px; }
@media (max-width: 760px) {
  .source-select,
  .tag-select,
  .keyword-input { width: min(100%, 320px); }
  .compact-filter :deep(.n-space > div) { max-width: 100%; }
}
</style>