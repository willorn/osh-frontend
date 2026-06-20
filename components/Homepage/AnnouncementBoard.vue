<template>
  <section class="notice-section homepage-notice-section">
    <div class="notice-bar notice-bar-system">
      <div class="notice-label notice-label-system">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 1l1.8 3.6L14 5.6l-3 2.9.7 4.1L8 10.5l-3.7 2.1.7-4.1-3-2.9 4.2-.6z" stroke="white" stroke-width="1.3" stroke-linejoin="round" fill="rgba(255,255,255,0.2)" />
        </svg>
        <span>{{ noticeLabel }}</span>
      </div>

      <div v-if="systemAnnouncements.length > 0" class="notice-scroll-wrap">
        <div
          class="notice-scroll-track"
          :class="{ 'is-static': systemAnnouncements.length < 2 }"
          :style="buildTrackStyle(systemPaused, resolvedNoticeScrollDurationSeconds)"
          @mouseenter="systemPaused = true"
          @mouseleave="systemPaused = false"
        >
          <span
            v-for="(item, index) in duplicatedSystemAnnouncements"
            :key="`system-${item.id}-${index}`"
            class="notice-item"
          >
            <span class="notice-dot" :style="resolveDotStyle(item)"></span>
            <span class="notice-icon" :style="resolveIconStyle(item)" aria-hidden="true">{{ resolveAnnouncementIcon(item) }}</span>
            <a
              v-if="item.link"
              class="notice-link"
              :href="item.link"
              target="_blank"
              rel="noopener noreferrer"
              :style="resolveTitleStyle(item)"
            >
              <span class="notice-title">{{ item.title }}</span>
            </a>
            <span v-else class="notice-text" :style="resolveTitleStyle(item)">
              <span class="notice-title">{{ item.title }}</span>
            </span>
            <span class="notice-sep">|</span>
          </span>
        </div>
      </div>

      <div v-else class="notice-empty">
        {{ loading ? loadingText : systemEmptyText }}
      </div>
    </div>

    <div class="notice-bar notice-bar-dynamic">
      <div class="notice-label notice-label-dynamic">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2 4h12M2 8h12M2 12h8" stroke="white" stroke-width="1.3" stroke-linecap="round" />
        </svg>
        <span>{{ dynamicLabel }}</span>
      </div>

      <div v-if="businessAnnouncements.length > 0" class="notice-scroll-wrap">
        <div
          class="notice-scroll-track"
          :class="{ 'is-static': businessAnnouncements.length < 2 }"
          :style="buildTrackStyle(businessPaused, resolvedDynamicScrollDurationSeconds)"
          @mouseenter="businessPaused = true"
          @mouseleave="businessPaused = false"
        >
          <span
            v-for="(item, index) in duplicatedBusinessAnnouncements"
            :key="`business-${item.id}-${index}`"
            class="notice-item"
          >
            <span class="notice-dot" :style="resolveDotStyle(item)"></span>
            <span class="notice-icon" :style="resolveIconStyle(item)" aria-hidden="true">{{ resolveAnnouncementIcon(item) }}</span>
            <a
              v-if="item.link"
              class="notice-link"
              :href="item.link"
              target="_blank"
              rel="noopener noreferrer"
              :style="resolveTitleStyle(item)"
            >
              <span class="notice-title">{{ item.title }}</span>
            </a>
            <span v-else class="notice-text" :style="resolveTitleStyle(item)">
              <span class="notice-title">{{ item.title }}</span>
            </span>
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

const defaultAnnouncementColors = ['#111827']

const announcementIconMap = {
  like: '👍',
  liked: '👍',
  thumb_up: '👍',
  thumbs_up: '👍',
  favorite: '❤️',
  collect: '⭐',
  subscribe: '🔔',
  publish: '📢',
  release: '🚀',
  launch: '🚀',
  new_release: '🚀',
  online: '🆕',
  new_tool: '🆕',
  refresh: '🔄',
  audit: '🛡️',
  approve: '✅',
  approved: '✅',
  review_pass: '✅',
  review_reject: '⛔',
  reject: '⛔',
  payment: '💳',
  paid: '💳',
  purchase: '🛒',
  order: '🛒',
  course: '📚',
  course_online: '📚',
  course_publish: '📚',
  bugfix: '🛠️',
  fix: '🛠️',
  update: '✨',
  default: '👍',
}

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
  apiBaseURL: {
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
  refreshWsType: {
    type: String,
    default: 'ANNOUNCEMENT_REFRESH',
  },
  refreshTrigger: {
    type: [Number, String],
    default: 0,
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
    default: '公告',
  },
  loadingText: {
    type: String,
    default: '加载中...',
  },
  scrollDurationSeconds: {
    type: Number,
    default: 600,
  },
  noticeScrollDurationSeconds: {
    type: Number,
    default: 0,
  },
  dynamicScrollDurationSeconds: {
    type: Number,
    default: 0,
  },
  noticeAccentColors: {
    type: Array,
    default: () => ['#111827'],
  },
  dynamicAccentColors: {
    type: Array,
    default: () => ['#111827'],
  },
  linkBaseURL: {
    type: String,
    default: '',
  },
  linkPathRewriters: {
    type: Array,
    default: () => [],
  },
})

const systemAnnouncements = ref([])
const businessAnnouncements = ref([])
const loading = ref(false)
const systemPaused = ref(false)
const businessPaused = ref(false)

const resolvedBaseURL = computed(() => props.apiBaseURL || fetchConfig.baseURL)
const resolvedScrollDurationSeconds = computed(() => {
  const seconds = Number(props.scrollDurationSeconds)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 600
})

const resolvedNoticeScrollDurationSeconds = computed(() => {
  const seconds = Number(props.noticeScrollDurationSeconds)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : resolvedScrollDurationSeconds.value
})

const resolvedDynamicScrollDurationSeconds = computed(() => {
  const seconds = Number(props.dynamicScrollDurationSeconds)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : resolvedScrollDurationSeconds.value
})

const resolvedLinkBaseURL = computed(() => {
  const explicitBase = String(props.linkBaseURL || '').trim()
  if (explicitBase) {
    return explicitBase.replace(/\/$/, '')
  }

  if (process.client && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '')
  }

  return ''
})

const resolvedNoticeAccentColors = computed(() =>
  Array.isArray(props.noticeAccentColors) && props.noticeAccentColors.length > 0
    ? props.noticeAccentColors
    : defaultAnnouncementColors
)

const resolvedDynamicAccentColors = computed(() =>
  Array.isArray(props.dynamicAccentColors) && props.dynamicAccentColors.length > 0
    ? props.dynamicAccentColors
    : defaultAnnouncementColors
)

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

const systemEmptyText = computed(() => `当前暂无${props.moduleName}系统通知`)
const businessEmptyText = computed(() => `当前暂无${props.moduleName}业务公告`)

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

function resolveAccentColor(channel, index) {
  const palette = channel === 1 ? resolvedNoticeAccentColors.value : resolvedDynamicAccentColors.value
  return palette[index % palette.length]
}

function resolveAnnouncementLink(link) {
  const rawLink = String(link || '').trim()
  if (!rawLink) return ''

  if (/^(https?:)?\/\//i.test(rawLink) || /^(mailto:|tel:)/i.test(rawLink)) {
    return rawLink
  }

  const normalizedPath = normalizeAnnouncementPath(rawLink.startsWith('/') ? rawLink : `/${rawLink}`)
  return resolvedLinkBaseURL.value ? `${resolvedLinkBaseURL.value}${normalizedPath}` : normalizedPath
}

function normalizeAnnouncementPath(path) {
  if (!path) return ''
  if (!Array.isArray(props.linkPathRewriters) || props.linkPathRewriters.length === 0) {
    return path
  }

  return props.linkPathRewriters.reduce((currentPath, rule) => {
    if (!rule || !rule.pattern || !rule.replace) {
      return currentPath
    }
    try {
      const flags = typeof rule.flags === 'string' ? rule.flags : 'i'
      return currentPath.replace(new RegExp(rule.pattern, flags), rule.replace)
    } catch (error) {
      console.warn('[HomepageAnnouncementBoard] linkPathRewriters 配置无效:', rule, error)
      return currentPath
    }
  }, path)
}

function normalizeAnnouncements(list, channel) {
  return flattenAnnouncementGroups(list)
    .filter(Boolean)
    .map((item, index) => ({
      id: item.id || item.noticeId || item.dynamicId || `${channel}-${index}-${item.title || 'announcement'}`,
      title: item.title || item.name || item.content || '',
      link: resolveAnnouncementLink(item.link || item.jumpUrl || item.url || ''),
      icon: '',
      iconCode: item.iconCode || item.icon_code || item.icon || '',
      accentColor: resolveAccentColor(channel, index),
      channel: item.channel || channel,
      resourceType: item.resourceType || item.resource_type || '',
      raw: item,
    }))
    .filter((item) => item.title)
    .sort((a, b) => resolveTimeValue(b.raw) - resolveTimeValue(a.raw))
}

function resolveAuthToken() {
  const cookieToken = useCookie('token').value
  if (cookieToken) return cookieToken
  if (!process.client) return ''
  return localStorage.getItem('token') || localStorage.getItem('Token') || ''
}

async function requestAnnouncementList(path, query) {
  if (!path) return []

  const token = resolveAuthToken()
  const res = await $fetch(path, {
    method: props.requestMethod,
    baseURL: resolvedBaseURL.value,
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

function normalizeIconCode(iconCode) {
  return String(iconCode || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

function resolveAnnouncementIcon(item) {
  const normalizedCode = normalizeIconCode(item?.iconCode || item?.icon)
  if (normalizedCode && announcementIconMap[normalizedCode]) {
    return announcementIconMap[normalizedCode]
  }
  return announcementIconMap.default
}

function resolveDotStyle(item) {
  return {
    background: item?.accentColor || defaultAnnouncementColors[0],
  }
}

function resolveTitleStyle(item) {
  const color = item?.accentColor || defaultAnnouncementColors[0]
  return {
    color,
    '--notice-link-hover-color': resolveHoverColor(color),
  }
}

function resolveIconStyle(item) {
  return {
    color: item?.accentColor || defaultAnnouncementColors[0],
  }
}

function resolveHoverColor(color) {
  const normalizedColor = normalizeHexColor(color)
  if (!normalizedColor) {
    return '#1d4ed8'
  }

  const { r, g, b } = normalizedColor
  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  if (brightness < 96) {
    return mixHexColor(normalizedColor, { r: 37, g: 99, b: 235 }, 0.45)
  }

  return mixHexColor(normalizedColor, { r: 17, g: 24, b: 39 }, 0.28)
}

function normalizeHexColor(color) {
  const value = String(color || '').trim()
  if (!/^#([\da-f]{3}|[\da-f]{6})$/i.test(value)) {
    return null
  }

  const hex = value.length === 4
    ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
    : value

  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  }
}

function mixHexColor(baseColor, mixColor, ratio) {
  const weight = Math.min(Math.max(Number(ratio) || 0, 0), 1)
  const channels = ['r', 'g', 'b']
  const hex = channels.map((channel) => {
    const base = baseColor?.[channel] ?? 0
    const mix = mixColor?.[channel] ?? 0
    const value = Math.round(base + (mix - base) * weight)
    return value.toString(16).padStart(2, '0')
  }).join('')

  return `#${hex}`
}

function buildTrackStyle(paused, durationSeconds) {
  const seconds = Number(durationSeconds)
  return {
    animationDuration: `${Number.isFinite(seconds) && seconds > 0 ? seconds : 600}s`,
    animationPlayState: paused ? 'paused' : 'running',
  }
}

onMounted(() => {
  fetchAnnouncements()
})

watch(
  () => [props.noticeApiPath, props.dynamicApiPath, props.apiBaseURL, props.requestMethod, props.noticeQuery, props.dynamicQuery, props.noticeAccentColors, props.dynamicAccentColors],
  fetchAnnouncements,
  { deep: true }
)

watch(() => props.refreshTrigger, (value) => {
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
  overflow: hidden;
  border-radius: 8px;
}

.notice-bar-system {
  background: linear-gradient(90deg, #fef9c3 0%, #fef3c7 40%, #fce7f3 100%);
  border: 1.5px solid #fbbf24;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.15);
}

.notice-bar-dynamic {
  margin-top: 8px;
  background: linear-gradient(90deg, #ecfdf5 0%, #e0f2fe 40%, #ede9fe 100%);
  border: 1.5px solid #6ee7b7;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
}

.notice-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px 4px 10px;
  border-radius: 0 8px 8px 0;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  flex-shrink: 0;
  margin-right: 16px;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.notice-label-system {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  box-shadow: 2px 0 12px rgba(249, 115, 22, 0.35);
  animation: label-pulse 3s ease-in-out infinite;
}

.notice-label-dynamic {
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
  animation: notice-scroll linear infinite;
}

.notice-scroll-track.is-static {
  animation: none;
}

.notice-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-right: 8px;
  font-size: 14px;
  font-weight: 600;
}

.notice-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
}

.notice-icon {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}

.notice-link,
.notice-text {
  display: inline-flex;
  align-items: center;
}

.notice-link {
  text-decoration: none;
  transition: color 0.18s ease, text-decoration-color 0.18s ease, opacity 0.18s ease;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  text-decoration-color: transparent;
}

.notice-link:hover {
  opacity: 1;
  color: var(--notice-link-hover-color, #1d4ed8) !important;
  text-decoration-color: currentColor;
}

.notice-link:hover .notice-title {
  color: inherit;
}

.notice-title {
  font-weight: 600;
  letter-spacing: 0.01em;
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
