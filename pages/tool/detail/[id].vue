<template>
  <LoadingGroup :pending="pending" :error="error">
    <main class="tool-detail-page">
      <div class="top-action-row">
        <button class="back-btn" @click="goBack">返回工具列表</button>
        <button
          v-if="isIframeTool && detailToolUrl"
          class="open-new-tab-btn"
          @click="openInNewTab"
        >
          新标签打开
        </button>
      </div>

      <section v-if="tool" class="detail-section tool-runtime-section">
        <div class="tool-runtime-panel">
          <iframe
            v-if="isIframeTool && detailToolUrl"
            class="tool-runtime-frame"
            :src="detailToolUrl"
            :title="tool.toolName"
          />
          <div v-else class="tool-runtime-empty">
            当前工具为站内工具，请返回工具列表后展开使用。
          </div>
        </div>
      </section>
    </main>
  </LoadingGroup>
</template>

<script setup>
import { computed } from 'vue';
import { createDiscreteApi } from 'naive-ui';
import { apiToolDetail } from '~/composables/Api/Tool/tool';

const route = useRoute();
const currentUser = useUser();
const tokenCookie = useCookie('token');
const { message } = createDiscreteApi(['message']);

const {
  data,
  pending,
  error,
} = await useAsyncData(
  `tool-detail-${route.params.id}`,
  () => apiToolDetail(route.params.id),
  { server: false }
);

const tool = computed(() => data.value?.data || data.value || null);
const isIframeTool = computed(() => Number(tool.value?.accessType || tool.value?.access_type || 1) === 2);
const detailToolUrl = computed(() => tool.value?.iframeUrl || tool.value?.iframe_url || tool.value?.routePath || tool.value?.route_path || '');
const isLoggedIn = computed(() => {
  if (currentUser.value) return true;
  if (tokenCookie.value) return true;
  if (!process.client) return false;
  return !!(localStorage.getItem('token') || localStorage.getItem('Token'));
});

function goBack() {
  navigateTo('/tool');
}

function openInNewTab() {
  if (!isLoggedIn.value) {
    message.warning('请先登录后再使用该工具');
    navigateTo('/login?from=/tool');
    return;
  }
  if (!process.client || !detailToolUrl.value) {
    return;
  }
  const opened = window.open(detailToolUrl.value, '_blank', 'noopener,noreferrer');
  if (!opened) {
    message.warning('浏览器拦截了新标签页，请允许弹窗后重试');
  }
}

useHead(() => ({
  title: tool.value?.toolName ? `${tool.value.toolName} - 工具详情` : '工具详情',
}));
</script>

<style scoped>
.tool-detail-page {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 18px 24px 28px;
}

.top-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.back-btn {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #fff;
  color: #334155;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
}

.open-new-tab-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #18a058;
  background: #fff;
  color: #18a058;
  border-radius: 8px;
  padding: 8px 14px;
  min-height: 40px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}

.back-btn:hover {
  border-color: #18a058;
  color: #18a058;
}

.open-new-tab-btn:hover {
  background: #f0faf5;
  color: #15914d;
  border-color: #15914d;
}

.detail-section {
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(150deg, rgba(255,255,255,0.98), rgba(247,250,252,0.94));
  border-radius: 8px;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
  margin-top: 0;
  padding: 0;
}

.tool-runtime-panel {
  border-radius: 8px;
  background: #fff;
  min-height: calc(100vh - 150px);
  overflow: hidden;
}

.tool-runtime-frame {
  width: 100%;
  min-height: calc(100vh - 150px);
  border: 0;
  display: block;
  background: #fff;
}

.tool-runtime-empty {
  min-height: calc(100vh - 150px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: #64748b;
  font-size: 15px;
  line-height: 1.8;
  text-align: center;
}

@media (max-width: 980px) {
  .tool-detail-page {
    padding: 14px 14px 20px;
  }
}

@media (max-width: 560px) {
  .top-action-row {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
