<template>
  <div class="carousel-admin-page">
    <div class="carousel-admin-shell">
      <header class="carousel-admin-hero">
        <div class="carousel-admin-hero-main">
          <button class="carousel-admin-back" type="button" @click="navigateTo('/')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 4L6 8L10 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            返回首页
          </button>
          <div class="carousel-admin-hero-copy">
            <p class="carousel-admin-eyebrow">Homepage Operation Console</p>
            <h1 class="carousel-admin-title">轮播图编排台</h1>
            <p class="carousel-admin-subtitle">
              左侧整理曝光顺序，右侧集中编辑文案、跳转和视觉风格，适合运营快速排期和调整。
            </p>
          </div>
        </div>

        <div class="carousel-admin-hero-actions">
          <button class="carousel-admin-secondary-btn" type="button" @click="addNewCard">
            + 新增轮播项
          </button>
          <button
            class="carousel-admin-primary-btn"
            type="button"
            @click="saveAll"
            :disabled="saving || !carouselList.length"
          >
            {{ saving ? '保存中...' : '保存全部' }}
          </button>
        </div>
      </header>

      <section class="carousel-admin-summary">
        <div class="carousel-admin-stat-card">
          <span class="carousel-admin-stat-label">总卡片数</span>
          <strong class="carousel-admin-stat-value">{{ carouselList.length }}</strong>
          <span class="carousel-admin-stat-hint">首页轮播位总库存</span>
        </div>
        <div class="carousel-admin-stat-card">
          <span class="carousel-admin-stat-label">展示中</span>
          <strong class="carousel-admin-stat-value">{{ visibleCount }}</strong>
          <span class="carousel-admin-stat-hint">当前会在前台出现</span>
        </div>
        <div class="carousel-admin-stat-card">
          <span class="carousel-admin-stat-label">已隐藏</span>
          <strong class="carousel-admin-stat-value">{{ hiddenCount }}</strong>
          <span class="carousel-admin-stat-hint">保留配置但不投放</span>
        </div>
        <div class="carousel-admin-stat-card" :class="{ 'is-warning': hasUnsavedChanges }">
          <span class="carousel-admin-stat-label">同步状态</span>
          <strong class="carousel-admin-stat-value">{{ hasUnsavedChanges ? '待保存' : '已同步' }}</strong>
          <span class="carousel-admin-stat-hint">
            {{ hasUnsavedChanges ? '当前有未发布修改' : '本地配置与服务端一致' }}
          </span>
        </div>
      </section>

      <section v-if="carouselList.length" class="carousel-admin-workspace">
        <aside class="carousel-admin-sidebar">
          <div class="carousel-admin-panel-head">
            <div>
              <h2>轮播列表</h2>
              <p>按曝光顺序管理，顶部优先展示。</p>
            </div>
            <span class="carousel-admin-panel-badge">{{ carouselList.length }} 项</span>
          </div>

          <div class="carousel-admin-list">
            <div
              v-for="(item, idx) in carouselList"
              :key="item.id || `draft-${idx}`"
              class="carousel-admin-list-item"
              :class="{
                'is-active': idx === activeIndex,
                'is-hidden': item.isVisible === false
              }"
              role="button"
              tabindex="0"
              @click="selectCard(idx)"
              @keydown.enter.prevent="selectCard(idx)"
            >
              <div class="carousel-admin-list-item-main">
                <div class="carousel-admin-list-item-order">{{ idx + 1 }}</div>
                <div class="carousel-admin-list-item-preview" :style="{ background: item.cardBg }">
                  <div class="carousel-admin-list-item-icon" :style="{ background: item.iconBg }">
                    <span>{{ item.emoji || '☆' }}</span>
                  </div>
                </div>
                <div class="carousel-admin-list-item-copy">
                  <div class="carousel-admin-list-item-title-row">
                    <strong>{{ item.title || '未设置标题' }}</strong>
                    <span
                      class="carousel-admin-status"
                      :class="item.isVisible === false ? 'is-offline' : 'is-online'"
                    >
                      {{ item.isVisible === false ? '已隐藏' : '展示中' }}
                    </span>
                  </div>
                  <p>{{ item.subtitle || '补充一句副标题，方便运营快速识别卡片内容。' }}</p>
                  <span class="carousel-admin-list-item-path">{{ item.path || '/' }}</span>
                </div>
              </div>

              <div class="carousel-admin-list-item-actions" @click.stop>
                <button
                  class="carousel-admin-icon-btn"
                  type="button"
                  title="上移"
                  :disabled="idx === 0"
                  @click.stop="moveCard(idx, -1)"
                >
                  ↑
                </button>
                <button
                  class="carousel-admin-icon-btn"
                  type="button"
                  title="下移"
                  :disabled="idx === carouselList.length - 1"
                  @click.stop="moveCard(idx, 1)"
                >
                  ↓
                </button>
                <button
                  class="carousel-admin-icon-btn"
                  type="button"
                  title="复制"
                  @click.stop="duplicateCard(idx)"
                >
                  ⧉
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main class="carousel-admin-editor" v-if="activeItem">
          <div class="carousel-admin-panel-head">
            <div>
              <h2>卡片详情</h2>
              <p>正在编辑第 {{ activeIndex + 1 }} 项，可直接预览视觉效果。</p>
            </div>
            <div class="carousel-admin-panel-actions">
              <button
                class="carousel-admin-ghost-btn"
                type="button"
                @click="activeItem.isVisible = !activeItem.isVisible"
              >
                {{ activeItem.isVisible ? '设为隐藏' : '恢复展示' }}
              </button>
              <button class="carousel-admin-danger-btn" type="button" @click="removeCard(activeIndex)">
                删除当前项
              </button>
            </div>
          </div>

          <section class="carousel-admin-preview-card" :style="{ background: activeItem.cardBg }">
            <div class="carousel-admin-preview-top">
              <span
                class="carousel-admin-status carousel-admin-status-light"
                :class="activeItem.isVisible === false ? 'is-offline' : 'is-online'"
              >
                {{ activeItem.isVisible === false ? '当前隐藏' : '当前展示' }}
              </span>
              <span class="carousel-admin-preview-path">{{ activeItem.path || '/' }}</span>
            </div>
            <div class="carousel-admin-preview-body">
              <div class="carousel-admin-preview-icon" :style="{ background: activeItem.iconBg }">
                {{ activeItem.emoji || '☆' }}
              </div>
              <div class="carousel-admin-preview-copy">
                <h3>{{ activeItem.title || '填写主标题' }}</h3>
                <p>{{ activeItem.subtitle || '这里会展示副标题描述，建议控制在 18-24 字内。' }}</p>
                <div class="carousel-admin-preview-tags">
                  <span
                    v-for="feature in getFeatureList(activeItem)"
                    :key="feature"
                    class="carousel-admin-preview-tag"
                  >
                    {{ feature }}
                  </span>
                  <span v-if="!getFeatureList(activeItem).length" class="carousel-admin-preview-tag is-placeholder">
                    可添加活动标签
                  </span>
                </div>
              </div>
            </div>
            <div class="carousel-admin-preview-footer">
              <button class="carousel-admin-preview-cta" type="button">
                {{ activeItem.btnText || '立即查看' }}
              </button>
              <span class="carousel-admin-preview-sort">投放顺序 {{ activeIndex + 1 }}</span>
            </div>
          </section>

          <section class="carousel-admin-form-grid">
            <div class="carousel-admin-form-card">
              <div class="carousel-admin-form-card-head">
                <h3>基础信息</h3>
                <p>运营识别和前台露出的主信息。</p>
              </div>
              <div class="carousel-admin-field-grid field-grid-2">
                <label class="carousel-admin-field-block">
                  <span>主标题</span>
                  <input v-model="activeItem.title" class="carousel-admin-input" placeholder="例如：AI 工具实战周" />
                </label>
                <label class="carousel-admin-field-block">
                  <span>图标 Emoji</span>
                  <input v-model="activeItem.emoji" class="carousel-admin-input" maxlength="2" placeholder="🔥" />
                </label>
              </div>
              <label class="carousel-admin-field-block">
                <span>副标题</span>
                <input
                  v-model="activeItem.subtitle"
                  class="carousel-admin-input"
                  placeholder="例如：7 天集中转化，适合活动页和专题卡"
                />
              </label>
            </div>

            <div class="carousel-admin-form-card">
              <div class="carousel-admin-form-card-head">
                <h3>跳转与转化</h3>
                <p>控制 CTA 文案和访问路径。</p>
              </div>
              <div class="carousel-admin-field-grid field-grid-2">
                <label class="carousel-admin-field-block">
                  <span>按钮文案</span>
                  <input v-model="activeItem.btnText" class="carousel-admin-input" placeholder="立即查看" />
                </label>
                <label class="carousel-admin-field-block">
                  <span>排序编号</span>
                  <input :value="activeIndex + 1" class="carousel-admin-input" readonly />
                </label>
              </div>
              <label class="carousel-admin-field-block">
                <span>跳转路径</span>
                <input
                  v-model="activeItem.path"
                  class="carousel-admin-input"
                  placeholder="例如：/list/flashsale/1"
                />
              </label>
            </div>

            <div class="carousel-admin-form-card">
              <div class="carousel-admin-form-card-head">
                <h3>活动标签</h3>
                <p>最多 3 个短标签，适合强调利益点。</p>
              </div>
              <div class="carousel-admin-field-grid field-grid-3">
                <label class="carousel-admin-field-block">
                  <span>标签 1</span>
                  <input v-model="activeItem.feature1" class="carousel-admin-input" placeholder="限时上新" />
                </label>
                <label class="carousel-admin-field-block">
                  <span>标签 2</span>
                  <input v-model="activeItem.feature2" class="carousel-admin-input" placeholder="低门槛体验" />
                </label>
                <label class="carousel-admin-field-block">
                  <span>标签 3</span>
                  <input v-model="activeItem.feature3" class="carousel-admin-input" placeholder="支持回放" />
                </label>
              </div>
            </div>

            <div class="carousel-admin-form-card">
              <div class="carousel-admin-form-card-head">
                <h3>视觉主题</h3>
                <p>建议优先使用预设风格，再按活动细调。</p>
              </div>
              <div class="carousel-admin-field-grid field-grid-2">
                <label class="carousel-admin-field-block">
                  <span>图标背景</span>
                  <input
                    v-model="activeItem.iconBg"
                    class="carousel-admin-input"
                    placeholder="linear-gradient(135deg, #f97316, #ef4444)"
                  />
                </label>
                <label class="carousel-admin-field-block">
                  <span>卡片背景</span>
                  <input
                    v-model="activeItem.cardBg"
                    class="carousel-admin-input"
                    placeholder="linear-gradient(135deg, #0f172a, #1d4ed8)"
                  />
                </label>
              </div>

              <div class="carousel-admin-preset-list">
                <button
                  v-for="preset in presetThemes"
                  :key="preset.name"
                  class="carousel-admin-preset"
                  type="button"
                  @click="applyPreset(preset)"
                >
                  <span class="carousel-admin-preset-preview" :style="{ background: preset.cardBg }">
                    <span class="carousel-admin-preset-preview-icon" :style="{ background: preset.iconBg }"></span>
                  </span>
                  <span class="carousel-admin-preset-name">{{ preset.name }}</span>
                </button>
              </div>
            </div>

            <div class="carousel-admin-form-card carousel-admin-form-card-wide">
              <div class="carousel-admin-form-card-head">
                <h3>投放状态</h3>
                <p>隐藏后会保留配置，但不会出现在首页。</p>
              </div>
              <div class="carousel-admin-visibility-row">
                <button
                  class="carousel-admin-visibility-toggle"
                  :class="{ 'is-active': activeItem.isVisible }"
                  type="button"
                  @click="activeItem.isVisible = !activeItem.isVisible"
                >
                  <span class="carousel-admin-toggle-dot"></span>
                  {{ activeItem.isVisible ? '当前为展示状态' : '当前为隐藏状态' }}
                </button>
                <p class="carousel-admin-visibility-tip">
                  适合活动下线、临时撤回或保留历史配置。
                </p>
              </div>
            </div>
          </section>
        </main>
      </section>

      <section v-else class="carousel-admin-empty">
        <div class="carousel-admin-empty-card">
          <span class="carousel-admin-empty-icon">✦</span>
          <h2>还没有轮播项</h2>
          <p>先创建第一张卡片，再配置文案、路径和主题风格。</p>
          <button class="carousel-admin-primary-btn" type="button" @click="addNewCard">
            创建首个轮播项
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { createDiscreteApi } from 'naive-ui'
import { useHttpGet, useHttpPost } from '~/composables/useHttp'

const { message } = createDiscreteApi(['message'])

useHead({ title: '轮播图编排台 - 后台' })

const saving = ref(false)
const carouselList = ref([])
const activeIndex = ref(0)
const lastSavedSnapshot = ref('')

const presetThemes = [
  {
    name: '大促冲刺',
    iconBg: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
    cardBg: 'linear-gradient(135deg, #3b0a0a 0%, #7f1d1d 45%, #dc2626 100%)',
  },
  {
    name: '内容上新',
    iconBg: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)',
    cardBg: 'linear-gradient(135deg, #082f49 0%, #0f766e 55%, #0ea5e9 100%)',
  },
  {
    name: '会员权益',
    iconBg: 'linear-gradient(135deg, #f59e0b 0%, #facc15 100%)',
    cardBg: 'linear-gradient(135deg, #422006 0%, #854d0e 55%, #f59e0b 100%)',
  },
  {
    name: '品牌专题',
    iconBg: 'linear-gradient(135deg, #818cf8 0%, #38bdf8 100%)',
    cardBg: 'linear-gradient(135deg, #172554 0%, #1d4ed8 52%, #0f766e 100%)',
  },
]

const visibleCount = computed(() => carouselList.value.filter(item => item.isVisible !== false).length)
const hiddenCount = computed(() => carouselList.value.length - visibleCount.value)
const activeItem = computed(() => carouselList.value[activeIndex.value] || null)
const hasUnsavedChanges = computed(() => serializeCarousel(carouselList.value) !== lastSavedSnapshot.value)

function createDefaultCard(overrides = {}) {
  return {
    id: null,
    sort: carouselList.value.length + 1,
    emoji: '🔥',
    iconBg: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    cardBg: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 52%, #0f766e 100%)',
    title: '',
    subtitle: '',
    btnText: '立即查看',
    path: '/',
    feature1: '',
    feature2: '',
    feature3: '',
    isVisible: true,
    ...overrides,
  }
}

function normalizeCarouselItem(item = {}, index = 0) {
  return createDefaultCard({
    ...item,
    sort: index + 1,
    isVisible: item.isVisible === 1 || item.isVisible === true,
  })
}

function serializeCarousel(list = []) {
  return JSON.stringify(
    list.map((item, index) => ({
      id: item.id ?? null,
      sort: index + 1,
      emoji: item.emoji || '',
      iconBg: item.iconBg || '',
      cardBg: item.cardBg || '',
      title: item.title || '',
      subtitle: item.subtitle || '',
      btnText: item.btnText || '',
      path: item.path || '',
      feature1: item.feature1 || '',
      feature2: item.feature2 || '',
      feature3: item.feature3 || '',
      isVisible: item.isVisible !== false,
    }))
  )
}

function syncSort() {
  carouselList.value.forEach((item, index) => {
    item.sort = index + 1
  })
}

function refreshSnapshot() {
  lastSavedSnapshot.value = serializeCarousel(carouselList.value)
}

function ensureActiveIndex(nextIndex = activeIndex.value) {
  if (!carouselList.value.length) {
    activeIndex.value = 0
    return
  }

  const safeIndex = Math.min(Math.max(nextIndex, 0), carouselList.value.length - 1)
  activeIndex.value = safeIndex
}

async function loadCarouselList() {
  const { data, error } = await useHttpGet('carouselList', '/homepage/carousel/list', { $: true })

  if (error.value) {
    message.error('获取轮播图列表失败')
    return
  }

  carouselList.value = (data.value || []).map((item, index) => normalizeCarouselItem(item, index))
  ensureActiveIndex(0)
  refreshSnapshot()
}

function selectCard(index) {
  ensureActiveIndex(index)
}

function addNewCard() {
  carouselList.value.push(createDefaultCard({ sort: carouselList.value.length + 1 }))
  ensureActiveIndex(carouselList.value.length - 1)
}

function moveCard(index, direction) {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= carouselList.value.length) return

  const items = [...carouselList.value]
  const current = items[index]
  items[index] = items[targetIndex]
  items[targetIndex] = current
  carouselList.value = items
  syncSort()
  ensureActiveIndex(targetIndex)
}

function duplicateCard(index) {
  const source = carouselList.value[index]
  if (!source) return

  const duplicate = createDefaultCard({
    ...JSON.parse(JSON.stringify(source)),
    id: null,
    title: source.title ? `${source.title}（副本）` : '未命名卡片（副本）',
    isVisible: false,
  })

  carouselList.value.splice(index + 1, 0, duplicate)
  syncSort()
  ensureActiveIndex(index + 1)
}

function removeCard(index) {
  const current = carouselList.value[index]
  if (!current) return

  if (process.client) {
    const confirmed = window.confirm(`确认删除「${current.title || `第 ${index + 1} 项`}」吗？`)
    if (!confirmed) return
  }

  carouselList.value.splice(index, 1)
  syncSort()
  ensureActiveIndex(index)
}

function applyPreset(preset) {
  if (!activeItem.value) return
  activeItem.value.iconBg = preset.iconBg
  activeItem.value.cardBg = preset.cardBg
}

function getFeatureList(item = {}) {
  return [item.feature1, item.feature2, item.feature3].filter(Boolean)
}

async function saveAll() {
  saving.value = true

  try {
    const payload = carouselList.value.map((item, index) => ({
      ...item,
      sort: index + 1,
      isVisible: item.isVisible ? 1 : 0,
    }))

    const { error } = await useHttpPost('carouselSaveAll', '/homepage/carousel/saveAll', {
      $: true,
      body: payload,
    })

    if (error.value) {
      message.error(`保存失败：${error.value || '未知错误'}`)
      return
    }

    message.success('保存成功')
    await loadCarouselList()
  } catch (error) {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

watch(
  () => carouselList.value.length,
  () => {
    ensureActiveIndex(activeIndex.value)
  }
)

onMounted(() => {
  loadCarouselList()
})
</script>

<style scoped>
.carousel-admin-page {
  min-height: 100vh;
  padding: 28px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.18), transparent 28%),
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.18), transparent 24%),
    linear-gradient(180deg, #f3f7fb 0%, #eef3f7 100%);
}

.carousel-admin-shell {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.carousel-admin-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 28px 32px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(20px);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
}

.carousel-admin-hero-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.carousel-admin-back {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border: 1px solid #d7e0ea;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  color: #4b5563;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.carousel-admin-back:hover {
  color: #0f766e;
  border-color: #8dd3cf;
  transform: translateY(-1px);
}

.carousel-admin-eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #0f766e;
}

.carousel-admin-title {
  margin: 0;
  font-size: 34px;
  line-height: 1.1;
  color: #0f172a;
}

.carousel-admin-subtitle {
  max-width: 720px;
  margin: 10px 0 0;
  font-size: 15px;
  line-height: 1.7;
  color: #475569;
}

.carousel-admin-hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.carousel-admin-secondary-btn,
.carousel-admin-primary-btn,
.carousel-admin-ghost-btn,
.carousel-admin-danger-btn,
.carousel-admin-preview-cta {
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.carousel-admin-secondary-btn {
  padding: 12px 18px;
  border-radius: 14px;
  background: #f8fafc;
  color: #0f172a;
  border: 1px dashed #cbd5e1;
  font-size: 14px;
  font-weight: 600;
}

.carousel-admin-secondary-btn:hover {
  border-color: #0ea5e9;
  background: #eff6ff;
  color: #0369a1;
}

.carousel-admin-primary-btn {
  padding: 12px 22px;
  border-radius: 14px;
  background: linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 12px 22px rgba(14, 165, 233, 0.22);
}

.carousel-admin-primary-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(14, 165, 233, 0.28);
}

.carousel-admin-primary-btn:disabled,
.carousel-admin-secondary-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.carousel-admin-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.carousel-admin-stat-card {
  padding: 18px 20px;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.carousel-admin-stat-card.is-warning {
  border-color: rgba(245, 158, 11, 0.34);
  background: linear-gradient(180deg, rgba(255, 251, 235, 0.98), rgba(255, 255, 255, 0.92));
}

.carousel-admin-stat-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
}

.carousel-admin-stat-value {
  font-size: 28px;
  line-height: 1;
  color: #0f172a;
}

.carousel-admin-stat-hint {
  font-size: 13px;
  color: #64748b;
}

.carousel-admin-workspace {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.carousel-admin-sidebar,
.carousel-admin-editor,
.carousel-admin-empty-card {
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.carousel-admin-sidebar,
.carousel-admin-editor {
  padding: 22px;
}

.carousel-admin-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.carousel-admin-panel-head h2,
.carousel-admin-form-card-head h3 {
  margin: 0;
  color: #0f172a;
}

.carousel-admin-panel-head h2 {
  font-size: 20px;
}

.carousel-admin-panel-head p,
.carousel-admin-form-card-head p {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
}

.carousel-admin-panel-badge {
  padding: 7px 12px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.carousel-admin-panel-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.carousel-admin-ghost-btn {
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #d7e0ea;
  background: #ffffff;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
}

.carousel-admin-ghost-btn:hover {
  border-color: #8dd3cf;
  color: #0f766e;
  background: #f0fdfa;
}

.carousel-admin-danger-btn {
  padding: 10px 14px;
  border-radius: 12px;
  background: #fff1f2;
  color: #be123c;
  font-size: 13px;
  font-weight: 700;
}

.carousel-admin-danger-btn:hover {
  background: #ffe4e6;
}

.carousel-admin-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  padding-right: 4px;
}

.carousel-admin-list-item {
  width: 100%;
  text-align: left;
  padding: 14px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%);
  display: flex;
  flex-direction: column;
  gap: 14px;
  cursor: pointer;
  transition: all 0.22s ease;
}

.carousel-admin-list-item:hover {
  border-color: #7dd3fc;
  box-shadow: 0 14px 26px rgba(14, 165, 233, 0.12);
  transform: translateY(-1px);
}

.carousel-admin-list-item.is-active {
  border-color: #0ea5e9;
  box-shadow: 0 18px 30px rgba(14, 165, 233, 0.16);
}

.carousel-admin-list-item.is-hidden {
  opacity: 0.76;
}

.carousel-admin-list-item-main {
  display: grid;
  grid-template-columns: 34px 72px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.carousel-admin-list-item-order {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: #0f172a;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

.carousel-admin-list-item-preview {
  height: 72px;
  border-radius: 18px;
  padding: 10px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.carousel-admin-list-item-icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 18px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
}

.carousel-admin-list-item-copy {
  min-width: 0;
}

.carousel-admin-list-item-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.carousel-admin-list-item-title-row strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  color: #0f172a;
}

.carousel-admin-list-item-copy p {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.carousel-admin-list-item-path,
.carousel-admin-preview-path,
.carousel-admin-preview-sort {
  font-size: 12px;
  color: #cbd5e1;
}

.carousel-admin-list-item-path {
  display: inline-block;
  max-width: 100%;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.carousel-admin-list-item-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.carousel-admin-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid #dbe4ee;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}

.carousel-admin-icon-btn:hover:not(:disabled) {
  border-color: #0ea5e9;
  color: #0369a1;
  background: #eff6ff;
}

.carousel-admin-icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.carousel-admin-preview-card {
  position: relative;
  overflow: hidden;
  padding: 22px;
  border-radius: 24px;
  color: #ffffff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.carousel-admin-preview-card::after {
  content: '';
  position: absolute;
  inset: auto -60px -90px auto;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.09);
  filter: blur(2px);
}

.carousel-admin-preview-top,
.carousel-admin-preview-footer {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.carousel-admin-preview-body {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  margin: 22px 0 24px;
}

.carousel-admin-preview-icon {
  width: 88px;
  height: 88px;
  border-radius: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.24);
}

.carousel-admin-preview-copy h3 {
  margin: 0;
  font-size: 28px;
  line-height: 1.15;
}

.carousel-admin-preview-copy p {
  margin: 12px 0 14px;
  max-width: 560px;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.82);
}

.carousel-admin-preview-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.carousel-admin-preview-tag {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 12px;
  color: #ffffff;
}

.carousel-admin-preview-tag.is-placeholder {
  color: rgba(255, 255, 255, 0.74);
}

.carousel-admin-preview-cta {
  padding: 11px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
}

.carousel-admin-preview-cta:hover {
  transform: translateY(-1px);
}

.carousel-admin-status {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.carousel-admin-status.is-online {
  background: #dcfce7;
  color: #15803d;
}

.carousel-admin-status.is-offline {
  background: #f1f5f9;
  color: #64748b;
}

.carousel-admin-status-light.is-online {
  background: rgba(220, 252, 231, 0.18);
  color: #dcfce7;
}

.carousel-admin-status-light.is-offline {
  background: rgba(241, 245, 249, 0.16);
  color: #e2e8f0;
}

.carousel-admin-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.carousel-admin-form-card {
  padding: 18px;
  border-radius: 22px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.carousel-admin-form-card-wide {
  grid-column: 1 / -1;
}

.carousel-admin-form-card-head {
  margin-bottom: 14px;
}

.carousel-admin-field-grid {
  display: grid;
  gap: 12px;
}

.field-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field-grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.carousel-admin-field-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.carousel-admin-field-block span {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

.carousel-admin-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid #dbe4ee;
  background: #ffffff;
  color: #0f172a;
  font-size: 14px;
  transition: all 0.2s ease;
}

.carousel-admin-input:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.12);
}

.carousel-admin-input[readonly] {
  background: #f8fafc;
  color: #64748b;
}

.carousel-admin-preset-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.carousel-admin-preset {
  padding: 10px;
  border-radius: 16px;
  border: 1px solid #dbe4ee;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.carousel-admin-preset:hover {
  border-color: #7dd3fc;
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(14, 165, 233, 0.12);
}

.carousel-admin-preset-preview {
  height: 72px;
  border-radius: 14px;
  padding: 10px;
  display: flex;
  align-items: flex-start;
}

.carousel-admin-preset-preview-icon {
  width: 26px;
  height: 26px;
  border-radius: 9px;
}

.carousel-admin-preset-name {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.carousel-admin-visibility-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.carousel-admin-visibility-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 999px;
  border: 1px solid #dbe4ee;
  background: #ffffff;
  color: #334155;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.carousel-admin-visibility-toggle.is-active {
  border-color: #99f6e4;
  background: #f0fdfa;
  color: #0f766e;
}

.carousel-admin-toggle-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #94a3b8;
  box-shadow: 0 0 0 6px rgba(148, 163, 184, 0.16);
}

.carousel-admin-visibility-toggle.is-active .carousel-admin-toggle-dot {
  background: #14b8a6;
  box-shadow: 0 0 0 6px rgba(20, 184, 166, 0.14);
}

.carousel-admin-visibility-tip {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.carousel-admin-empty {
  display: flex;
  justify-content: center;
}

.carousel-admin-empty-card {
  width: min(560px, 100%);
  padding: 48px 24px;
  text-align: center;
}

.carousel-admin-empty-icon {
  display: inline-flex;
  width: 72px;
  height: 72px;
  border-radius: 22px;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%);
  color: #ffffff;
  font-size: 30px;
  box-shadow: 0 16px 28px rgba(14, 165, 233, 0.2);
}

.carousel-admin-empty-card h2 {
  margin: 20px 0 10px;
  font-size: 26px;
  color: #0f172a;
}

.carousel-admin-empty-card p {
  margin: 0 0 24px;
  font-size: 14px;
  color: #64748b;
}

@media (max-width: 1200px) {
  .carousel-admin-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .carousel-admin-workspace {
    grid-template-columns: 1fr;
  }

  .carousel-admin-list {
    max-height: none;
  }
}

@media (max-width: 900px) {
  .carousel-admin-page {
    padding: 18px;
  }

  .carousel-admin-hero {
    padding: 22px;
    border-radius: 24px;
    flex-direction: column;
  }

  .carousel-admin-hero-actions,
  .carousel-admin-panel-actions,
  .carousel-admin-visibility-row {
    width: 100%;
  }

  .carousel-admin-hero-actions {
    justify-content: stretch;
  }

  .carousel-admin-hero-actions > button,
  .carousel-admin-panel-actions > button {
    flex: 1;
  }

  .carousel-admin-form-grid,
  .field-grid-2,
  .field-grid-3,
  .carousel-admin-preset-list,
  .carousel-admin-summary {
    grid-template-columns: 1fr;
  }

  .carousel-admin-preview-body {
    grid-template-columns: 1fr;
  }

  .carousel-admin-preview-icon {
    width: 72px;
    height: 72px;
    border-radius: 22px;
    font-size: 34px;
  }

  .carousel-admin-preview-copy h3 {
    font-size: 24px;
  }
}

@media (max-width: 640px) {
  .carousel-admin-shell {
    gap: 16px;
  }

  .carousel-admin-title {
    font-size: 28px;
  }

  .carousel-admin-sidebar,
  .carousel-admin-editor {
    padding: 16px;
    border-radius: 22px;
  }

  .carousel-admin-list-item-main {
    grid-template-columns: 30px 62px minmax(0, 1fr);
  }

  .carousel-admin-list-item-preview {
    height: 62px;
  }

  .carousel-admin-preview-top,
  .carousel-admin-preview-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
