<template>
  <div class="user-manage-page">
    <nav class="admin-subnav" aria-label="后台管理导航">
      <nuxt-link to="/admin/users" class="admin-subnav-item active">用户管理</nuxt-link>
      <nuxt-link to="/admin/behavior" class="admin-subnav-item">行为数据</nuxt-link>
      <nuxt-link to="/admin/contribution" class="admin-subnav-item">贡献统计</nuxt-link>
    </nav>

    <h2 class="page-title">
      用户管理
      <n-button type="primary" size="small" class="invite-btn" @click="showInviteModal = true">
        邀请用户
      </n-button>
    </h2>

    <!-- 搜索/筛选栏 -->
    <div class="filter-bar">
      <div class="filter-row">
        <n-input v-model:value="query.username" placeholder="用户名" clearable size="small" class="filter-input" />
        <n-input v-model:value="query.email" placeholder="邮箱" clearable size="small" class="filter-input" />
        <n-select v-model:value="query.roleId" :options="roleOptions" placeholder="角色" clearable size="small" class="filter-select" />
        <n-select v-model:value="query.blocked" :options="blockedOptions" placeholder="是否拉黑" clearable size="small" class="filter-select-sm" />
        <n-select v-model:value="query.deleted" :options="deletedOptions" placeholder="是否注销" clearable size="small" class="filter-select-sm" />
        <div class="sort-group">
          <n-select v-model:value="query.orderBy" :options="orderByOptions" placeholder="排序" clearable size="small" class="filter-select" />
          <button class="sort-dir-btn" @click="toggleOrderDir" :title="query.orderDir === 'asc' ? '升序' : '降序'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path v-if="query.orderDir === 'asc'" d="M12 19V5M5 12l7-7 7 7" />
              <path v-else d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>
        </div>
        <n-button size="small" @click="resetQuery">重置</n-button>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="table-wrap">
      <n-spin :show="loading">
        <table class="user-table" v-if="userList.length > 0">
          <thead>
            <tr>
              <th>用户名</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>积分</th>
              <th>违规次数</th>
              <th>状态</th>
              <th>注册时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in userList" :key="user.id" class="clickable-row" @click="goToDetail(user.id)">
              <td>
                <div class="user-cell">
                  <n-avatar :size="28" :src="user.avatar || defaultAvatar" round />
                  <span class="username-link">{{ user.username }}</span>
                </div>
              </td>
              <td>{{ user.email || '-' }}</td>
              <td>
                <n-tag :type="roleTagType(user.roleLevel)" size="small">
                  {{ user.roleName || '未分配' }}
                </n-tag>
              </td>
              <td>{{ user.points ?? 0 }}</td>
              <td>
                <span :class="{ 'text-danger': user.violationCount > 0 }">{{ user.violationCount ?? 0 }}</span>
              </td>
              <td>
                <n-tag :type="user.status === 1 ? 'error' : 'success'" size="small">
                  {{ user.status === 1 ? '已拉黑' : '正常' }}
                </n-tag>
              </td>
              <td>{{ user.createTime || '-' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">暂无用户数据</div>
      </n-spin>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrap" v-if="total > 0">
      <n-pagination
        :page="query.pageNum"
        :page-size="query.pageSize"
        :item-count="total"
        @update:page="handlePageChange"
      />
    </div>

    <!-- 邀请用户弹窗 -->
    <n-modal v-model:show="showInviteModal" preset="card" title="邀请用户注册" style="width: min(1080px, calc(100vw - 32px));">
      <n-form size="small" ref="inviteFormRef" :model="inviteForm" :rules="inviteRules">
        <n-form-item label="邀请用户">
          <div class="invite-row-list">
            <div class="invite-bulk-row">
              <div class="invite-bulk-label">批量设置</div>
              <n-select
                v-model:value="inviteBulk.roleId"
                :options="inviteRoleOptions"
                placeholder="统一选择角色"
                @update:value="applyInviteBulkRole"
              />
              <n-input-number
                v-model:value="inviteBulk.points"
                :min="0"
                :max="99999"
                placeholder="统一积分"
                @update:value="applyInviteBulkPoints"
              />
              <div v-if="inviteBulkNeedExpire" class="invite-expire-cell invite-bulk-expire">
                <n-date-picker
                  v-if="!inviteBulk.permanent"
                  v-model:value="inviteBulk.expireTimestamp"
                  type="datetime"
                  size="small"
                  placeholder="统一到期时间"
                  clearable
                  @update:value="applyInviteBulkExpire"
                />
                <n-checkbox
                  v-model:checked="inviteBulk.permanent"
                  size="small"
                  @update:checked="applyInviteBulkPermanent"
                >
                  永久
                </n-checkbox>
              </div>
              <div v-else class="invite-expire-placeholder">-</div>
              <div></div>
            </div>
            <div v-for="(row, index) in inviteRows" :key="row.id" class="invite-email-row">
              <n-input
                :ref="el => setInviteEmailInputRef(el, index)"
                v-model:value="row.email"
                placeholder="填写用户邮箱（按住回车换行）"
                clearable
                :status="row.email && !isValidEmail(row.email) ? 'error' : undefined"
                @keydown.enter.prevent="handleInviteEmailEnter(index)"
              />
              <n-select
                v-model:value="row.roleId"
                :options="inviteRoleOptions"
                placeholder="选择角色"
                @update:value="onInviteRowRoleChange(row)"
              />
              <n-input-number
                v-model:value="row.points"
                :min="0"
                :max="99999"
                placeholder="初始积分"
              />
              <div v-if="inviteRowNeedExpire(row)" class="invite-expire-cell">
                <n-date-picker
                  v-if="!row.permanent"
                  v-model:value="row.expireTimestamp"
                  type="datetime"
                  size="small"
                  placeholder="到期时间"
                  clearable
                />
                <n-checkbox v-model:checked="row.permanent" size="small">永久</n-checkbox>
              </div>
              <div v-else class="invite-expire-placeholder">-</div>
              <button
                type="button"
                class="invite-row-delete"
                :disabled="inviteRows.length === 1"
                @click="removeInviteRow(index)"
              >
                删除
              </button>
            </div>
            <button type="button" class="invite-row-add" @click="addInviteRow">
              添加用户
            </button>
          </div>
        </n-form-item>
      </n-form>
      <div v-if="inviteResults.length" class="invite-result">
        <p>邀请完成：成功 {{ inviteSuccessCount }} 个，失败 {{ inviteFailCount }} 个</p>
        <div v-for="result in inviteResults" :key="result.email" class="invite-result-row" :class="{ failed: !result.success }">
          <strong>{{ result.email }}</strong>
          <template v-if="result.success">
            <span>邀请链接已生成（{{ result.expireDays }}天有效）</span>
            <code class="invite-link">{{ result.inviteLink }}</code>
          </template>
          <span v-else>{{ result.message || '邀请失败' }}</span>
        </div>
        <n-button v-if="inviteSuccessCount" size="tiny" type="primary" @click="copyInviteLink">复制全部成功链接</n-button>
      </div>
      <template #footer>
        <n-button type="primary" size="small" @click="submitInvite" :loading="inviteLoading" :disabled="!canSubmitInvite">
          发送邀请
        </n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed, nextTick } from 'vue'
import {
  NInput, NSelect, NButton, NTag, NAvatar, NPagination, NSpin, NModal, NForm, NFormItem, NInputNumber, NDatePicker, NCheckbox
} from 'naive-ui'
import { fetchConfig } from '~/composables/useHttp'
import { apiGetUserManageList } from '~/composables/Api/Admin/userManage'

const defaultAvatar = '/default-avatar.png'

// 页面仅创始人可访问，无需额外判断

const loading = ref(false)
const userList = ref([])
const total = ref(0)

const query = reactive({
  username: '',
  email: '',
  roleId: null,
  blocked: null,
  deleted: null,
  orderBy: null,
  orderDir: 'desc',
  pageNum: 1,
  pageSize: 20
})

const roleOptions = [
  { label: '普通用户', value: 1 },
  { label: '普通开发者', value: 2 },
  { label: 'VIP用户', value: 3 },
  { label: '小班用户', value: 4 },
  { label: '普通管理员', value: 5 },
  { label: '核心开发者', value: 6 },
  { label: '创始人', value: 7 },
]

const blockedOptions = [
  { label: '已拉黑', value: true },
  { label: '未拉黑', value: false },
]

const deletedOptions = [
  { label: '已注销', value: true },
  { label: '未注销', value: false },
]

const orderByOptions = [
  { label: '注册时间', value: 'createTime' },
  { label: '积分', value: 'points' },
  { label: '违规次数', value: 'violationCount' },
]

function roleTagType(level) {
  if (level >= 5) return 'error'
  if (level >= 3) return 'warning'
  return 'info'
}

function toggleOrderDir() {
  query.orderDir = query.orderDir === 'asc' ? 'desc' : 'asc'
}

// 实时搜索：监听所有查询条件变化，自动请求
let searchTimer = null
watch(
  () => [query.username, query.email, query.roleId, query.blocked, query.deleted, query.orderBy, query.orderDir],
  () => {
    // 防抖 300ms
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      query.pageNum = 1
      loadUsers()
    }, 300)
  }
)

async function loadUsers() {
  loading.value = true
  try {
    const res = await apiGetUserManageList(query)
    const data = res?.data || res || {}
    userList.value = data.rows || []
    total.value = data.total || 0
  } catch (e) {
    userList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.username = ''
  query.email = ''
  query.roleId = null
  query.blocked = null
  query.deleted = null
  query.orderBy = null
  query.orderDir = 'desc'
  query.pageNum = 1
  loadUsers()
}

function handlePageChange(page) {
  query.pageNum = page
  loadUsers()
}

// ── 角色管理（已移至详情子页面） ──

function goToDetail(userId) {
  navigateTo(`/admin/user/${userId}`)
}

// ── 邀请管理员 ──
const showInviteModal = ref(false)
const inviteLoading = ref(false)
const inviteResults = ref([])
const inviteFormRef = ref(null)
const inviteEmailInputRefs = ref([])
const inviteForm = reactive({})
const inviteRoleOptions = [
  { label: '普通开发者', value: 2 },
  { label: 'VIP用户', value: 3 },
  { label: '小班用户', value: 4 },
  { label: '普通管理员', value: 5 },
  { label: '核心开发者', value: 6 },
]
const inviteBulk = reactive({
  roleId: 4,
  points: 188,
  permanent: false,
  expireTimestamp: null,
})

// VIP(roleId=3) 和 小班(roleId=4) 需要指定有效期
const inviteBulkNeedExpire = computed(() => inviteBulk.roleId === 4)
const inviteRows = ref([createInviteRow()])
const inviteItems = computed(() => buildInviteItems())
const inviteEmailList = computed(() => inviteItems.value.map(item => item.email))
const inviteSuccessCount = computed(() => inviteResults.value.filter(item => item.success).length)
const inviteFailCount = computed(() => inviteResults.value.filter(item => !item.success).length)

const canSubmitInvite = computed(() => {
  return inviteItems.value.length > 0 && inviteRows.value.every(isInviteRowValid)
})

const inviteRules = {}

function createInviteRow() {
  return {
    id: Date.now() + Math.random(),
    email: '',
    roleId: inviteBulk.roleId,
    points: inviteBulk.points ?? 188,
    permanent: inviteBulkNeedExpire.value ? inviteBulk.permanent : false,
    expireTimestamp: inviteBulkNeedExpire.value && !inviteBulk.permanent ? inviteBulk.expireTimestamp : null
  }
}

function addInviteRow() {
  inviteRows.value.push(createInviteRow())
}

function setInviteEmailInputRef(el, index) {
  if (el) inviteEmailInputRefs.value[index] = el
}

function focusInviteEmailInput(index) {
  nextTick(() => {
    const input = inviteEmailInputRefs.value[index]
    if (input?.focus) {
      input.focus()
      return
    }
    input?.$el?.querySelector?.('input')?.focus()
  })
}

function handleInviteEmailEnter(index) {
  if (index === inviteRows.value.length - 1) {
    addInviteRow()
  }
  focusInviteEmailInput(index + 1)
}

function removeInviteRow(index) {
  if (inviteRows.value.length === 1) return
  inviteRows.value.splice(index, 1)
  inviteEmailInputRefs.value.splice(index, 1)
}

function onInviteRowRoleChange(row) {
  row.permanent = false
  row.expireTimestamp = null
}

function applyInviteBulkRole() {
  inviteBulk.permanent = false
  inviteBulk.expireTimestamp = null
  inviteRows.value.forEach(row => {
    row.roleId = inviteBulk.roleId
    row.permanent = false
    row.expireTimestamp = null
  })
}

function applyInviteBulkPoints() {
  inviteRows.value.forEach(row => {
    row.points = inviteBulk.points ?? 188
  })
}

function applyInviteBulkExpire() {
  if (!inviteBulkNeedExpire.value || inviteBulk.permanent) return
  inviteRows.value.forEach(row => {
    if (row.roleId === inviteBulk.roleId) {
      row.expireTimestamp = inviteBulk.expireTimestamp
    }
  })
}

function applyInviteBulkPermanent(checked) {
  if (!inviteBulkNeedExpire.value) return
  if (checked) inviteBulk.expireTimestamp = null
  inviteRows.value.forEach(row => {
    if (row.roleId === inviteBulk.roleId) {
      row.permanent = checked
      if (checked) row.expireTimestamp = null
    }
  })
}

function inviteRowNeedExpire(row) {
  return row.roleId === 3 || row.roleId === 4
}

function isInviteRowValid(row) {
  const email = String(row.email || '').trim()
  if (!email || !isValidEmail(email) || !row.roleId) return false
  if (inviteRowNeedExpire(row) && !row.permanent && !row.expireTimestamp) return false
  return true
}

function buildInviteItems() {
  const seen = new Set()
  const items = []
  for (const row of inviteRows.value) {
    const email = String(row.email || '').trim()
    if (!email || seen.has(email)) continue
    seen.add(email)
    const item = {
      email,
      roleId: row.roleId,
      points: row.points ?? 188
    }
    if (inviteRowNeedExpire(row)) {
      if (row.permanent) {
        item.permanent = true
      } else if (row.expireTimestamp) {
        item.expireTime = formatDateTime(row.expireTimestamp)
      }
    }
    items.push(item)
  }
  return items
}

async function submitInvite() {
  // 表单校验
  try {
    await inviteFormRef.value.validate()
  } catch {
    return
  }
  inviteLoading.value = true
  inviteResults.value = []
  try {
    const items = inviteItems.value
    if (!items.length) {
      alert('请至少填写一个邮箱')
      return
    }
    if (!inviteRows.value.every(isInviteRowValid)) {
      alert('请检查每个用户的邮箱、角色、积分和有效期')
      return
    }

    const res = await $fetch(`${fetchConfig.baseURL}/admin/invite/batch`, {
      method: 'POST',
      headers: getAuthHeadersLocal(),
      body: { items }
    })
    const results = normalizeBatchInviteResults(res, inviteEmailList.value)
    inviteResults.value = results
    alert(`邀请完成：成功 ${results.filter(item => item.success).length} 个，失败 ${results.filter(item => !item.success).length} 个`)
  } catch (e) {
    alert(e?.data?.msg || '邀请失败')
  } finally {
    inviteLoading.value = false
  }
}

function copyInviteLink() {
  const text = inviteResults.value
    .filter(item => item.success && item.inviteLink)
    .map(item => `${item.email}: ${item.inviteLink}`)
    .join('\n')
  if (!text) return
  navigator.clipboard.writeText(text)
  alert('链接已复制')
}

function normalizeBatchInviteResults(res, emails) {
  const items = res?.data?.items || []
  if (!items.length) {
    return emails.map(email => ({
      email,
      success: false,
      message: res?.msg || '邀请失败'
    }))
  }
  return items.map(item => ({
    email: item.email,
    success: !!item.success,
    message: item.message,
    expireDays: item.data?.expireDays,
    inviteLink: item.data?.inviteLink,
  }))
}

function formatDateTime(timestamp) {
  const d = new Date(timestamp)
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0') + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0') + ':' +
    String(d.getSeconds()).padStart(2, '0')
}

function isValidEmail(value) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
}

function getAuthHeadersLocal() {
  const headers = { appid: 'bd9d01ecc75dbbaaefce' }
  if (process.client) {
    let token = ''
    try { token = useCookie('token').value || '' } catch {}
    if (!token) token = localStorage.getItem('token') || ''
    if (token) { headers.token = token; headers.Authorization = `Bearer ${token}` }
  }
  return headers
}

onMounted(() => {
  loadUsers()
})

useHead({ title: '用户管理' })
</script>

<style scoped>
.user-manage-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.admin-subnav {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  margin-bottom: 18px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.admin-subnav-item {
  min-width: 88px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border-radius: 6px;
  color: #475569;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.admin-subnav-item:hover {
  color: #2563eb;
  background: rgba(255, 255, 255, 0.7);
}

.admin-subnav-item.active {
  color: #1d4ed8;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.invite-btn {
  font-size: 12px;
}

.invite-row-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.invite-email-row {
  display: grid;
  grid-template-columns: minmax(220px, 1.5fr) minmax(130px, 0.8fr) 120px minmax(180px, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.invite-bulk-row {
  position: relative;
  display: grid;
  grid-template-columns: minmax(220px, 1.5fr) minmax(130px, 0.8fr) 120px minmax(180px, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-height: 36px;
}

.invite-bulk-row::before {
  content: '';
  position: absolute;
  inset: -6px 0;
  z-index: 0;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  pointer-events: none;
}

.invite-bulk-row > * {
  position: relative;
  z-index: 1;
}

.invite-bulk-label {
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

.invite-bulk-expire {
  min-width: 180px;
}

.invite-expire-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.invite-expire-cell :deep(.n-date-picker) {
  min-width: 0;
  flex: 1;
}

.invite-expire-placeholder {
  color: #94a3b8;
  text-align: center;
}

.invite-row-delete {
  border: 0;
  background: transparent;
  color: #ef4444;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 0;
}

.invite-row-delete:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.invite-row-add {
  height: 30px;
  border: 1px dashed #8b5cf6;
  border-radius: 6px;
  background: #fff;
  color: #7c3aed;
  font-size: 13px;
  cursor: pointer;
}

.invite-row-add:hover {
  background: #f5f3ff;
}

@media (max-width: 900px) {
  .invite-email-row,
  .invite-bulk-row {
    grid-template-columns: 1fr;
    padding-bottom: 10px;
    border-bottom: 1px solid #f1f5f9;
  }

  .invite-row-delete {
    justify-self: end;
  }
}

.invite-result {
  margin-top: 12px;
  padding: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  font-size: 13px;
}

.invite-result-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 10px;
  padding: 10px;
  background: #fff;
  border: 1px solid #dcfce7;
  border-radius: 6px;
}

.invite-result-row.failed {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.invite-link {
  display: block;
  word-break: break-all;
  margin: 4px 0;
  padding: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
}

.filter-bar {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.filter-input { width: 150px; }
.filter-select { width: 140px; }
.filter-select-sm { width: 120px; }

.sort-group {
  display: flex;
  align-items: center;
  gap: 0;
}
.sort-group .filter-select {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.sort-dir-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 28px;
  border: 1px solid #e2e8f0;
  border-left: none;
  border-radius: 0 4px 4px 0;
  background: #fff;
  cursor: pointer;
  color: #475569;
  transition: all 0.15s;
}
.sort-dir-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

.table-wrap {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.user-table th {
  background: #f1f5f9;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.user-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

.user-table tr:hover td {
  background: #f8fafc;
}

.clickable-row {
  cursor: pointer;
  transition: background 0.15s;
}
.clickable-row:hover td {
  background: #eff6ff;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username-link {
  color: #3b82f6;
  transition: color 0.15s;
}
.username-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.text-danger { color: #ef4444; font-weight: 600; }

.empty-state {
  padding: 60px 0;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

</style>
