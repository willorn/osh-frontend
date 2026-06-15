<template>
  <section class="notice-section homepage-notice-section">
    <div class="notice-bar">
      <div class="notice-label">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1l1.8 3.6L14 5.6l-3 2.9.7 4.1L8 10.5l-3.7 2.1.7-4.1-3-2.9 4.2-.6z" stroke="white" stroke-width="1.3" stroke-linejoin="round" fill="rgba(255,255,255,0.2)" />
        </svg>
        <span>{{ noticeLabel }}</span>
      </div>
      <div v-if="systemAnnouncements.length > 0" class="notice-scroll-wrap">
        <div
          class="notice-scroll-track"
          :class="{ 'is-static': systemAnnouncements.length < 2 }"
          :style="{ animationPlayState: systemPaused ? 'paused' : 'running' }"
          @mouseenter="systemPaused = true"
          @mouseleave="systemPaused = false"
        >
          <span
            v-for="(item, index) in duplicatedSystemAnnouncements"
            :key="`system-${item.id}-${index}`"
            class="notice-item"
          >
            <span class="notice-dot"></span>
            <a
              v-if="item.link"
              class="notice-link"
              :href="item.link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ item.title }}
            </a>
            <span v-else>{{ item.title }}</span>
            <span class="notice-sep">|</span>
          </span>
        </div>
      </div>
      <div v-else class="notice-empty">
        {{ loading ? loadingText : systemEmptyText }}
      </div>
    </div>

    <div class="notice-bar notice-bar-2">
      <div class="notice-label notice-label-2">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M2 8h12M2 12h8" stroke="white" stroke-width="1.3" stroke-linecap="round" />
        </svg>
        <span>{{ dynamicLabel }}</span>
      </div>
      <div v-if="businessAnnouncements.length > 0" class="notice-scroll-wrap">
        <div
          class="notice-scroll-track"
          :class="{ 'is-static': businessAnnouncements.length < 2 }"
          :style="{ animationPlayState: businessPaused ? 'paused' : 'running' }"
          @mouseenter="businessPaused = true"
          @mouseleave="businessPaused = false"
        >
          <span
            v-for="(item, index) in duplicatedBusinessAnnouncements"
            :key="`business-${item.id}-${index}`"
            class="notice-item"
          >
            <span class="notice-dot"></span>
            <a
              v-if="item.link"
              class="notice-link"
              :href="item.link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ item.title }}
            </a>
            <span v-else>{{ item.title }}</span>
            <span class="notice-sep">|</span>
          </span>
        </div>
      </div>
      <div v-else class="notice-empty">
        {{ loading ? loadingText : businessEmptyText }}
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { fetchConfig } from '~/composables/useHttp'

const props = defineProps({
  moduleName: {
    type: String,
    default: '首页模块',
  },
  noticeApiPath: {
    type: String,
    default: '',
  },
  dynamicApiPath: {
    type: String,
    default: '',
  },
  requestMethod: {
    type: String,
    default: 'GET',
  },
  noticeQuery: {
    type: Object,
    default: () => ({}),
  },
  dynamicQuery: {
    type: Object,
    default: () => ({}),
  },
  enableWsRefresh: {
    type: Boolean,
    default: true,
  },
  timeField: {
    type: String,
    default: 'createTime',
  },
  noticeLabel: {
    type: String,
    default: '通知',
  },
  dynamicLabel: {
    type: String,
    default: '动态',
  },
  loadingText: {
    type: String,
    default: '加载中...',
  },
})

const systemAnnouncements = ref([])
const businessAnnouncements = ref([])
const loading = ref(false)
const systemPaused = ref(false)
const businessPaused = ref(false)

const duplicatedSystemAnnouncements = computed(() =>
  systemAnnouncements.value.length > 1
    ? [...systemAnnouncements.value, ...systemAnnouncements.value]
    : systemAnnouncements.value
)

const duplicatedBusinessAnnouncements = computed(() =>
  businessAnnouncements.value.length > 1
    ? [...businessAnnouncements.value, ...businessAnnouncements.value]
    : businessAnnouncements.value
)

const systemEmptyText = computed(() => `暂无${props.moduleName}的系统通知`)
const businessEmptyText = computed(() => `暂无${props.moduleName}的业务动态`)

const { homepageAnnouncementRefreshFlag } = useWebSocket()

function resolveTimeValue(item) {
  if (!item || typeof item !== 'object') return 0
  const value = item?.[props.timeField] || item?.createTime || item?.create_time || item?.updateTime || item?.update_time
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function flattenAnnouncementGroups(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  return Object.values(payload)
    .filter(Array.isArray)
    .flat()
}

function normalizeAnnouncements(list, channel) {
  return flattenAnnouncementGroups(list)
    .filter(Boolean)
    .map((item, index) => ({
      id: item.id || item.noticeId || item.dynamicId || `${channel}-${index}-${item.title || 'announcement'}`,
      title: item.title || item.name || item.content || '',
      link: item.link || item.jumpUrl || item.url || '',
      channel,
      resourceType: item.resourceType || item.resource_type || '',
      raw: item,
    }))
    .filter((item) => item.title)
    .sort((a, b) => resolveTimeValue(b.raw) - resolveTimeValue(a.raw))
}

async function requestAnnouncementList(path, query) {
  if (!path) return []

  const token = useCookie('token').value || localStorage.getItem('token') || ''
  const res = await $fetch(path, {
    method: props.requestMethod,
    baseURL: fetchConfig.baseURL,
    query,
    headers: {
      appid: fetchConfig.headers.appid,
      ...(token && { Authorization: `Bearer ${token}`, token }),
    },
  })

  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.rows)) return res.rows
  if (Array.isArray(res?.data?.rows)) return res.data.rows
  if (res?.data && typeof res.data === 'object') return res.data
  if (res && typeof res === 'object') return res
  return []
}

async function fetchAnnouncements() {
  try {
    loading.value = true
    const [noticeList, dynamicList] = await Promise.all([
      requestAnnouncementList(props.noticeApiPath, props.noticeQuery),
      requestAnnouncementList(props.dynamicApiPath, props.dynamicQuery),
    ])

    systemAnnouncements.value = normalizeAnnouncements(noticeList, 1)
    businessAnnouncements.value = normalizeAnnouncements(dynamicList, 2)
  } catch (error) {
    console.error('[HomepageAnnouncementBoard] 获取公告失败:', error)
    systemAnnouncements.value = []
    businessAnnouncements.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAnnouncements()
})

watch(
  () => [props.noticeApiPath, props.dynamicApiPath, props.requestMethod, props.noticeQuery, props.dynamicQuery],
  fetchAnnouncements,
  { deep: true }
)

watch(homepageAnnouncementRefreshFlag, (value) => {
  if (process.client && props.enableWsRefresh && value) {
    fetchAnnouncements()
  }
})
</script>

<style scoped>
.homepage-notice-section {
  padding: 12px 0 0;
  background: transparent;
}

.notice-bar {
  width: 100%;
  padding: 0 12px;
  display: flex;
  align-items: center;
  height: 40px;
  gap: 0;
  overflow: hidden;
  background: linear-gradient(90deg, #fef9c3 0%, #fef3c7 40%, #fce7f3 100%);
  border: 1.5px solid #fbbf24;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.15);
}

.notice-bar-2 {
  margin-top: 8px;
  background: linear-gradient(90deg, #ecfdf5 0%, #e0f2fe 40%, #ede9fe 100%);
  border-color: #6ee7b7;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
}

.notice-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px 4px 10px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  border-radius: 0 8px 8px 0;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  flex-shrink: 0;
  margin-right: 16px;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  box-shadow: 2px 0 12px rgba(249, 115, 22, 0.35);
  animation: label-pulse 3s ease-in-out infinite;
}

.notice-label-2 {
  background: linear-gradient(135deg, #10b981, #06b6d4);
  box-shadow: 2px 0 12px rgba(16, 185, 129, 0.35);
}

.notice-scroll-wrap {
  flex: 1;
  overflow: hidden;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
}

.notice-empty {
  flex: 1;
  display: flex;
  align-items: center;
  height: 100%;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
}

.notice-scroll-track {
  display: flex;
  align-items: center;
  white-space: nowrap;
  animation: notice-scroll 60s linear infinite;
}

.notice-scroll-track.is-static {
  animation: none;
}

.notice-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  padding-right: 8px;
}

.notice-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #f59e0b;
  flex-shrink: 0;
}

.notice-bar-2 .notice-dot {
  background: #10b981;
}

.notice-link {
  color: #111827;
  text-decoration: none;
  transition: color 0.2s ease;
}

.notice-link:hover {
  color: #ea580c;
  text-decoration: underline;
}

.notice-bar-2 .notice-link:hover {
  color: #059669;
}

.notice-sep {
  color: rgba(17, 24, 39, 0.35);
  margin-left: 2px;
}

@keyframes notice-scroll {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}

@keyframes label-pulse {
  0%,
  100% {
    box-shadow: 2px 0 12px rgba(249, 115, 22, 0.35);
  }

  50% {
    box-shadow: 2px 0 20px rgba(249, 115, 22, 0.6);
  }
}

@media (max-width: 768px) {
  .homepage-notice-section {
    padding-top: 10px;
  }

  .notice-bar {
    height: 38px;
    padding: 0 10px;
  }

  .notice-label {
    margin-right: 12px;
    padding: 4px 10px 4px 8px;
  }

  .notice-item,
  .notice-empty {
    font-size: 13px;
  }
}
</style>
