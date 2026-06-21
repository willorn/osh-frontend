<template>
  <span v-bind="attrs" class="user-card-host" :class="{ 'is-card-enabled': canOpenCard }" @click.stop="openCard">
    <slot>
      <button type="button" class="user-card-trigger">{{ displayName }}</button>
    </slot>
  </span>

  <n-modal v-model:show="visible" preset="card" title="用户名片" class="user-card-modal">
    <div v-if="loading" class="user-card-loading">
      <n-spin size="small" /> 加载中...
    </div>
    <div v-else-if="card" class="user-card">
      <div class="user-card-head">
        <n-avatar round :size="64" :src="card.avatar || defaultAvatar" />
        <div>
          <h3>{{ card.username || displayName || '用户' }}</h3>
          <div class="role-list">
            <n-tag v-for="role in card.roles || []" :key="role.roleId || role.roleName" size="small" type="info">
              {{ role.roleName }}
            </n-tag>
            <n-tag v-if="!card.roles?.length" size="small">普通用户</n-tag>
          </div>
        </div>
      </div>

      <div class="user-card-grid">
        <span>GitHub</span>
        <a v-if="card.githubAccount" :href="card.githubAccount" target="_blank" rel="noopener noreferrer">
          {{ card.githubAccount }}
        </a>
        <strong v-else>-</strong>

        <span>微信名称</span>
        <strong>{{ card.wechatName || '-' }}</strong>

        <span>性别</span>
        <strong>{{ card.sex || '未知' }}</strong>

        <span>个人简介</span>
        <p>{{ card.introduction || '暂无简介' }}</p>
      </div>
    </div>
    <div v-else class="user-card-empty">暂无名片信息</div>
  </n-modal>
</template>

<script setup>
import { NAvatar, NModal, NSpin, NTag } from 'naive-ui'
import { DEFAULT_AVATAR } from '~/composables/user'
import { getUserMemberLevel } from '~/composables/useAuth'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  userId: { type: [String, Number], default: null },
  githubAccount: { type: String, default: '' },
  username: { type: String, default: '' },
})

const visible = ref(false)
const loading = ref(false)
const card = ref(null)
const attrs = useAttrs()
const defaultAvatar = DEFAULT_AVATAR

const displayName = computed(() => props.username || props.githubAccount || '查看名片')
const canOpenCard = computed(() => getUserMemberLevel() >= 4)

async function openCard() {
  if (!canOpenCard.value) return
  visible.value = true
  if (card.value || loading.value) return
  loading.value = true
  try {
    const params = {}
    if (props.userId) params.userId = props.userId
    if (props.githubAccount) params.githubAccount = props.githubAccount
    const res = await $fetch(`${fetchConfig.baseURL}/user/card`, {
      headers: getAuthHeaders(),
      params,
    })
    card.value = res?.data || null
  } catch {
    card.value = null
  } finally {
    loading.value = false
  }
}

function getAuthHeaders() {
  const headers = { appid: fetchConfig.headers.appid }
  if (process.client) {
    let token = ''
    try { token = useCookie('token').value || '' } catch {}
    if (!token) token = localStorage.getItem('token') || ''
    if (token) {
      headers.token = token
      headers.Authorization = `Bearer ${token}`
    }
  }
  return headers
}
</script>

<style scoped>
.user-card-host {
  display: inline-flex;
  vertical-align: middle;
  transform-origin: center;
  transition: filter 0.18s ease, transform 0.18s ease;
}

.user-card-host.is-card-enabled {
  cursor: pointer;
}

.user-card-host.is-card-enabled:hover {
  animation: user-card-wiggle 0.42s ease-in-out;
  filter: drop-shadow(0 4px 10px rgba(37, 99, 235, 0.16));
}

.user-card-host.is-card-enabled:active {
  transform: scale(0.98);
}

@keyframes user-card-wiggle {
  0%, 100% { transform: translateX(0) rotate(0); }
  20% { transform: translateX(-1px) rotate(-1deg); }
  40% { transform: translateX(2px) rotate(1deg); }
  60% { transform: translateX(-2px) rotate(-1deg); }
  80% { transform: translateX(1px) rotate(1deg); }
}

@media (prefers-reduced-motion: reduce) {
  .user-card-host.is-card-enabled:hover {
    animation: none;
    transform: translateY(-1px);
  }
}

.user-card-trigger {
  border: 0;
  padding: 0;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
}

.user-card-loading,
.user-card-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 120px;
  color: #64748b;
}

.user-card-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.user-card-head h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #111827;
}

.role-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.user-card-grid {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 12px 14px;
  margin-top: 16px;
  font-size: 14px;
}

.user-card-grid > span {
  color: #64748b;
}

.user-card-grid a,
.user-card-grid strong,
.user-card-grid p {
  min-width: 0;
  margin: 0;
  color: #1f2937;
  word-break: break-word;
}

.user-card-grid a {
  color: #2563eb;
}

:global(.user-card-modal) {
  width: min(460px, calc(100vw - 32px));
}
</style>
