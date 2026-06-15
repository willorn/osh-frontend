<template>
  <div class="filter-bar">
    <div class="filter-grid">
      <div class="filter-cell">
        <n-select
          v-model:value="modelValue.tags"
          multiple
          filterable
          size="small"
          placeholder="标签"
          :options="displayTagOptions"
          :loading="tagLoading"
          :filter="filterTagOption"
          class="filter-control"
          clearable
          :max-tag-count="1"
        />
      </div>

      <div class="filter-cell">
        <n-select
          v-model:value="modelValue.sortType"
          :options="sortOptions"
          size="small"
          class="filter-control"
          @update:value="handleSearch"
        />
      </div>

      <div class="filter-cell">
        <n-select
          v-model:value="modelValue.difficulty"
          :options="difficultyFilterOptions"
          placeholder="难度"
          clearable
          size="small"
          class="filter-control"
          @update:value="handleSearch"
        />
      </div>

      <div class="filter-cell">
        <button
          class="filter-btn follow-btn"
          :class="{ active: modelValue.isFollowing }"
          @click="toggleFollowing"
        >
          <span class="heart-icon">{{ modelValue.isFollowing ? '♥' : '♡' }}</span>
          收藏
        </button>
      </div>

      <div class="filter-cell">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input
            v-model="modelValue.keyword"
            class="search-input"
            placeholder="关键字"
            @keyup.enter="handleSearch"
          />
          <span
            v-if="modelValue.keyword"
            class="search-clear"
            @click="modelValue.keyword = ''; handleSearch()"
          >✕</span>
        </div>
      </div>

      <div class="filter-cell">
        <div class="search-wrap">
          <span class="search-icon">#</span>
          <input
            v-model="modelValue.courseNo"
            class="search-input"
            placeholder="编号"
            @keyup.enter="handleSearch"
          />
        </div>
      </div>

      <div class="filter-cell">
        <button class="filter-btn btn-query" @click="handleSearch">查询</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { NSelect } from 'naive-ui';
import { fetchConfig } from '~/composables/useHttp';
import { getAuthHeaders } from '~/composables/Api/Course/course';
import { COURSE_DIFFICULTY_OPTIONS } from '~/composables/courseDifficulty';

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  tagOptions: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'search', 'create']);

const tagLoading = ref(false);
const innerTagOptions = ref([]);

const mapTagOptions = (list) => (list || []).map((item) => ({
  label: item.name || item.tagName || String(item),
  value: item.id ?? item,
}));

const loadTags = async () => {
  tagLoading.value = true;
  try {
    const res = await $fetch('/course/tags', {
      baseURL: fetchConfig.baseURL,
      headers: getAuthHeaders(),
    });
    const list = res?.code === 200 ? (res.data || []) : (Array.isArray(res) ? res : []);
    innerTagOptions.value = mapTagOptions(list);
  } catch (e) {
    console.error('加载标签失败', e);
  } finally {
    tagLoading.value = false;
  }
};

const displayTagOptions = computed(() => {
  const parent = Array.isArray(props.tagOptions) ? props.tagOptions : [];
  if (parent.length > 0) return parent;
  return innerTagOptions.value;
});

const filterTagOption = (pattern, option) => {
  const keyword = String(pattern || '').trim().toLowerCase();
  if (!keyword) return true;
  const label = String(option?.label ?? '').toLowerCase();
  return label.includes(keyword);
};

watch(
  () => props.tagOptions,
  (list) => {
    if (Array.isArray(list) && list.length > 0) {
      innerTagOptions.value = list;
    }
  },
  { deep: true }
);

onMounted(() => {
  if (!props.tagOptions?.length) {
    loadTags();
  }
});

const difficultyFilterOptions = COURSE_DIFFICULTY_OPTIONS.map((item) => ({
  label: `${item.icon} ${item.label}`,
  value: item.value,
}));

const sortOptions = [
  { label: '全部', value: 'all' },
  { label: '免费', value: 'FREE' },
  { label: '小班专属', value: 'SAMLL_CLASS' },
  { label: '付费', value: 'CASH_ONLY' },
  { label: 'VIP', value: 'VIP' },
  { label: '内部', value: 'INTERNAL' },
];

const toggleFollowing = () => {
  props.modelValue.isFollowing = !props.modelValue.isFollowing;
  handleSearch();
};

const handleSearch = () => {
  props.modelValue.isFree = props.modelValue.sortType === 'FREE' ? true : null;
  if (props.modelValue.sortType === 'all') {
    props.modelValue.isFree = null;
    props.modelValue.courseType = null;
  }
  props.modelValue.resourceType = props.modelValue.sortType === 'all' ? null : props.modelValue.sortType;
  props.modelValue.collectionFlag = props.modelValue.isFollowing ? 1 : null;
  emit('update:modelValue', props.modelValue);
  emit('search');
};
</script>

<style scoped>
.filter-bar {
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  width: 100%;
  box-sizing: border-box;
}

/* 7 列等宽，与下方 5 列卡片同容器 100% 宽对齐 */
.filter-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
  align-items: center;
}

.filter-cell {
  min-width: 0;
}

.filter-control {
  width: 100%;
}

.filter-control :deep(.n-base-selection) {
  width: 100%;
  min-height: 32px;
}

.filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  box-sizing: border-box;
}

.follow-btn {
  gap: 4px;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #555;
}
.follow-btn:hover { border-color: #18a058; color: #18a058; }
.follow-btn.active {
  background: #f0fdf4;
  border-color: #18a058;
  color: #18a058;
  font-weight: 500;
}
.heart-icon { font-size: 13px; line-height: 1; }

.search-wrap {
  display: flex;
  align-items: center;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  gap: 6px;
  background: #f5f7fa;
  border: 1px solid #d0d7e3;
  border-radius: 6px;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-wrap:focus-within {
  border-color: #18a058;
  box-shadow: 0 0 0 2px rgba(24, 160, 88, 0.12);
  background: #fff;
}
.search-icon {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
  line-height: 1;
}
.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #333;
}
.search-input::placeholder { color: #aaa; }
.search-clear {
  font-size: 11px;
  color: #bbb;
  cursor: pointer;
  flex-shrink: 0;
}
.search-clear:hover { color: #666; }

.btn-query {
  border: none;
  background: #18a058;
  color: #fff;
  font-weight: 500;
}
.btn-query:hover { background: #0e7a3e; }

@media (max-width: 1100px) {
  .filter-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
