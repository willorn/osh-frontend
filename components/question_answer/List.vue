<template>
  <div class="qna-list-wrap">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-left">
        <select v-model="filter.resourceType" class="sel-input">
          <option value="">全部类型</option>
          <option value="course">课程</option>
          <option value="website">网站</option>
          <option value="电子书">电子书</option>
          <option value="tool">工具</option>
        </select>
        <input 
          v-model.number="filter.resourceNo" 
          type="number"
          class="text-input short" 
          placeholder="资源编号" 
          @keyup.enter="doSearch" 
        />
        <input 
          v-model="filter.keyword" 
          class="text-input" 
          placeholder="搜索问题关键词..." 
          @keyup.enter="doSearch" 
        />
        <button class="btn-search" @click="doSearch">
          <span class="search-icon">🔍</span>
          搜索
        </button>
      </div>
      <button class="btn-ask" @click="$emit('open-create')">
        <span class="ask-icon">✏️</span>
        我要提问
      </button>
    </div>

    <!-- 分类 Tab -->
    <div class="tab-bar">
      <span
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: filter.type === tab.value }"
        @click="switchTab(tab.value)"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tab.label }}
      </span>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="center-tip">
      <n-spin size="large" />
      <div class="loading-text">加载中...</div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="list.length === 0" class="center-tip">
      <n-empty description="暂无问题" size="large">
        <template #extra>
          <button class="btn-empty-action" @click="$emit('open-create')">
            ✏️ 发布第一个问题
          </button>
        </template>
      </n-empty>
    </div>

    <!-- 问题列表 -->
    <div v-else class="question-list">
      <div
        v-for="q in list"
        :key="q.id"
        class="question-card"
        :class="{ 
          'is-paid': q.isPaidOnly === 1, 
          'is-answered': q.status === 2,
          'is-draft': q.status === 0
        }"
        @click="$emit('to-detail', q.id)"
      >
        <div class="card-left">
          <div class="card-title-row">
            <span v-if="q.isPaidOnly === 1" class="badge paid">🔒 付费</span>
            <h3 class="q-title">{{ q.title || q.content }}</h3>
          </div>
          <div class="card-meta">
            <UserCard :user-id="q.userId" :username="q.userName" class="meta-user" @click.stop>
              <span class="user-icon">👤</span>
              {{ q.userName || `用户${q.userId}` }}
            </UserCard>
            <span v-if="q.resourceNo" class="meta-resource">
              <span class="resource-icon">📚</span>
              [{{ displayResourceType(q.resourceType) || '课程' }}] #{{ q.resourceNo }}
            </span>
            <span v-else-if="q.resourceType" class="meta-resource">
              <span class="resource-icon">📚</span>
              {{ displayResourceType(q.resourceType) }}
            </span>
            <span class="meta-time">
              <span class="time-icon">🕐</span>
              {{ formatTime(q.createTime) }}
            </span>
          </div>
          <div v-if="q.tags && q.tags.length > 0" class="card-tags">
            <span v-for="tag in q.tags.slice(0, 5)" :key="tag" class="meta-tag">{{ tag }}</span>
          </div>
        </div>
        <div class="card-right">
          <div class="stat-item" :class="{ highlight: (q.replyCount || q.answerCount || 0) > 0 }">
            <span class="stat-num">{{ q.replyCount || q.answerCount || 0 }}</span>
            <span class="stat-label">💬 回答</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ q.viewCount || 0 }}</span>
            <span class="stat-label">👁 浏览</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ q.followCount || 0 }}</span>
            <span class="stat-label">⭐ 关注</span>
          </div>
          <span class="status-badge" :class="getStatusClass(q.status)">
            {{ getStatusText(q.status) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0 || list.length > 0" class="pagination">
      <n-pagination
        v-model:page="filter.pageNum"
        :item-count="total || list.length"
        :page-size="filter.pageSize"
        :page-slot="7"
        show-size-picker
        :page-sizes="[10, 20, 30, 50]"
        @update:page="loadList"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { createDiscreteApi } from 'naive-ui';
import { apiGetQuestionList } from '~/composables/Api/QuestionAnswer/qna.js';

defineEmits(['to-detail', 'open-create']);

const { message } = createDiscreteApi(['message']);

const loading = ref(false);
const list = ref([]);
const total = ref(0);

const filter = reactive({
  resourceType: '',
  resourceNo: null,
  keyword: '',
  type: 'all',
  pageNum: 1,
  pageSize: 15,
});

const tabs = [
  { label: '全部', value: 'all', icon: '📋' },
  { label: '我的问题', value: 'my_questions', icon: '📝' },
  { label: '我关注的', value: 'my_follows', icon: '⭐' },
  { label: '未回答', value: 'unanswered', icon: '❓' },
  { label: '已回答', value: 'answered', icon: '✅' },
];

onMounted(loadList);

async function loadList() {
  loading.value = true;
  try {
    const params = {
      type: filter.type,
      pageNum: filter.pageNum,
      pageSize: filter.pageSize,
    };

    // 只有有值时才添加这些参数
    if (filter.resourceType) {
      params.resourceType = filter.resourceType;
    }
    if (filter.resourceNo) {
      params.resourceNo = Number(filter.resourceNo);
    }
    if (filter.keyword && filter.keyword.trim()) {
      params.keyword = filter.keyword.trim();
    }

    const res = await apiGetQuestionList(params);
    console.log('[QnA List] response:', JSON.stringify(res)?.slice(0, 300));
    
    // 处理不同的响应格式
    if (res?.rows !== undefined) {
      // TableDataInfo 格式
      list.value = res.rows || [];
      total.value = res.total || 0;
    } else if (res?.code === 200) {
      // 标准响应格式
      if (res.data?.rows !== undefined) {
        list.value = res.data.rows || [];
        total.value = res.data.total || 0;
      } else if (Array.isArray(res.data)) {
        list.value = res.data;
        total.value = res.data.length;
      } else {
        list.value = [];
        total.value = 0;
      }
    } else {
      message.error(res?.msg || '加载失败');
      list.value = [];
      total.value = 0;
    }
  } catch (e) {
    console.error('加载问题列表失败:', e);
    message.error('加载失败，请检查网络');
    list.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function doSearch() {
  filter.pageNum = 1;
  loadList();
}

function switchTab(val) {
  filter.type = val;
  filter.pageNum = 1;
  loadList();
}

function handlePageSizeChange(pageSize) {
  filter.pageSize = pageSize;
  filter.pageNum = 1;
  loadList();
}

// 格式化时间
function formatTime(timeStr) {
  if (!timeStr) return '';
  
  try {
    const time = new Date(timeStr);
    const now = new Date();
    const diff = now - time;
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    
    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`;
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`;
    } else if (diff < 7 * day) {
      return `${Math.floor(diff / day)}天前`;
    } else {
      return timeStr.split(' ')[0]; // 返回日期部分
    }
  } catch {
    return timeStr;
  }
}

// Resource type code -> display label.
// Backend stores both English codes (course/website/book) and legacy Chinese values
// (课程/网站/电子书). Map the codes back to Chinese labels so the UI is consistent
// regardless of which value the row was saved with.
const RESOURCE_TYPE_LABEL_MAP = {
  course: '课程',
  website: '网站',
  book: '电子书',
};

function displayResourceType(type) {
  if (!type) return '';
  return RESOURCE_TYPE_LABEL_MAP[type] || type;
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    0: '📝 待发布',
    1: '✅ 已发布',
    2: '💬 已回答',
  };
  return statusMap[status] || '❓ 未知';
}

// 获取状态样式类
function getStatusClass(status) {
  const classMap = {
    0: 'status-draft',      // 待发布 - 灰色
    1: 'status-published',  // 已发布 - 蓝色
    2: 'status-answered',   // 已回答 - 绿色
  };
  return classMap[status] || 'status-unknown';
}
</script>

<style scoped>
.qna-list-wrap { width: 100%; }

/* 搜索栏 */
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  padding: 16px 20px;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  margin-bottom: 16px;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.search-left { display: flex; align-items: center; gap: 10px; flex: 1; }
.sel-input {
  border: 1px solid #d9d9d9; border-radius: 6px; padding: 9px 12px;
  font-size: 14px; color: #333; background: #fff; cursor: pointer; outline: none;
  transition: all 0.2s;
}
.sel-input:hover { border-color: #40a9ff; }
.sel-input:focus { border-color: #18a058; box-shadow: 0 0 0 2px rgba(24, 160, 88, 0.1); }
.text-input {
  border: 1px solid #d9d9d9; border-radius: 6px; padding: 9px 12px;
  font-size: 14px; outline: none; flex: 1; transition: all 0.2s;
  background: #fff;
}
.text-input.short { flex: 0 0 130px; }
.text-input:hover { border-color: #40a9ff; }
.text-input:focus { border-color: #18a058; box-shadow: 0 0 0 2px rgba(24, 160, 88, 0.1); }
.btn-search {
  background: linear-gradient(135deg, #18a058 0%, #0e7a3e 100%);
  color: #fff; border: none; border-radius: 6px;
  padding: 9px 20px; font-size: 14px; cursor: pointer; white-space: nowrap;
  transition: all 0.2s; font-weight: 500;
  box-shadow: 0 2px 6px rgba(24, 160, 88, 0.3);
  display: flex; align-items: center; gap: 6px;
}
.btn-search:hover { 
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(24, 160, 88, 0.4);
}
.search-icon { font-size: 16px; }
.btn-ask {
  background: #fff; color: #18a058; border: 2px solid #18a058;
  border-radius: 6px; padding: 8px 20px; font-size: 14px; cursor: pointer; 
  white-space: nowrap; font-weight: 600; transition: all 0.2s;
  display: flex; align-items: center; gap: 6px;
}
.btn-ask:hover { 
  background: #18a058; color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(24, 160, 88, 0.3);
}
.ask-icon { font-size: 16px; }

/* Tab */
.tab-bar {
  display: flex; gap: 0; margin-bottom: 16px;
  background: #fff; border-radius: 10px; border: 1px solid #e8e8e8;
  overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}
.tab-item {
  flex: 1; text-align: center; padding: 12px 0; font-size: 14px;
  color: #666; cursor: pointer; transition: all 0.2s; border-right: 1px solid #e8e8e8;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  font-weight: 500;
}
.tab-item:last-child { border-right: none; }
.tab-item:hover { background: #f5f5f5; color: #333; }
.tab-item.active { 
  background: linear-gradient(135deg, #18a058 0%, #0e7a3e 100%);
  color: #fff; font-weight: 600;
}
.tab-icon { font-size: 16px; }

.center-tip { padding: 60px 0; text-align: center; }
.loading-text { margin-top: 16px; font-size: 14px; color: #999; }
.btn-empty-action {
  background: linear-gradient(135deg, #18a058 0%, #0e7a3e 100%);
  color: #fff; border: none; border-radius: 6px;
  padding: 10px 24px; font-size: 14px; cursor: pointer; font-weight: 500;
  margin-top: 16px; transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(24, 160, 88, 0.3);
}
.btn-empty-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 160, 88, 0.4);
}

/* 问题卡片 */
.question-list { display: flex; flex-direction: column; gap: 4px; }
.question-card {
  display: flex; justify-content: space-between; align-items: center;
  background: #fff; border: 1px solid #e8e8e8; border-radius: 8px;
  padding: 8px 16px; cursor: pointer; transition: all 0.2s;
  gap: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.question-card:hover { 
  border-color: #18a058; 
  box-shadow: 0 2px 8px rgba(24,160,88,0.12); 
  transform: translateX(2px);
}
.question-card.is-paid { border-left: 3px solid #f0a020; }
.question-card.is-answered { border-left: 3px solid #18a058; }
.question-card.is-draft { opacity: 0.85; border-left: 3px solid #d9d9d9; }

.card-left { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; }
.card-title-row { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.badge {
  font-size: 11px; padding: 2px 8px; border-radius: 10px; flex-shrink: 0; font-weight: 600;
  display: inline-flex; align-items: center; gap: 3px;
}
.badge.paid { background: #fff3cd; color: #856404; border: 1px solid #ffc107; }
.q-title {
  font-size: 14px; font-weight: 500; color: #1a1a1a; margin: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  line-height: 1.4; flex: 1;
}
.card-meta { 
  display: flex; align-items: center; gap: 10px; font-size: 12px; color: #999; 
  flex-shrink: 0; white-space: nowrap;
}
.meta-user { color: #555; font-weight: 500; display: flex; align-items: center; gap: 3px; }
.meta-resource { color: #18a058; font-weight: 500; display: flex; align-items: center; gap: 3px; }
.meta-time { display: flex; align-items: center; gap: 3px; }
.user-icon, .resource-icon, .time-icon { font-size: 12px; }
.card-tags { display: none; }
.meta-tag {
  background: #f0f0f0; padding: 2px 8px; border-radius: 10px; color: #666;
  font-size: 11px; border: 1px solid #e0e0e0;
}

.card-right { 
  display: flex; align-items: center; gap: 16px; flex-shrink: 0; 
}
.stat-item { 
  display: flex; align-items: center; gap: 4px; white-space: nowrap;
}
.stat-item.highlight .stat-num { color: #18a058; font-weight: 700; }
.stat-num { 
  font-size: 13px; font-weight: 600; color: #333;
}
.stat-label { font-size: 12px; color: #999; }
.status-badge {
  font-size: 12px; padding: 3px 10px; border-radius: 10px; font-weight: 600;
  white-space: nowrap;
}
.status-badge.status-draft { background: #f5f5f5; color: #999; border: 1px solid #d9d9d9; }
.status-badge.status-published { background: #e6f7ff; color: #1890ff; border: 1px solid #91d5ff; }
.status-badge.status-answered { background: #e8f5e9; color: #18a058; border: 1px solid #18a058; }
.status-badge.status-unknown { background: #fff3cd; color: #856404; border: 1px solid #ffc107; }

/* 分页 */
.pagination { 
  display: flex; justify-content: center; padding: 16px 0; margin-top: 8px;
}
</style>
