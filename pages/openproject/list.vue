<template>
  <div class="open-project-page">
    <OpenProjectAnnouncementBar />

    <div class="page-head">
      <n-breadcrumb>
        <n-breadcrumb-item><nuxt-link to="/">首页</nuxt-link></n-breadcrumb-item>
        <n-breadcrumb-item>开源项目</n-breadcrumb-item>
      </n-breadcrumb>
      <n-button type="primary" secondary @click="openSourceModal">
        查看数据源
      </n-button>
    </div>

    <OpenProjectSearch :tag-options="tagOptions" :source-options="sourceOptions" @search="handleSearch" />

    <div class="page-layout">
      <div class="list-area">
        <div class="content-area">
          <div v-if="loading" class="empty-box"><n-spin size="large" /></div>
          <div v-else-if="projectList.length === 0" class="empty-box">
            <n-empty description="暂无开源项目" />
          </div>

          <div v-else class="project-grid">
            <div
              v-for="item in projectList"
              :key="item.id"
              class="project-card"
              :class="{ archived: item.isArchived === 1, expanded: expandedId === item.id }"
            >
              <div class="card-inner" @click="toggleExpand(item)">
                <div class="card-header">
                  <div class="title-row">
                    <span class="expand-icon" :class="{ open: expandedId === item.id }">›</span>
                    <span class="project-title">{{ item.projectName }}</span>
                    <n-tag v-if="item.isArchived === 1" size="small" type="warning">已归档</n-tag>
                  </div>
                  <div class="project-tags">
                    <n-tag v-for="(tagName, idx) in item.tagNames" :key="idx" size="small" type="primary">
                      {{ tagName }}
                    </n-tag>
                  </div>
                </div>

                <div class="card-body" v-show="expandedId !== item.id">
                  <p class="project-desc">{{ item.projectDesc || '暂无描述' }}</p>
                </div>

                <div class="card-footer">
                  <div class="author-info">
                    <n-avatar :size="24" :src="item.projectCover || defaultCover" />
                    <span class="author-name">{{ item.authorName || item.githubOwner || '匿名' }}</span>
                  </div>
                  <div class="footer-right">
                    <div class="github-stats">
                      <span class="stat-item">★ {{ item.starCount ?? '-' }}</span>
                      <span class="stat-item">⑂ {{ item.forkCount ?? '-' }}</span>
                      <span v-if="item.lastCommitTime" class="stat-item last-commit">
                        最近提交：{{ formatDate(item.lastCommitTime) }}
                      </span>
                    </div>
                    <n-button
                      text
                      :style="{ color: item.favorited ? '#f59e0b' : '#9ca3af', fontSize: '22px' }"
                      :title="item.favorited ? '取消收藏' : '收藏'"
                      @click.stop="toggleFavorite(item)"
                    >
                      {{ item.favorited ? '★' : '☆' }}
                    </n-button>
                  </div>
                </div>
              </div>

              <Transition name="expand">
                <div v-if="expandedId === item.id" class="card-detail">
                  <div class="detail-loading" v-if="detailLoading">
                    <n-spin size="small" /> 加载中...
                  </div>
                  <template v-else-if="detailData">
                    <div class="detail-grid">
                      <div class="detail-main">
                        <div class="detail-section-title">项目介绍</div>
                        <p class="detail-desc">{{ detailData.projectDesc || '暂无详细介绍' }}</p>

                        <div v-if="detailData.contributors?.length" class="contributors">
                          <div class="detail-section-title">开发团队</div>
                          <div class="contributor-list">
                            <UserCard
                              v-for="contributor in detailData.contributors"
                              :key="contributor.id || contributor.githubAccount"
                              :github-account="contributor.profileUrl || contributor.githubAccount"
                              :username="contributor.githubAccount"
                              class="contributor"
                            >
                              <n-avatar :size="22" :src="contributor.avatarUrl" />
                              <button
                                type="button"
                                class="github-copy-link"
                                @click.stop="copyGithubLink(contributor.profileUrl || buildGithubProfileUrl(contributor.githubAccount))"
                              >
                                {{ contributor.profileUrl || buildGithubProfileUrl(contributor.githubAccount) }}
                              </button>
                              <small>{{ contributor.contributions || 0 }} 次贡献</small>
                              <small>{{ contributor.contributorType === 'primary' ? '最高负责人' : '协同开发' }}</small>
                            </UserCard>
                          </div>
                        </div>

                        <div v-if="detailData.modules?.length" class="module-list">
                          <div class="detail-section-title">项目模块</div>
                          <div class="module-card" v-for="module in detailData.modules" :key="module.id || module.moduleName">
                            <div class="module-head">
                              <strong>{{ module.moduleName }}</strong>
                              <span>{{ module.moduleDesc || '暂无描述' }}</span>
                            </div>
                            <div v-if="module.members?.length" class="module-members">
                              <UserCard
                                v-for="member in module.members"
                                :key="`${module.id}-${member.githubAccount}-${member.memberRole}`"
                                :github-account="buildGithubProfileUrl(member.githubAccount)"
                                :username="member.githubAccount"
                                class="module-member"
                              >
                                <n-avatar :size="22" :src="moduleMemberAvatar(member)" />
                                <button
                                  type="button"
                                  class="github-copy-link"
                                  @click.stop="copyGithubLink(buildGithubProfileUrl(member.githubAccount))"
                                >
                                  {{ buildGithubProfileUrl(member.githubAccount) }}
                                </button>
                                <small>{{ member.memberRole === 'primary' ? '主要开发' : '协同开发' }}</small>
                              </UserCard>
                            </div>
                          </div>
                        </div>

                        <div v-if="detailData.techComponents?.length" class="tech-list">
                          <div class="detail-section-title">技术组件</div>
                          <div class="tech-tags">
                            <n-tooltip
                              v-for="component in detailData.techComponents"
                              :key="component.id || component.componentName"
                              :disabled="!component.componentDesc"
                              trigger="hover"
                            >
                              <template #trigger>
                                <a
                                  v-if="component.officialUrl"
                                  :href="component.officialUrl"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  class="tech-tag tech-tag-link"
                                  @click.stop
                                >
                                  {{ component.componentName }}
                                </a>
                                <span
                                  v-else
                                  class="tech-tag"
                                  :class="{ 'tech-tag-desc': component.componentDesc }"
                                  @click.stop
                                >
                                  {{ component.componentName }}
                                </span>
                              </template>
                              {{ component.componentDesc }}
                            </n-tooltip>
                          </div>
                        </div>
                      </div>

                      <div class="detail-side">
                        <div class="detail-meta">
                          <div class="dm-row">
                            <span class="dm-label">作者</span>
                            <span class="dm-value">{{ detailData.authorName || '-' }}</span>
                          </div>
                          <div class="dm-row">
                            <span class="dm-label">数据源</span>
                            <span class="dm-value">{{ sourceName(detailData.sourceId) }}</span>
                          </div>
                          <div class="dm-row">
                            <span class="dm-label">状态</span>
                            <n-tag :type="detailData.isArchived === 1 ? 'warning' : 'success'" size="small">
                              {{ detailData.isArchived === 1 ? '已归档' : '活跃维护' }}
                            </n-tag>
                          </div>
                          <div class="dm-row">
                            <span class="dm-label">Star</span>
                            <span class="dm-value star">{{ detailData.starCount ?? '-' }}</span>
                          </div>
                          <div class="dm-row">
                            <span class="dm-label">Fork</span>
                            <span class="dm-value">{{ detailData.forkCount ?? '-' }}</span>
                          </div>
                          <div class="dm-row" v-if="detailData.language">
                            <span class="dm-label">语言</span>
                            <span class="dm-value">{{ detailData.language }}</span>
                          </div>
                          <div class="dm-row" v-if="detailData.lastSyncTime">
                            <span class="dm-label">同步</span>
                            <span class="dm-value muted">{{ formatDate(detailData.lastSyncTime) }}</span>
                          </div>
                        </div>

                        <div class="detail-actions">
                          <n-button type="primary" size="small" @click.stop="goGithub(detailData)">
                            访问 GitHub
                          </n-button>
                          <n-button v-if="detailData.canEdit" size="small" secondary @click.stop="openEditModal(detailData)">
                            编辑
                          </n-button>
                          <n-dropdown
                            v-if="detailData.resources?.length"
                            trigger="click"
                            :options="resourceDropdownOptions(detailData.resources)"
                            @select="key => handleResourceSelect(key, detailData)"
                          >
                            <n-button size="small" secondary @click.stop>
                              绑定资源
                            </n-button>
                          </n-dropdown>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <div class="pagination-wrapper" v-if="total > 0">
          <n-pagination
            :page-count="Math.ceil(total / pageSize)"
            :page="currentPage"
            @update:page="handlePageChange"
          />
        </div>
      </div>

      <div class="rank-area">
        <OpenProjectRankBoard @select="handleRankSelect" />
      </div>
    </div>

    <n-modal v-model:show="sourceModalVisible" preset="card" title="GitHub 数据源配置" class="source-modal">
      <div class="source-toolbar">
        <n-button v-if="canManageOpenProject" type="primary" :loading="sourceSyncingAll" @click="syncAllSources">同步全部</n-button>
        <n-button @click="loadSources">刷新</n-button>
      </div>

      <div class="source-list">
        <div v-for="source in sourceList" :key="source.id" class="source-item">
          <div class="source-main">
            <strong>{{ sourceDisplayName(source) }}</strong>
            <div class="source-meta">
              {{ sourceTypeText(source) }} ·
              <a
                :href="sourceGithubUrl(source)"
                target="_blank"
                rel="noopener noreferrer"
                class="source-link"
                @click.stop
              >
                {{ sourceGithubUrl(source) }}
              </a>
              · 仓库 {{ source.repoCount || 0 }}
              · {{ sourceEnabledText(source) }}
            </div>
            <div class="source-message" v-if="source.lastSyncMessage">{{ source.lastSyncMessage }}</div>

            <details class="source-detail">
              <summary>基本信息</summary>
              <div class="source-detail-grid">
                <span>名称</span>
                <strong>{{ sourceDisplayName(source) }}</strong>
                <span>GitHub 账号链接</span>
                <a :href="sourceGithubUrl(source)" target="_blank" rel="noopener noreferrer" class="source-link">
                  {{ sourceGithubUrl(source) }}
                </a>
                <span>类型</span>
                <strong>{{ sourceTypeText(source) }}</strong>
                <span>状态</span>
                <strong>{{ sourceEnabledText(source) }}</strong>
                <span>仓库数</span>
                <strong>{{ source.repoCount || 0 }}</strong>
                <span>最后同步</span>
                <strong>{{ formatDate(source.lastSyncTime) || '-' }}</strong>
                <span>备注</span>
                <strong>{{ source.remark || '-' }}</strong>
              </div>
            </details>
          </div>
          <div v-if="canManageOpenProject" class="source-actions">
            <n-button size="small" :type="editingSourceId === source.id ? 'primary' : 'default'" @click="editSource(source)">编辑</n-button>
            <n-button size="small" :loading="syncingSourceId === source.id" @click="syncSource(source.id)">同步</n-button>
            <n-button size="small" type="error" secondary @click="deleteSource(source.id)">删除</n-button>
          </div>
        </div>
      </div>

      <n-alert v-if="!canManageOpenProject" type="info" :bordered="false">
        当前页面展示已配置的数据源。Lv.4 及以上用户可以编辑、同步和删除数据源。
      </n-alert>

      <template v-else>
        <section v-if="editingSourceId" class="source-form-section editing">
          <div class="source-form-head">
            <strong>编辑现有数据源</strong>
            <n-button size="small" quaternary @click="cancelEditSource">取消编辑</n-button>
          </div>
          <n-form :model="sourceEditForm" label-placement="left" label-width="92px" class="modal-form">
            <n-form-item label="名称">
              <n-input v-model:value="sourceEditForm.sourceName" placeholder="例如 juege-osh" />
            </n-form-item>
            <n-form-item label="GitHub 账号链接">
              <n-input v-model:value="sourceEditForm.githubOwner" placeholder="例如 https://github.com/juege-osh" />
            </n-form-item>
            <n-form-item label="类型">
              <n-select v-model:value="sourceEditForm.sourceType" :options="sourceTypeOptions" />
            </n-form-item>
            <n-form-item label="Token">
              <n-input v-model:value="sourceEditForm.accessToken" type="password" show-password-on="click" placeholder="可选，留空则不修改已有 token" />
            </n-form-item>
            <n-form-item label="启用">
              <n-switch v-model:value="sourceEditForm.enabledBool" />
            </n-form-item>
            <n-form-item label="备注">
              <n-input v-model:value="sourceEditForm.remark" type="textarea" :rows="2" />
            </n-form-item>
          </n-form>

          <div class="modal-actions">
            <n-button @click="cancelEditSource">取消</n-button>
            <n-button type="primary" :loading="savingSource" @click="saveEditSource">保存编辑</n-button>
          </div>
        </section>

        <section class="source-form-section">
          <div class="source-form-head">
            <strong>新增数据源</strong>
          </div>
          <n-form :model="sourceCreateForm" label-placement="left" label-width="92px" class="modal-form">
            <n-form-item label="名称">
              <n-input v-model:value="sourceCreateForm.sourceName" placeholder="例如 juege-osh" />
            </n-form-item>
            <n-form-item label="GitHub 账号链接">
              <n-input v-model:value="sourceCreateForm.githubOwner" placeholder="例如 https://github.com/juege-osh" />
            </n-form-item>
            <n-form-item label="类型">
              <n-select v-model:value="sourceCreateForm.sourceType" :options="sourceTypeOptions" />
            </n-form-item>
            <n-form-item label="Token">
              <n-input v-model:value="sourceCreateForm.accessToken" type="password" show-password-on="click" placeholder="可选，公开仓库可不填" />
            </n-form-item>
            <n-form-item label="启用">
              <n-switch v-model:value="sourceCreateForm.enabledBool" />
            </n-form-item>
            <n-form-item label="备注">
              <n-input v-model:value="sourceCreateForm.remark" type="textarea" :rows="2" />
            </n-form-item>
          </n-form>

          <div class="modal-actions">
            <n-button @click="resetCreateSourceForm">清空新增</n-button>
            <n-button type="primary" :loading="savingSource" @click="saveCreateSource">新增数据源</n-button>
          </div>
        </section>
      </template>
    </n-modal>

    <n-modal v-model:show="editModalVisible" preset="card" title="编辑开源项目" class="edit-modal">
      <n-form :model="editForm" label-placement="left" label-width="104px">
        <n-form-item label="项目名称">
          <n-input v-model:value="editForm.projectName" />
        </n-form-item>
        <n-form-item label="作者">
          <n-input v-model:value="editForm.authorName" />
        </n-form-item>
        <n-form-item label="封面">
          <n-input v-model:value="editForm.projectCover" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="editForm.projectDesc" type="textarea" :rows="4" />
        </n-form-item>
        <n-form-item label="标签">
          <n-select
            v-model:value="editForm.tagValues"
            multiple
            filterable
            tag
            :options="tagOptions"
            placeholder="选择已有标签，或输入新标签后回车"
          />
        </n-form-item>
        <n-form-item label="最高负责人">
          <n-select
            v-model:value="editForm.leaderGithubAccount"
            filterable
            :options="contributorOptions"
            placeholder="选择项目最高负责人"
          />
        </n-form-item>
        <n-form-item label="开发团队">
          <div class="contributor-editor">
            <div v-for="(item, idx) in editForm.contributors" :key="idx" class="contributor-row">
              <n-tag :type="item.githubAccount === editForm.leaderGithubAccount ? 'success' : 'info'" size="small">
                {{ item.githubAccount === editForm.leaderGithubAccount ? '最高负责人' : '开发者' }}
              </n-tag>
              <n-input v-model:value="item.wechatName" placeholder="微信名/昵称（留空时保存后自动匹配）" />
              <n-input v-model:value="item.profileUrl" placeholder="GitHub 账号链接" @blur="fillContributorByGithub(item)" />
              <n-input-number v-model:value="item.contributions" placeholder="贡献次数" class="contribution-count" disabled />
              <n-button text type="error" @click="removeContributor(idx)">删除</n-button>
            </div>
            <n-button dashed size="small" @click="addContributor">添加贡献人</n-button>
          </div>
        </n-form-item>
        <n-form-item label="项目模块">
          <div class="module-editor">
            <div v-for="(module, moduleIdx) in editForm.modules" :key="module.localKey" class="module-edit-card">
              <div class="module-edit-head">
                <n-input v-model:value="module.moduleName" placeholder="模块名称" />
                <n-input v-model:value="module.moduleDesc" placeholder="模块描述" />
                <n-button text type="error" @click="removeModule(moduleIdx)">删除模块</n-button>
              </div>
              <div class="module-member-editor">
                <div v-for="(member, memberIdx) in module.members" :key="member.localKey" class="module-member-row">
                  <n-select
                    v-model:value="member.githubAccount"
                    filterable
                    :options="contributorOptions"
                    placeholder="选择开发者"
                    @update:value="value => fillModuleMember(moduleIdx, memberIdx, value)"
                  />
                  <n-select v-model:value="member.memberRole" :options="moduleMemberRoleOptions" />
                  <n-input v-model:value="member.wechatName" placeholder="微信名称" />
                  <n-button text type="error" @click="removeModuleMember(moduleIdx, memberIdx)">删除</n-button>
                </div>
                <n-button dashed size="small" @click="addModuleMember(moduleIdx)">添加模块成员</n-button>
              </div>
            </div>
            <n-button dashed size="small" @click="addModule">添加模块</n-button>
          </div>
        </n-form-item>
        <n-form-item label="技术组件">
          <div class="tech-editor">
            <div v-for="(component, idx) in editForm.techComponents" :key="component.localKey" class="tech-row">
              <n-input v-model:value="component.componentName" placeholder="组件名称，例如 Spring Boot" />
              <n-input v-model:value="component.componentDesc" placeholder="组件描述" />
              <n-input v-model:value="component.officialUrl" placeholder="官网/文档链接" />
              <n-button text type="error" @click="removeTechComponent(idx)">删除</n-button>
            </div>
            <n-button dashed size="small" @click="addTechComponent">添加技术组件</n-button>
          </div>
        </n-form-item>
        <n-form-item label="绑定资源">
          <div class="resource-editor">
            <div v-for="(res, idx) in editForm.resources" :key="idx" class="resource-row">
              <n-select v-model:value="res.resourceType" :options="resourceTypeOptions" @update:value="() => resetResourceSelection(res)" />
              <n-select
                v-model:value="res.resourceId"
                filterable
                remote
                clearable
                :loading="res.loading"
                :options="res.options"
                placeholder="搜索并选择资源"
                @focus="() => searchResource(idx, '')"
                @search="keyword => searchResource(idx, keyword)"
                @update:value="value => selectResource(idx, value)"
              />
              <span class="resource-preview">{{ res.resourceName || '选择后自动绑定名称和路径' }}</span>
              <n-button text type="error" @click="removeEditResource(idx)">删除</n-button>
            </div>
            <n-button dashed size="small" @click="addEditResource">添加资源</n-button>
          </div>
        </n-form-item>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="editModalVisible = false">取消</n-button>
          <n-button type="primary" :loading="savingEdit" @click="saveProjectEdit">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import {
  NAlert, NBreadcrumb, NBreadcrumbItem, NAvatar, NButton, NEmpty, NPagination, NSpin, NTag,
  NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NSpace, NSwitch, NDropdown, NTooltip, createDiscreteApi
} from 'naive-ui'
import { computed, reactive, ref, onMounted } from 'vue'
import { getUserMemberLevel } from '~/composables/useAuth'

const { message, dialog } = createDiscreteApi(['message', 'dialog'])
const defaultCover = 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'

const projectList = ref([])
const tagOptions = ref([])
const sourceList = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchParams = ref({})
const expandedId = ref(null)
const detailData = ref(null)
const detailLoading = ref(false)

const userLevel = computed(() => getUserMemberLevel())
const canManageOpenProject = computed(() => userLevel.value >= 4)
const sourceOptions = computed(() => sourceList.value.map(item => ({
  label: `${item.sourceName || item.githubOwner}（${item.githubOwner}）`,
  value: Number(item.id),
})))

const sourceModalVisible = ref(false)
const savingSource = ref(false)
const sourceSyncingAll = ref(false)
const syncingSourceId = ref(null)
const editingSourceId = ref(null)
const sourceCreateForm = reactive(emptySourceForm())
const sourceEditForm = reactive(emptySourceForm())

const editModalVisible = ref(false)
const savingEdit = ref(false)
const editForm = reactive(emptyEditForm())
let localKeySeed = 1

const sourceTypeOptions = [
  { label: 'GitHub 用户', value: 'user' },
  { label: 'GitHub 组织', value: 'org' },
]

const resourceTypeOptions = [
  { label: '课程', value: 'course' },
  { label: '电子书', value: 'book' },
  { label: '工具', value: 'tool' },
]

const moduleMemberRoleOptions = [
  { label: '主要开发', value: 'primary' },
  { label: '协同开发', value: 'collaborator' },
]

const contributorOptions = computed(() => {
  const seen = new Set()
  return editForm.contributors.reduce((options, item) => {
    const account = normalizeGithubOwner(item.githubAccount || item.profileUrl)
    const key = account.toLowerCase()
    if (!account || seen.has(key)) return options
    seen.add(key)
    options.push({
      label: `${item.wechatName || account}（${buildGithubProfileUrl(account)}）`,
      value: account,
    })
    return options
  }, [])
})

async function toggleExpand(item) {
  if (expandedId.value === item.id) {
    expandedId.value = null
    detailData.value = null
    return
  }
  expandedId.value = item.id
  detailData.value = null
  detailLoading.value = true
  try {
    const res = await apiGetOpenProjectDetail(item.id)
    detailData.value = res?.data || res || item
  } catch {
    detailData.value = item
  } finally {
    detailLoading.value = false
  }
}

async function goGithub(item) {
  if (!item?.projectUrl) return
  await apiClickOpenProject(item.id).catch(() => {})
  window.open(item.projectUrl, '_blank')
}

async function toggleFavorite(item) {
  try {
    if (item.favorited) {
      await apiCancelFavoriteOpenProject(item.id)
      item.favorited = false
    } else {
      await apiFavoriteOpenProject(item.id)
      item.favorited = true
    }
  } catch (e) {
    message.error(e?.data?.msg || '收藏操作失败')
  }
}

async function copyGithubLink(url) {
  const link = buildGithubProfileUrl(url)
  if (!link) return
  try {
    await navigator.clipboard.writeText(link)
    message.success('GitHub 链接已复制')
  } catch {
    message.error('复制失败，请手动复制')
  }
}

async function loadTags() {
  try {
    const res = await apiGetOpenProjectTags()
    const tags = res?.data || res || []
    tagOptions.value = tags.map(t => ({ label: t.tagName, value: Number(t.id) }))
  } catch {}
}

async function loadSources() {
  const res = await apiGetOpenProjectSources()
  sourceList.value = res?.data || res || []
}

async function loadList() {
  loading.value = true
  expandedId.value = null
  detailData.value = null
  try {
    const res = await apiGetOpenProjectList({
      ...searchParams.value,
      pageNum: currentPage.value,
      pageSize: pageSize.value,
    })
    const data = res?.data || res || {}
    projectList.value = data.rows || []
    total.value = data.total || 0
  } catch {
    projectList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch(params) {
  searchParams.value = params
  currentPage.value = 1
  loadList()
}

function handleRankSelect(rankItem) {
  const found = projectList.value.find(p => p.id === rankItem.id)
  if (found) toggleExpand(found)
}

function handlePageChange(page) {
  currentPage.value = page
  loadList()
}

function openSourceModal() {
  sourceModalVisible.value = true
  loadSources()
}

function editSource(source) {
  editingSourceId.value = source.id
  Object.assign(sourceEditForm, {
    id: source.id,
    sourceName: sourceDisplayName(source),
    githubOwner: sourceGithubUrl(source),
    sourceType: normalizeSourceType(source.sourceType),
    accessToken: '',
    enabledBool: normalizeSourceEnabled(source),
    remark: source.remark || '',
  })
}

function cancelEditSource() {
  editingSourceId.value = null
  Object.assign(sourceEditForm, emptySourceForm())
}

function resetCreateSourceForm() {
  Object.assign(sourceCreateForm, emptySourceForm())
}

async function saveCreateSource() {
  await saveSourceForm(sourceCreateForm, () => {
    resetCreateSourceForm()
  })
}

async function saveEditSource() {
  await saveSourceForm(sourceEditForm, () => {
    cancelEditSource()
  })
}

async function saveSourceForm(form, afterSaved) {
  const githubOwner = normalizeGithubOwner(form.githubOwner)
  if (!githubOwner) {
    message.warning('请填写 GitHub 账号或组织')
    return
  }
  savingSource.value = true
  try {
    await apiSaveOpenProjectSource({
      id: form.id,
      sourceName: form.sourceName?.trim() || githubOwner,
      githubOwner,
      sourceType: normalizeSourceType(form.sourceType),
      accessToken: form.accessToken || undefined,
      enabled: form.enabledBool ? 1 : 0,
      remark: form.remark,
    })
    message.success('数据源已保存')
    afterSaved?.()
    await loadSources()
  } catch (e) {
    message.error(e?.data?.msg || '保存失败')
  } finally {
    savingSource.value = false
  }
}

function deleteSource(id) {
  dialog.warning({
    title: '删除数据源',
    content: '确认删除这个 GitHub 数据源吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await apiDeleteOpenProjectSource(id)
      message.success('已删除')
      await loadSources()
    },
  })
}

async function syncSource(id) {
  syncingSourceId.value = id
  try {
    await apiSyncOpenProjectSource(id)
    message.success('同步完成')
    await loadSources()
    await loadList()
  } catch (e) {
    message.error(e?.data?.msg || '同步失败')
  } finally {
    syncingSourceId.value = null
  }
}

async function syncAllSources() {
  sourceSyncingAll.value = true
  try {
    await apiSyncAllOpenProjectSources()
    message.success('同步全部完成')
    await loadSources()
    await loadList()
  } catch (e) {
    message.error(e?.data?.msg || '同步失败')
  } finally {
    sourceSyncingAll.value = false
  }
}

async function openEditModal(project) {
  const source = await apiGetOpenProjectDetail(project.id).catch(() => null)
  const detail = source?.data || source || project
  const tags = detail.tagIds || []
  Object.assign(editForm, {
    id: detail.id,
    projectName: detail.projectName || '',
    projectDesc: detail.projectDesc || '',
    authorName: detail.authorName || '',
    projectCover: detail.projectCover || '',
    tagValues: tags.map(Number),
    resources: (detail.resources || []).map(toEditableResource),
    contributors: (detail.contributors || []).map(toEditableContributor),
    leaderGithubAccount: normalizeGithubOwner(detail.leader?.githubAccount || detail.contributors?.find(item => item.contributorType === 'primary')?.githubAccount),
    originalLeaderGithubAccount: normalizeGithubOwner(detail.leader?.githubAccount || detail.contributors?.find(item => item.contributorType === 'primary')?.githubAccount),
    modules: (detail.modules || []).map(toEditableModule),
    techComponents: (detail.techComponents || []).map(toEditableTechComponent),
  })
  if (!editForm.contributors.length) addContributor()
  editModalVisible.value = true
}

function toEditableContributor(item) {
  const profileUrl = item.profileUrl || buildGithubProfileUrl(item.githubAccount)
  return {
    githubAccount: normalizeGithubOwner(item.githubAccount || profileUrl),
    wechatName: item.wechatName || '',
    contributorType: item.contributorType === 'primary' ? 'primary' : 'contributor',
    contributions: Number(item.contributions || 0),
    avatarUrl: item.avatarUrl || '',
    profileUrl,
    sortOrder: Number(item.sortOrder || 0),
  }
}

function addContributor() {
  editForm.contributors.push({
    githubAccount: '',
    wechatName: '',
    contributorType: 'contributor',
    contributions: 0,
    avatarUrl: '',
    profileUrl: '',
    sortOrder: editForm.contributors.length,
  })
}

function removeContributor(index) {
  editForm.contributors.splice(index, 1)
  ensureLeaderInContributors()
}

function fillContributorByGithub(item) {
  if (!item?.profileUrl?.trim()) return
  item.profileUrl = buildGithubProfileUrl(item.profileUrl)
  item.githubAccount = normalizeGithubOwner(item.profileUrl)
  if (!editForm.leaderGithubAccount && item.githubAccount) {
    editForm.leaderGithubAccount = item.githubAccount
  }
  ensureLeaderInContributors()
}

function ensureLeaderInContributors() {
  const accounts = contributorOptions.value.map(item => item.value)
  if (!accounts.length) {
    editForm.leaderGithubAccount = ''
    return
  }
  if (!accounts.some(account => account.toLowerCase() === normalizeGithubOwner(editForm.leaderGithubAccount).toLowerCase())) {
    editForm.leaderGithubAccount = accounts[0]
  }
}

function toEditableModule(item) {
  return {
    id: item.id || null,
    localKey: nextLocalKey(),
    moduleName: item.moduleName || '',
    moduleDesc: item.moduleDesc || '',
    sortOrder: Number(item.sortOrder || 0),
    members: (item.members || []).map(toEditableModuleMember),
  }
}

function toEditableModuleMember(item) {
  return {
    contributorId: item.contributorId || null,
    localKey: nextLocalKey(),
    githubAccount: normalizeGithubOwner(item.githubAccount),
    wechatName: item.wechatName || '',
    memberRole: item.memberRole === 'primary' ? 'primary' : 'collaborator',
    sortOrder: Number(item.sortOrder || 0),
  }
}

function toEditableTechComponent(item) {
  return {
    componentId: item.componentId || item.id || null,
    localKey: nextLocalKey(),
    componentName: item.componentName || '',
    componentCode: item.componentCode || '',
    componentDesc: item.componentDesc || '',
    officialUrl: item.officialUrl || '',
    sortOrder: Number(item.sortOrder || 0),
  }
}

function addModule() {
  editForm.modules.push({
    id: null,
    localKey: nextLocalKey(),
    moduleName: '',
    moduleDesc: '',
    sortOrder: editForm.modules.length,
    members: [],
  })
}

function removeModule(index) {
  editForm.modules.splice(index, 1)
}

function addModuleMember(moduleIndex) {
  const module = editForm.modules[moduleIndex]
  if (!module) return
  module.members.push({
    contributorId: null,
    localKey: nextLocalKey(),
    githubAccount: '',
    wechatName: '',
    memberRole: 'collaborator',
    sortOrder: module.members.length,
  })
}

function removeModuleMember(moduleIndex, memberIndex) {
  editForm.modules[moduleIndex]?.members?.splice(memberIndex, 1)
}

function fillModuleMember(moduleIndex, memberIndex, githubAccount) {
  const member = editForm.modules[moduleIndex]?.members?.[memberIndex]
  if (!member) return
  const contributor = editForm.contributors.find(item => normalizeGithubOwner(item.githubAccount || item.profileUrl) === githubAccount)
  member.githubAccount = githubAccount
  member.wechatName = contributor?.wechatName || member.wechatName || ''
}

function moduleMemberAvatar(member) {
  const account = normalizeGithubOwner(member?.githubAccount)
  if (!account) return ''
  return editForm.contributors.find(item => normalizeGithubOwner(item.githubAccount || item.profileUrl).toLowerCase() === account.toLowerCase())?.avatarUrl
    || detailData.value?.contributors?.find(item => normalizeGithubOwner(item.githubAccount || item.profileUrl).toLowerCase() === account.toLowerCase())?.avatarUrl
    || ''
}

function addTechComponent() {
  editForm.techComponents.push({
    componentId: null,
    localKey: nextLocalKey(),
    componentName: '',
    componentCode: '',
    componentDesc: '',
    officialUrl: '',
    sortOrder: editForm.techComponents.length,
  })
}

function removeTechComponent(index) {
  editForm.techComponents.splice(index, 1)
}

function nextLocalKey() {
  return `local-${localKeySeed++}`
}

function buildGithubProfileUrl(githubAccount) {
  const raw = String(githubAccount || '').trim()
  if (!raw) return ''
  if (/^https?:\/\/github\.com\//i.test(raw)) return raw
  if (/^github\.com\//i.test(raw)) return `https://${raw}`
  return `https://github.com/${normalizeGithubOwner(raw)}`
}

function toEditableResource(item) {
  return {
    resourceType: item.resourceType || 'course',
    resourceId: item.resourceId || null,
    resourceName: item.resourceName || '',
    resourceUrl: item.resourceUrl || '',
    options: item.resourceId ? [{
      label: item.resourceName || `#${item.resourceId}`,
      value: Number(item.resourceId),
      raw: {
        id: item.resourceId,
        resourceType: item.resourceType,
        resourceName: item.resourceName,
        resourceUrl: item.resourceUrl,
      },
    }] : [],
    loading: false,
  }
}

function addEditResource() {
  editForm.resources.push(toEditableResource({ resourceType: 'course' }))
}

function removeEditResource(index) {
  editForm.resources.splice(index, 1)
}

function resetResourceSelection(res) {
  res.resourceId = null
  res.resourceName = ''
  res.resourceUrl = ''
  res.options = []
}

async function searchResource(index, keyword) {
  const row = editForm.resources[index]
  if (!row) return
  row.loading = true
  try {
    const list = await fetchResourceOptions(row.resourceType, keyword)
    row.options = list.map(item => ({
      label: item.resourceName || item.title || item.name || item.toolName || `#${item.id}`,
      value: Number(item.id),
      raw: item,
    }))
  } finally {
    row.loading = false
  }
}

function selectResource(index, value) {
  const row = editForm.resources[index]
  const option = row?.options?.find(item => item.value === value)
  if (!row || !option) return
  row.resourceId = option.value
  row.resourceName = option.raw?.resourceName || option.label
  row.resourceUrl = option.raw?.resourceUrl || buildResourceUrl(row.resourceType, option.value)
}

async function fetchResourceOptions(type, keyword = '') {
  const res = await apiSearchOpenProjectResources({
    resourceType: type,
    keyword,
    limit: 20,
  })
  return res?.data || res || []
}

function buildResourceUrl(type, id) {
  if (type === 'course') return `/course_detail/${id}`
  if (type === 'book') return `/detail/book/${id}`
  if (type === 'tool') return `/tool/detail/${id}`
  return ''
}

function resourceDropdownOptions(resources = []) {
  return resources.map((item, index) => ({
    key: index,
    label: `${resourceLabel(item.resourceType)}：${item.resourceName || `#${item.resourceId}`}`,
  }))
}

function handleResourceSelect(index, project) {
  const resource = project?.resources?.[index]
  if (!resource) return
  const targetUrl = resolveResourceJumpUrl(resource)
  if (targetUrl) {
    goResourceUrl(targetUrl)
  }
}

function resolveResourceJumpUrl(resource) {
  if (resource.resourceType === 'tool') {
    return `/tool?toolId=${resource.resourceId}&autoOpen=1`
  }
  if (resource.resourceType === 'course') {
    return resource.resourceUrl || `/course_detail/${resource.resourceId}`
  }
  if (resource.resourceType === 'book') {
    return resource.resourceUrl || `/detail/book/${resource.resourceId}`
  }
  return resource.resourceUrl || ''
}

function goResourceUrl(url) {
  if (!url) return
  if (process.client) {
    window.location.href = url
    return
  }
  navigateTo(url)
}

async function saveProjectEdit() {
  savingEdit.value = true
  try {
    const tagIds = editForm.tagValues.filter(v => typeof v === 'number')
    const customTags = editForm.tagValues.filter(v => typeof v === 'string' && v.trim())
    const normalizedLeader = normalizeGithubOwner(editForm.leaderGithubAccount)
    const contributorAccounts = contributorOptions.value.map(item => item.value.toLowerCase())
    if (!contributorAccounts.length) {
      message.warning('请至少保留一名开发团队成员')
      return
    }
    if (!normalizedLeader || !contributorAccounts.includes(normalizedLeader.toLowerCase())) {
      message.warning('最高负责人必须从开发团队中选择')
      return
    }
    await apiEditOpenProject({
      id: editForm.id,
      projectName: editForm.projectName,
      projectDesc: editForm.projectDesc,
      authorName: editForm.authorName,
      projectCover: editForm.projectCover,
      tagIds,
      customTags,
      resources: editForm.resources
        .filter(r => r.resourceId)
        .map(({ resourceType, resourceId, resourceName, resourceUrl }) => ({ resourceType, resourceId, resourceName, resourceUrl })),
      contributors: editForm.contributors
        .filter(item => item.profileUrl?.trim() || item.githubAccount?.trim())
        .map((item, idx) => ({
          ...item,
          githubAccount: normalizeGithubOwner(item.profileUrl || item.githubAccount),
          profileUrl: buildGithubProfileUrl(item.profileUrl || item.githubAccount),
          contributorType: 'contributor',
          sortOrder: idx,
        })),
      modules: editForm.modules
        .filter(item => item.moduleName?.trim())
        .map((module, idx) => ({
          id: module.id,
          moduleName: module.moduleName,
          moduleDesc: module.moduleDesc,
          sortOrder: idx,
          members: (module.members || [])
            .filter(member => member.githubAccount)
            .map((member, memberIdx) => ({
              contributorId: member.contributorId,
              githubAccount: normalizeGithubOwner(member.githubAccount),
              wechatName: member.wechatName,
              memberRole: member.memberRole === 'primary' ? 'primary' : 'collaborator',
              sortOrder: memberIdx,
            })),
        })),
      techComponents: editForm.techComponents
        .filter(item => item.componentName?.trim())
        .map((item, idx) => ({
          componentId: item.componentId,
          componentName: item.componentName,
          componentCode: item.componentCode,
          componentDesc: item.componentDesc,
          officialUrl: item.officialUrl,
          sortOrder: idx,
        })),
    })
    if (normalizedLeader && normalizedLeader !== editForm.originalLeaderGithubAccount) {
      await apiTransferOpenProjectLeader({
        projectId: editForm.id,
        githubAccount: normalizedLeader,
      })
    }
    message.success('开源项目已保存')
    editModalVisible.value = false
    await loadTags()
    await loadList()
  } catch (e) {
    message.error(e?.data?.msg || '保存失败')
  } finally {
    savingEdit.value = false
  }
}

function emptySourceForm() {
  return {
    id: null,
    sourceName: '',
    githubOwner: '',
    sourceType: 'user',
    accessToken: '',
    enabledBool: true,
    remark: '',
  }
}

function normalizeGithubOwner(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return raw
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/^github\.com\//i, '')
    .replace(/^@/, '')
    .split(/[/?#]/)[0]
    .trim()
}

function normalizeSourceType(type) {
  return type === 'org' || type === 'organization' ? 'org' : 'user'
}

function normalizeSourceEnabled(source) {
  if (source?.enabled === false || source?.enabled === 0 || source?.enabled === '0') return false
  if (source?.status === false || source?.status === 0 || source?.status === '0') return false
  return true
}

function sourceGithubOwner(source) {
  return normalizeGithubOwner(source?.githubOwner || source?.githubAccount || source?.owner || source?.login)
}

function sourceGithubUrl(source) {
  const url = source?.githubUrl || source?.profileUrl
  if (url) return url
  return buildGithubProfileUrl(sourceGithubOwner(source))
}

function sourceDisplayName(source) {
  return source?.sourceName || sourceGithubOwner(source) || '-'
}

function sourceTypeText(source) {
  return normalizeSourceType(source?.sourceType) === 'org' ? '组织' : '用户'
}

function sourceEnabledText(source) {
  return normalizeSourceEnabled(source) ? '启用' : '禁用'
}

function emptyEditForm() {
  return {
    id: null,
    projectName: '',
    projectDesc: '',
    authorName: '',
    projectCover: '',
    tagValues: [],
    resources: [],
    contributors: [],
    leaderGithubAccount: '',
    originalLeaderGithubAccount: '',
    modules: [],
    techComponents: [],
  }
}

function sourceName(sourceId) {
  const source = sourceList.value.find(item => Number(item.id) === Number(sourceId))
  return source ? (source.sourceName || source.githubOwner) : '-'
}

function resourceLabel(type) {
  const map = { course: '查看课程', book: '查看电子书', tool: '查看工具' }
  return map[type] || '查看资源'
}

function formatDate(raw) {
  if (!raw) return ''
  try {
    const d = Array.isArray(raw)
      ? new Date(raw[0], raw[1] - 1, raw[2], raw[3] || 0, raw[4] || 0)
      : new Date(raw)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return ''
  }
}

onMounted(async () => {
  await Promise.all([loadTags(), loadSources()])
  loadList()
})
</script>

<style scoped>
.open-project-page { max-width: 1400px; margin: 0 auto; padding: 20px; }
.page-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.page-layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }
.list-area { min-width: 0; }
.rank-area { position: sticky; top: 80px; }
.content-area { min-height: 400px; }
.empty-box { display: flex; justify-content: center; align-items: center; height: 300px; }
.project-grid { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; }
.project-card { border-radius: 8px; box-shadow: 0 2px 8px rgba(15,23,42,0.05); background: #fff; border: 1px solid #e2e8f0; cursor: pointer; overflow: hidden; transition: all 0.2s ease; }
.project-card:hover { box-shadow: 0 8px 24px rgba(15,23,42,0.08); border-color: #94a3b8; transform: translateY(-1px); }
.project-card.expanded { border-color: #3b82f6; transform: none; }
.project-card.archived { opacity: 0.72; }
.card-inner { display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto; padding: 18px 24px; }
.card-header { grid-column: 1; display: flex; flex-direction: column; gap: 8px; }
.title-row { display: flex; align-items: center; gap: 10px; }
.expand-icon { color: #94a3b8; font-size: 26px; line-height: 1; transition: transform 0.2s ease; }
.expand-icon.open { transform: rotate(90deg); color: #3b82f6; }
.project-title { font-size: 16px; font-weight: 600; color: #1e293b; }
.project-tags { display: flex; gap: 6px; flex-wrap: wrap; padding-left: 28px; }
.card-body { grid-column: 1; grid-row: 2; padding: 8px 0 0 28px; }
.project-desc { font-size: 13px; color: #64748b; line-height: 1.6; margin: 0; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.card-footer { grid-column: 2; grid-row: 1 / 3; display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; padding-left: 28px; min-width: 150px; }
.author-info { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.author-name { color: #64748b; }
.footer-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.github-stats { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; font-size: 12px; color: #64748b; }
.stat-item { display: flex; align-items: center; justify-content: flex-end; }
.last-commit { color: #9ca3af; font-size: 11px; }
.card-detail { border-top: 1px solid #edf2f7; background: #f8fafc; padding: 20px 24px; }
.detail-loading { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 13px; }
.detail-grid { display: grid; grid-template-columns: 1fr 250px; gap: 28px; }
.detail-section-title { font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 10px; }
.detail-desc { font-size: 14px; color: #334155; line-height: 1.8; white-space: pre-wrap; margin: 0; }
.contributors { margin-top: 22px; }
.contributor-list { display: flex; gap: 8px; flex-wrap: wrap; }
.contributor { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 999px; background: #eef2ff; color: #334155; text-decoration: none; font-size: 12px; }
.contributor:hover { background: #e0e7ff; }
.github-copy-link { border: 0; padding: 0; background: transparent; color: #475569; font: inherit; cursor: pointer; }
.github-copy-link:hover { color: #1d4ed8; text-decoration: underline; }
.contributor small { color: #64748b; }
.module-list, .tech-list { margin-top: 22px; }
.module-card { border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; padding: 12px; margin-bottom: 8px; }
.module-head { display: flex; flex-direction: column; gap: 4px; }
.module-head strong { color: #1e293b; font-size: 13px; }
.module-head span { color: #64748b; font-size: 12px; line-height: 1.5; }
.module-members { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.module-member { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 999px; background: #f1f5f9; color: #334155; font-size: 12px; }
.module-member small { color: #64748b; }
.tech-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tech-tag { display: inline-flex; align-items: center; padding: 5px 10px; border-radius: 999px; background: #ecfeff; color: #0f766e; font-size: 12px; text-decoration: none; border: 1px solid #99f6e4; }
.tech-tag-desc { cursor: help; }
.tech-tag-link { cursor: pointer; }
.tech-tag-link:hover { color: #115e59; background: #ccfbf1; border-color: #5eead4; }
.detail-meta { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.dm-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 13px; }
.dm-label { color: #94a3b8; }
.dm-value { color: #1e293b; font-weight: 500; text-align: right; }
.dm-value.star { color: #f59e0b; }
.dm-value.muted { color: #9ca3af; }
.detail-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 12px; }
.pagination-wrapper { display: flex; justify-content: center; margin-top: 32px; }
.source-modal, .edit-modal { width: min(1040px, 94vw); }
.source-toolbar { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 14px; }
.source-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px; max-height: 320px; overflow: auto; }
.source-item { display: flex; justify-content: space-between; gap: 16px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
.source-main { flex: 1; min-width: 0; }
.source-meta, .source-message { margin-top: 4px; font-size: 12px; color: #64748b; }
.source-link { color: #2563eb; text-decoration: none; }
.source-link:hover { text-decoration: underline; }
.source-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.source-detail { margin-top: 8px; font-size: 12px; color: #475569; }
.source-detail summary { cursor: pointer; color: #4f46e5; user-select: none; }
.source-detail-grid { display: grid; grid-template-columns: 108px minmax(0, 1fr); gap: 8px 12px; margin-top: 8px; padding: 10px; border-radius: 6px; background: #fff; border: 1px solid #e2e8f0; }
.source-detail-grid span { color: #94a3b8; }
.source-detail-grid strong, .source-detail-grid a { min-width: 0; word-break: break-all; font-weight: 500; }
.source-form-section { border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 18px; }
.source-form-section.editing { border: 1px solid #c7d2fe; border-radius: 8px; padding: 14px; background: #f8faff; }
.source-form-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.source-form-head strong { font-size: 14px; color: #1e293b; }
.modal-form { padding-top: 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
.resource-editor, .contributor-editor, .module-editor, .tech-editor { width: 100%; display: flex; flex-direction: column; gap: 8px; }
.resource-row { display: grid; grid-template-columns: 120px 1.2fr 1fr auto; gap: 8px; align-items: center; }
.resource-preview { min-width: 0; color: #64748b; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.contributor-row { display: grid; grid-template-columns: 100px 1fr 1fr 130px auto; gap: 8px; align-items: center; }
.module-edit-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
.module-edit-head { display: grid; grid-template-columns: 180px 1fr auto; gap: 8px; align-items: center; margin-bottom: 10px; }
.module-member-editor { display: flex; flex-direction: column; gap: 8px; }
.module-member-row { display: grid; grid-template-columns: 1fr 130px 1fr auto; gap: 8px; align-items: center; }
.tech-row { display: grid; grid-template-columns: 180px 1fr 1fr auto; gap: 8px; align-items: center; }
.expand-enter-active, .expand-leave-active { transition: max-height 0.25s ease, opacity 0.2s ease; max-height: 640px; overflow: hidden; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; }
@media (max-width: 1024px) {
  .page-layout { grid-template-columns: 1fr; }
  .rank-area { order: -1; position: static; }
}
@media (max-width: 760px) {
  .card-inner, .detail-grid { grid-template-columns: 1fr; }
  .card-footer { grid-column: 1; grid-row: auto; align-items: flex-start; padding: 14px 0 0 28px; }
  .footer-right { align-items: flex-start; }
  .github-stats { align-items: flex-start; }
  .resource-row, .contributor-row, .module-edit-head, .module-member-row, .tech-row { grid-template-columns: 1fr; }
  .source-item { flex-direction: column; }
}
</style>
