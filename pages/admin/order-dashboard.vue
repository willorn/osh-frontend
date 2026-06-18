<template>
  <div class="order-admin-page">
    <section v-if="!canAccessPage" class="forbidden-panel">
      <n-icon :size="28"><LockClosedOutline /></n-icon>
      <h1>订单数据</h1>
      <p>当前账号暂无订单看板权限</p>
      <n-button @click="navigateTo('/')">返回首页</n-button>
    </section>

    <template v-else>
      <section class="page-toolbar">
        <div class="title-block">
          <n-button quaternary circle title="返回首页" @click="navigateTo('/')">
            <template #icon>
              <n-icon><ArrowBackOutline /></n-icon>
            </template>
          </n-button>
          <div>
            <h1>订单看板</h1>
            <p>{{ rangeLabel }} · 更新于 {{ lastUpdated }}</p>
          </div>
        </div>
        <div class="toolbar-actions">
          <n-button secondary @click="navigateTo('/admin/orders')">
            <template #icon>
              <n-icon><ReceiptOutline /></n-icon>
            </template>
            订单管理
          </n-button>
          <n-select v-model:value="range" :options="rangeOptions" class="range-select" />
          <n-button type="primary" @click="refreshDashboard">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
            刷新
          </n-button>
        </div>
      </section>

      <n-spin :show="loading">
      <section class="metric-grid">
        <article v-for="item in metrics" :key="item.label" class="metric-card">
          <div class="metric-head">
            <span>{{ item.label }}</span>
            <n-icon :class="['metric-icon', item.tone]">
              <component :is="item.icon" />
            </n-icon>
          </div>
          <strong>{{ item.value }}</strong>
          <div class="metric-foot">
            <span :class="['metric-change', item.changeType]">{{ item.change }}</span>
            <span>{{ item.note }}</span>
          </div>
        </article>
      </section>

      <section class="status-grid">
        <article v-for="item in dashboard.statusCards" :key="item.label" :class="['status-card', item.tone]">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </article>
      </section>

      <section class="dashboard-layout">
        <article class="panel revenue-panel">
          <div class="panel-head">
            <div>
              <h2>每日流水</h2>
              <p>实收金额、积分抵扣与待支付金额对照</p>
            </div>
            <div class="chart-legend">
              <span><i class="legend cash"></i>实收</span>
              <span><i class="legend points"></i>积分抵扣</span>
              <span><i class="legend pending"></i>待支付</span>
            </div>
          </div>
          <div class="combo-chart" aria-label="每日流水图表">
            <div v-for="item in dailyRevenue" :key="item.day" class="chart-day">
              <div class="bar-stack">
                <div class="bar cash" :style="{ height: `${item.cashHeight}%` }"></div>
                <div class="bar points" :style="{ height: `${item.pointsHeight}%` }"></div>
                <div class="pending-line" :style="{ bottom: `${item.pendingHeight}%` }"></div>
              </div>
              <span>{{ item.day }}</span>
            </div>
          </div>
        </article>

        <article class="panel mix-panel">
          <div class="panel-head compact">
            <div>
              <h2>支付结构</h2>
              <p>订单支付方式占比</p>
            </div>
          </div>
          <div class="donut-wrap">
            <div class="donut" :style="{ background: paymentMixGradient }">
              <span>{{ dashboard.paymentMixTotal }}</span>
              <small>笔支付</small>
            </div>
            <div class="legend-list">
            <div v-for="item in paymentMix" :key="item.label">
                <i :style="{ background: item.color }"></i>
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}%</strong>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section class="dashboard-layout lower">
        <article class="panel funnel-panel">
          <div class="panel-head">
            <div>
              <h2>下单转化</h2>
              <p>从结算到履约完成的关键漏斗</p>
            </div>
          </div>
          <div class="funnel-list">
            <div v-for="item in funnel" :key="item.label" class="funnel-row">
              <div class="funnel-label">
                <span>{{ item.label }}</span>
                <strong>{{ item.count }}</strong>
              </div>
              <div class="funnel-bar">
                <i :style="{ width: `${item.rate}%` }"></i>
              </div>
              <span class="funnel-rate">{{ item.rate }}%</span>
            </div>
          </div>
        </article>

        <article class="panel points-panel">
          <div class="panel-head">
            <div>
              <h2>积分消费</h2>
              <p>积分抵扣、消耗来源与现金贡献</p>
            </div>
          </div>
          <div class="points-summary">
            <div>
              <span>积分抵扣金额</span>
              <strong>{{ dashboard.pointsSummary.deductAmount }}</strong>
            </div>
            <div>
              <span>消耗积分</span>
              <strong>{{ dashboard.pointsSummary.usedPoints }}</strong>
            </div>
            <div>
              <span>使用率</span>
              <strong>{{ dashboard.pointsSummary.usageRate }}</strong>
            </div>
          </div>
          <div class="source-list">
            <div v-for="item in pointsSources" :key="item.label" class="source-row">
              <span>{{ item.label }}</span>
              <div class="source-bar"><i :style="{ width: `${item.rate}%`, background: item.color }"></i></div>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </article>
      </section>

      <section class="insight-grid">
        <article class="panel">
          <div class="panel-head compact">
            <div>
              <h2>商品贡献</h2>
              <p>按实收金额排序</p>
            </div>
          </div>
          <div class="ranking-list">
            <div v-for="item in topProducts" :key="item.name" class="ranking-row">
              <span>{{ item.rank }}</span>
              <div>
                <strong>{{ item.name }}</strong>
                <small>{{ item.orders }} 笔 · 积分抵扣 ¥{{ item.points }}</small>
              </div>
              <b>¥{{ item.amount }}</b>
            </div>
          </div>
        </article>

        <article class="panel">
          <div class="panel-head compact">
            <div>
              <h2>待处理风险</h2>
              <p>需要运营介入的订单状态</p>
            </div>
          </div>
          <div class="risk-list">
            <div v-for="item in risks" :key="item.label" :class="['risk-row', item.tone]">
              <div>
                <strong>{{ item.label }}</strong>
                <span>{{ item.desc }}</span>
              </div>
              <b>{{ item.count }}</b>
            </div>
          </div>
        </article>
      </section>
      </n-spin>
    </template>
  </div>
</template>

<script setup>
import { NButton, NIcon, NSelect, NSpin, createDiscreteApi } from 'naive-ui'
import {
  ArrowBackOutline,
  BarChartOutline,
  CashOutline,
  LockClosedOutline,
  PieChartOutline,
  ReceiptOutline,
  RefreshOutline,
  StatsChartOutline,
  TrendingUpOutline,
  WalletOutline,
} from '@vicons/ionicons5'
import { computed, onMounted, ref, watch } from 'vue'
import {
  formatInteger,
  formatMoney,
  normalizeAdminOrderStatus,
} from '~/composables/orderAdmin.mjs'
import { fetchAdminOrderDashboard } from '~/composables/adminOrderApi'

definePageMeta({
  middleware: 'auth',
})

useHead({ title: '订单看板 - 后台' })

const { message } = createDiscreteApi(['message'])
const { hasAnyPermission } = usePermission()

const canAccessPage = computed(() => hasAnyPermission('order:dashboard', 'order:list', 'order:manage', '*', '*:*:*'))

const range = ref('7d')
const lastUpdated = ref('-')
const loading = ref(false)
const dashboard = ref(createEmptyDashboard())

const rangeOptions = [
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
  { label: '本月', value: 'month' },
  { label: '本季度', value: 'quarter' },
]

const rangeLabel = computed(() => rangeOptions.find(item => item.value === range.value)?.label || '近7天')

const iconMap = {
  cash: CashOutline,
  receipt: ReceiptOutline,
  trend: TrendingUpOutline,
  wallet: WalletOutline,
  bar: BarChartOutline,
  stats: StatsChartOutline,
}

const metrics = computed(() => dashboard.value.metrics.map((item) => ({
  ...item,
  icon: iconMap[item.iconName],
})))

const dailyRevenue = computed(() => dashboard.value.dailyRevenue)
const paymentMix = computed(() => dashboard.value.paymentMix)

const paymentMixGradient = computed(() => {
  if (!paymentMix.value.length) {
    return 'conic-gradient(#e5e7eb 0% 100%)'
  }
  let start = 0
  const parts = paymentMix.value.map((item) => {
    const end = start + item.value
    const segment = `${item.color} ${start}% ${end}%`
    start = end
    return segment
  })
  return `conic-gradient(${parts.join(', ')})`
})

const funnel = computed(() => dashboard.value.funnel)
const pointsSources = computed(() => dashboard.value.pointsSources)
const topProducts = computed(() => dashboard.value.topProducts)
const risks = computed(() => dashboard.value.risks)

onMounted(() => {
  if (canAccessPage.value) {
    refreshDashboard(false)
  }
})

watch(range, () => {
  if (canAccessPage.value) {
    refreshDashboard(false)
  }
})

async function refreshDashboard(showToast = true) {
  loading.value = true
  try {
    const data = await fetchAdminOrderDashboard({ range: range.value })
    dashboard.value = mapDashboard(data)
    if (showToast) {
      message.success('看板已刷新')
    }
  } catch (error) {
    message.error(error?.message || '订单看板加载失败')
  } finally {
    loading.value = false
  }
  const now = new Date()
  lastUpdated.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function createEmptyDashboard() {
  return {
    metrics: [
      { label: '区间流水', value: '¥0', change: '0%', changeType: 'flat', note: '按支付时间', tone: 'green', iconName: 'cash' },
      { label: '支付成功订单', value: '0', change: '0 笔', changeType: 'flat', note: '支付成功', tone: 'blue', iconName: 'receipt' },
      { label: '支付转化率', value: '0%', change: '0 笔', changeType: 'flat', note: '订单支付成功率', tone: 'purple', iconName: 'trend' },
      { label: '积分抵扣', value: '¥0', change: '0%', changeType: 'flat', note: '抵扣金额占比', tone: 'amber', iconName: 'wallet' },
      { label: '待支付金额', value: '¥0', change: '0 笔', changeType: 'flat', note: '待用户完成支付', tone: 'red', iconName: 'bar' },
      { label: '待处理订单', value: '0', change: '0 笔', changeType: 'flat', note: '超时未关闭', tone: 'slate', iconName: 'stats' },
    ],
    statusCards: [
      { label: '已支付', value: 0, tone: 'success' },
      { label: '待支付', value: 0, tone: 'warning' },
      { label: '已取消', value: 0, tone: 'default' },
      { label: '已关闭', value: 0, tone: 'default' },
    ],
    dailyRevenue: [],
    paymentMix: [],
    paymentMixTotal: 0,
    funnel: [],
    pointsSummary: {
      deductAmount: '¥0',
      usedPoints: '0',
      usageRate: '0%',
    },
    pointsSources: [],
    topProducts: [],
    risks: [],
  }
}

function mapDashboard(data = {}) {
  const summary = data.summary || {}
  const revenueRows = data.revenueTrend?.rows || []
  const paymentRows = data.paymentMix?.rows || []
  const funnelRows = data.funnel?.rows || []
  const points = data.points || {}
  const rankings = data.rankings || {}
  const paidAmount = Number(summary.paidAmount || 0)
  const pointsDeductAmount = Number(summary.pointsDeductAmount || 0)
  const totalContribution = paidAmount + pointsDeductAmount

  return {
    metrics: [
      { label: `${rangeLabel.value}流水`, value: `¥${formatMoney(paidAmount)}`, change: `${summary.totalOrderCount || 0} 笔`, changeType: 'flat', note: `按${rangeLabel.value}支付时间`, tone: 'green', iconName: 'cash' },
      { label: '支付成功订单', value: `${summary.paidOrderCount || 0}`, change: `${summary.totalOrderCount || 0} 总订单`, changeType: 'flat', note: '支付成功', tone: 'blue', iconName: 'receipt' },
      { label: '支付转化率', value: `${formatRate(summary.paidRate)}%`, change: `${summary.pendingOrderCount || 0} 待支付`, changeType: 'flat', note: '订单支付成功率', tone: 'purple', iconName: 'trend' },
      { label: '积分抵扣', value: `¥${formatMoney(pointsDeductAmount)}`, change: `${formatRate(percent(pointsDeductAmount, totalContribution))}%`, changeType: 'flat', note: '抵扣金额占比', tone: 'amber', iconName: 'wallet' },
      { label: '待支付金额', value: `¥${formatMoney(summary.pendingAmount)}`, change: `${summary.pendingOrderCount || 0} 笔`, changeType: 'flat', note: '待用户完成支付', tone: 'red', iconName: 'bar' },
      { label: '待处理订单', value: `${summary.pendingRiskCount || 0}`, change: `${summary.pendingRiskCount || 0} 笔`, changeType: 'flat', note: '超时未关闭', tone: 'slate', iconName: 'stats' },
    ],
    statusCards: mapStatusCards(summary.statusCards || []),
    dailyRevenue: mapRevenueRows(revenueRows),
    paymentMix: mapPaymentMix(paymentRows),
    paymentMixTotal: data.paymentMix?.totalCount || 0,
    funnel: funnelRows.map(row => ({
      label: row.stageName || row.stage,
      count: row.count || 0,
      rate: Number(row.rate || 0),
    })),
    pointsSummary: {
      deductAmount: `¥${formatMoney(points.deductAmount)}`,
      usedPoints: formatInteger(points.usedPoints || 0),
      usageRate: `${formatRate(points.usageRate)}%`,
    },
    pointsSources: (points.sources || []).map(row => ({
      label: row.productTypeName || '未知商品',
      rate: Number(row.rate || 0),
      value: formatInteger(row.usedPoints || 0),
      color: productTypeColor(row.productType),
    })),
    topProducts: (rankings.topProducts || []).map((row, index) => ({
      rank: index + 1,
      name: row.productName || '未知商品',
      orders: row.orderCount || 0,
      points: formatMoney(row.pointsDeductAmount || 0),
      amount: formatMoney(row.paidAmount || 0),
    })),
    risks: (rankings.risks || []).map(row => ({
      label: row.riskName || row.riskType,
      desc: row.description || '-',
      count: row.count || 0,
      tone: riskTone(row.riskType),
    })),
  }
}

function mapStatusCards(cards) {
  const toneMap = {
    PAID: 'success',
    PENDING: 'warning',
    CANCELED: 'default',
    CLOSED: 'default',
  }
  const rows = cards.map((item) => {
    const status = normalizeAdminOrderStatus(item.status)
    return {
      label: item.statusName || status,
      value: item.count || 0,
      tone: toneMap[status] || 'default',
    }
  })
  return rows.length ? rows : createEmptyDashboard().statusCards
}

function mapRevenueRows(rows) {
  const maxTotal = Math.max(...rows.map(item => Number(item.cashAmount || 0) + Number(item.pointsDeductAmount || 0)), 1)
  const maxPending = Math.max(...rows.map(item => Number(item.pendingAmount || 0)), 1)
  return rows.map(item => ({
    day: String(item.day || '').slice(5) || item.day,
    cash: Number(item.cashAmount || 0),
    points: Number(item.pointsDeductAmount || 0),
    pending: Number(item.pendingAmount || 0),
    cashHeight: Math.max(4, Math.round((Number(item.cashAmount || 0) / maxTotal) * 88)),
    pointsHeight: Math.round((Number(item.pointsDeductAmount || 0) / maxTotal) * 88),
    pendingHeight: Math.max(8, Math.round((Number(item.pendingAmount || 0) / maxPending) * 82)),
  }))
}

function mapPaymentMix(rows) {
  return rows.map(item => ({
    label: item.payTypeName || item.payType || '未知渠道',
    value: Number(item.rate || 0),
    count: item.count || 0,
    color: payTypeColor(item.payType),
  })).filter(item => item.count > 0)
}

function percent(value, total) {
  if (!total) return 0
  return (Number(value || 0) / Number(total || 0)) * 100
}

function formatRate(value) {
  return Number(value || 0).toFixed(1).replace(/\.0$/, '')
}

function payTypeColor(payType) {
  const colors = {
    1: '#16a34a',
    2: '#2563eb',
    5: '#94a3b8',
    WECHAT: '#16a34a',
    ALIPAY: '#2563eb',
    FREE: '#94a3b8',
  }
  return colors[payType] || '#64748b'
}

function productTypeColor(productType) {
  const colors = {
    1: '#2563eb',
    2: '#f59e0b',
    3: '#7c3aed',
    4: '#ef4444',
    5: '#16a34a',
    6: '#0f766e',
    7: '#4f46e5',
  }
  return colors[productType] || '#64748b'
}

function riskTone(riskType) {
  if (riskType === 'amount_mismatch') return 'danger'
  if (riskType === 'timeout_pending') return 'warning'
  return 'info'
}
</script>

<style scoped>
.order-admin-page {
  color: #0f172a;
}

.forbidden-panel {
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.forbidden-panel h1,
.forbidden-panel p {
  margin: 0;
}

.forbidden-panel p {
  color: #64748b;
}

.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.title-block,
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-block h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.25;
}

.title-block p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.range-select {
  width: 120px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.status-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.status-card span {
  color: #64748b;
  font-size: 13px;
}

.status-card strong {
  font-size: 22px;
}

.status-card.success { border-color: #bbf7d0; background: #f0fdf4; }
.status-card.warning { border-color: #fde68a; background: #fffbeb; }
.status-card.default { border-color: #e2e8f0; background: #f8fafc; }
.status-card.danger { border-color: #fecaca; background: #fef2f2; }

.metric-card,
.panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.metric-card {
  padding: 14px;
  min-height: 128px;
}

.metric-head,
.metric-foot,
.panel-head,
.chart-legend,
.ranking-row,
.risk-row,
.source-row,
.funnel-label {
  display: flex;
  align-items: center;
}

.metric-head {
  justify-content: space-between;
  color: #64748b;
  font-size: 13px;
}

.metric-icon {
  width: 28px;
  height: 28px;
  padding: 6px;
  border-radius: 8px;
}

.metric-icon.green { background: #dcfce7; color: #16a34a; }
.metric-icon.blue { background: #dbeafe; color: #2563eb; }
.metric-icon.purple { background: #ede9fe; color: #7c3aed; }
.metric-icon.amber { background: #fef3c7; color: #d97706; }
.metric-icon.red { background: #fee2e2; color: #dc2626; }
.metric-icon.slate { background: #f1f5f9; color: #475569; }

.metric-card strong {
  display: block;
  margin-top: 14px;
  font-size: 24px;
  line-height: 1;
}

.metric-foot {
  gap: 8px;
  margin-top: 12px;
  color: #94a3b8;
  font-size: 12px;
}

.metric-change {
  font-weight: 700;
}

.metric-change.up { color: #16a34a; }
.metric-change.down { color: #dc2626; }
.metric-change.flat { color: #2563eb; }

.dashboard-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(340px, 0.85fr);
  gap: 16px;
  margin-bottom: 16px;
}

.dashboard-layout.lower {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.panel {
  padding: 16px;
  min-width: 0;
}

.panel-head {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-head.compact {
  align-items: flex-start;
}

.panel-head h2 {
  margin: 0;
  font-size: 16px;
}

.panel-head p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
}

.chart-legend {
  gap: 12px;
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}

.legend {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 2px;
  margin-right: 5px;
}

.legend.cash { background: #2563eb; }
.legend.points { background: #16a34a; }
.legend.pending { background: #ef4444; }

.combo-chart {
  height: 280px;
  display: grid;
  grid-template-columns: repeat(7, minmax(54px, 1fr));
  align-items: end;
  gap: 14px;
  padding: 12px 4px 0;
  border-top: 1px solid #f1f5f9;
}

.chart-day {
  height: 100%;
  display: grid;
  grid-template-rows: 1fr 20px;
  gap: 8px;
  justify-items: center;
}

.bar-stack {
  position: relative;
  width: 100%;
  max-width: 42px;
  height: 100%;
  display: flex;
  flex-direction: column-reverse;
  align-items: stretch;
  justify-content: flex-start;
  border-radius: 8px 8px 4px 4px;
  background: #f8fafc;
  overflow: hidden;
}

.bar {
  width: 100%;
}

.bar.cash { background: linear-gradient(180deg, #60a5fa, #2563eb); }
.bar.points { background: linear-gradient(180deg, #86efac, #16a34a); }

.pending-line {
  position: absolute;
  left: -4px;
  right: -4px;
  height: 3px;
  background: #ef4444;
  border-radius: 999px;
}

.chart-day span {
  color: #64748b;
  font-size: 12px;
}

.donut-wrap {
  display: grid;
  grid-template-columns: 180px 1fr;
  align-items: center;
  gap: 18px;
  min-height: 280px;
}

.donut {
  width: 178px;
  height: 178px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.donut::after {
  content: "";
  position: absolute;
  inset: 24px;
  background: #fff;
  border-radius: 50%;
}

.donut span,
.donut small {
  position: relative;
  z-index: 1;
}

.donut span {
  font-size: 28px;
  font-weight: 800;
}

.donut small {
  color: #64748b;
}

.legend-list {
  display: grid;
  gap: 12px;
}

.legend-list div {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 13px;
}

.legend-list i {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.funnel-list,
.source-list,
.ranking-list,
.risk-list {
  display: grid;
  gap: 12px;
}

.funnel-row {
  display: grid;
  grid-template-columns: 130px 1fr 48px;
  align-items: center;
  gap: 12px;
}

.funnel-label {
  justify-content: space-between;
  gap: 8px;
  color: #475569;
  font-size: 13px;
}

.funnel-bar,
.source-bar {
  height: 10px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.funnel-bar i,
.source-bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
}

.funnel-bar i {
  background: linear-gradient(90deg, #2563eb, #16a34a);
}

.funnel-rate {
  color: #64748b;
  font-size: 12px;
  text-align: right;
}

.points-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.points-summary div {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.points-summary span,
.points-summary strong {
  display: block;
}

.points-summary span {
  color: #64748b;
  font-size: 12px;
}

.points-summary strong {
  margin-top: 6px;
  font-size: 18px;
}

.source-row {
  display: grid;
  grid-template-columns: 86px 1fr 78px;
  gap: 12px;
  color: #475569;
  font-size: 13px;
}

.source-row strong {
  text-align: right;
  color: #0f172a;
}

.insight-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

.ranking-row {
  gap: 12px;
  padding: 10px;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
}

.ranking-row > span {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 700;
}

.ranking-row div {
  flex: 1;
  min-width: 0;
}

.ranking-row strong,
.ranking-row small {
  display: block;
}

.ranking-row strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ranking-row small {
  color: #64748b;
  font-size: 12px;
}

.ranking-row b {
  color: #2563eb;
}

.risk-row {
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.risk-row strong,
.risk-row span {
  display: block;
}

.risk-row span {
  color: #64748b;
  font-size: 12px;
}

.risk-row.danger { background: #fef2f2; border-color: #fecaca; }
.risk-row.warning { background: #fffbeb; border-color: #fde68a; }
.risk-row.info { background: #eff6ff; border-color: #bfdbfe; }

@media (max-width: 1200px) {
  .metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .status-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-layout,
  .dashboard-layout.lower,
  .insight-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-toolbar,
  .toolbar-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .title-block {
    align-items: flex-start;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .combo-chart {
    overflow-x: auto;
  }

  .donut-wrap,
  .points-summary {
    grid-template-columns: 1fr;
  }
}
</style>
