<template>
  <div class="order-admin-page">
    <section v-if="!canAccessPage" class="forbidden-panel">
      <n-icon :size="28"><LockClosedOutline /></n-icon>
      <h1>订单管理</h1>
      <p>当前账号暂无订单管理权限</p>
      <n-button @click="navigateTo('/')">返回首页</n-button>
    </section>

    <template v-else>
      <section class="page-toolbar">
        <div class="title-block">
          <n-button quaternary circle title="返回看板" @click="navigateTo('/admin/order-dashboard')">
            <template #icon>
              <n-icon><ArrowBackOutline /></n-icon>
            </template>
          </n-button>
          <div>
            <h1>订单管理</h1>
            <p>{{ pagination.itemCount }} 笔订单 · 当前页实收 ¥{{ totalCashAmount }}</p>
          </div>
        </div>
        <div class="toolbar-actions">
          <n-button secondary @click="navigateTo('/admin/order-dashboard')">
            <template #icon>
              <n-icon><PieChartOutline /></n-icon>
            </template>
            订单看板
          </n-button>
          <n-button type="primary" @click="handleExport">
            <template #icon>
              <n-icon><DownloadOutline /></n-icon>
            </template>
            导出
          </n-button>
        </div>
      </section>

      <section class="filter-panel">
        <n-input
          v-model:value="query.keyword"
          clearable
          placeholder="订单号、商品、用户"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>
        <n-select v-model:value="query.status" clearable placeholder="订单状态" :options="statusOptions" />
        <n-select v-model:value="query.productType" clearable placeholder="商品类型" :options="productTypeOptions" />
        <n-select v-model:value="query.payType" clearable placeholder="支付方式" :options="payTypeOptions" />
        <n-date-picker v-model:value="query.dateRange" type="daterange" clearable />
        <n-button type="primary" @click="handleSearch">
          <template #icon>
            <n-icon><FunnelOutline /></n-icon>
          </template>
          查询
        </n-button>
        <n-button @click="resetQuery">
          <template #icon>
            <n-icon><CloseOutline /></n-icon>
          </template>
          重置
        </n-button>
      </section>

      <section class="summary-strip">
        <div v-for="item in summaryItems" :key="item.label">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </section>

      <section class="table-panel">
        <n-data-table
          :columns="columns"
          :data="pagedOrders"
          :loading="loading"
          :pagination="pagination"
          :row-key="row => row.orderNo"
          :scroll-x="1320"
          :bordered="false"
          remote
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </section>

      <n-drawer v-model:show="detailVisible" :width="520" placement="right">
        <n-drawer-content title="订单详情" closable>
          <div v-if="selectedOrder" class="detail-body">
            <section>
              <h3>基础信息</h3>
              <div class="detail-row"><span>订单号</span><strong>{{ selectedOrder.orderNo }}</strong></div>
              <div class="detail-row"><span>商品</span><strong>{{ selectedOrder.productName }}</strong></div>
              <div class="detail-row"><span>用户</span><strong>{{ selectedOrder.userName }}</strong></div>
              <div class="detail-row"><span>状态</span><n-tag :type="statusMap[selectedOrder.status]?.type" size="small" bordered>{{ selectedOrder.statusName || statusMap[selectedOrder.status]?.label }}</n-tag></div>
            </section>
            <section>
              <h3>金额与积分</h3>
              <div class="detail-row"><span>原价</span><strong>¥{{ formatMoney(selectedOrder.originalAmount) }}</strong></div>
              <div class="detail-row"><span>实收</span><strong>¥{{ formatMoney(selectedOrder.cashAmount) }}</strong></div>
              <div class="detail-row"><span>积分消耗</span><strong>{{ selectedOrder.pointsAmount ? selectedOrder.pointsAmount.toLocaleString() : '-' }}</strong></div>
              <div class="detail-row"><span>积分抵扣</span><strong>¥{{ formatMoney(selectedOrder.pointsDeductAmount) }}</strong></div>
            </section>
            <section>
              <h3>支付与履约</h3>
              <div class="detail-row"><span>支付方式</span><strong>{{ selectedOrder.payTypeName || payTypeMap[selectedOrder.payType] }}</strong></div>
              <div class="detail-row"><span>创建时间</span><strong>{{ selectedOrder.createdTime }}</strong></div>
              <div class="detail-row"><span>支付时间</span><strong>{{ selectedOrder.paidTime || '-' }}</strong></div>
              <div class="detail-row"><span>履约状态</span><strong>{{ fulfillmentStatusMap[selectedOrder.fulfillmentStatus] }}</strong></div>
            </section>
            <section v-if="selectedOrder.payments?.length">
              <h3>支付流水</h3>
              <div v-for="payment in selectedOrder.payments" :key="payment.paymentNo || payment.orderNo" class="detail-row">
                <span>{{ payment.channelName || '支付渠道' }}</span>
                <strong>{{ payment.statusName || '-' }} · ¥{{ formatMoney(payment.amount) }}</strong>
              </div>
            </section>
          </div>
        </n-drawer-content>
      </n-drawer>
    </template>
  </div>
</template>

<script setup>
import {
  NButton,
  NDataTable,
  NDatePicker,
  NDrawer,
  NDrawerContent,
  NDropdown,
  NEllipsis,
  NIcon,
  NInput,
  NSelect,
  NTag,
  createDiscreteApi,
} from 'naive-ui'
import {
  ArrowBackOutline,
  CloseOutline,
  DownloadOutline,
  EyeOutline,
  FunnelOutline,
  LockClosedOutline,
  PieChartOutline,
  SearchOutline,
} from '@vicons/ionicons5'
import { computed, h, onMounted, reactive, ref } from 'vue'
import {
  ADMIN_ORDER_PAY_TYPE_MAP,
  ADMIN_ORDER_PAY_TYPE_OPTIONS,
  ADMIN_ORDER_PRODUCT_TYPE_MAP,
  ADMIN_ORDER_PRODUCT_TYPE_OPTIONS,
  ADMIN_ORDER_STATUS_MAP,
  ADMIN_ORDER_STATUS_OPTIONS,
  formatMoney,
  getAdminOrderActionOptions,
} from '~/composables/orderAdmin.mjs'
import {
  closeAdminOrder,
  fetchAdminOrderDetail,
  fetchAdminOrderPage,
  fetchAdminOrderPayment,
  retryAdminOrderFulfillment,
} from '~/composables/adminOrderApi'

definePageMeta({
  middleware: 'auth',
})

useHead({ title: '订单管理 - 后台' })

const { message } = createDiscreteApi(['message'])
const { hasAnyPermission } = usePermission()
const canAccessPage = computed(() => hasAnyPermission('order:list', 'order:manage', '*', '*:*:*'))
const orders = ref([])
const selectedOrder = ref(null)
const detailVisible = ref(false)

const query = reactive({
  keyword: '',
  status: null,
  productType: null,
  payType: null,
  dateRange: null,
})

const loading = ref(false)
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [
    { label: '10条/页', value: 10 },
    { label: '20条/页', value: 20 },
    { label: '50条/页', value: 50 },
  ],
  prefix({ itemCount }) {
    return `共 ${itemCount} 条`
  },
})

const statusOptions = ADMIN_ORDER_STATUS_OPTIONS
const productTypeOptions = ADMIN_ORDER_PRODUCT_TYPE_OPTIONS
const payTypeOptions = ADMIN_ORDER_PAY_TYPE_OPTIONS
const statusMap = ADMIN_ORDER_STATUS_MAP
const productTypeMap = ADMIN_ORDER_PRODUCT_TYPE_MAP
const payTypeMap = ADMIN_ORDER_PAY_TYPE_MAP
const fulfillmentStatusMap = {
  FULFILLED: '已履约',
  FAILED: '履约失败',
  NONE: '未触发',
  undefined: '-',
}

const pagedOrders = computed(() => orders.value)
const totalCashAmount = computed(() => formatMoney(orders.value.reduce((total, item) => {
  return total + (item.status === 'PAID' ? Number(item.cashAmount || 0) : 0)
}, 0)))
const summaryItems = computed(() => [
  { label: '支付成功', value: `${orders.value.filter((item) => item.status === 'PAID').length} 笔` },
  { label: '实收金额', value: `¥${totalCashAmount.value}` },
  { label: '积分消耗', value: orders.value.reduce((total, item) => total + Number(item.pointsAmount || 0), 0).toLocaleString() },
  { label: '待支付订单', value: `${orders.value.filter((item) => item.status === 'PENDING').length} 笔` },
])

const columns = [
  {
    title: '订单',
    key: 'orderNo',
    width: 220,
    fixed: 'left',
    render(row) {
      return h('div', { class: 'order-cell' }, [
        h('strong', row.orderNo),
        h('span', row.createdTime),
      ])
    },
  },
  {
    title: '商品',
    key: 'productName',
    minWidth: 260,
    render(row) {
      return h('div', { class: 'product-cell' }, [
        h(NEllipsis, { lineClamp: 1 }, { default: () => row.productName }),
        h('span', row.productTypeName || productTypeMap[row.productType] || row.productType),
      ])
    },
  },
  {
    title: '用户',
    key: 'userName',
    width: 120,
  },
  {
    title: '金额',
    key: 'amount',
    width: 180,
    render(row) {
      return h('div', { class: 'amount-cell' }, [
        h('strong', `¥${formatMoney(row.cashAmount)}`),
        h('span', `原价 ¥${formatMoney(row.originalAmount)}`),
      ])
    },
  },
  {
    title: '积分',
    key: 'pointsAmount',
    width: 170,
    render(row) {
      return h('div', { class: 'points-cell' }, [
        h('strong', row.pointsAmount ? row.pointsAmount.toLocaleString() : '-'),
        h('span', row.pointsDeductAmount ? `抵扣 ¥${formatMoney(row.pointsDeductAmount)}` : '未使用积分'),
      ])
    },
  },
  {
    title: '支付方式',
    key: 'payType',
    width: 120,
    render(row) {
      return h('span', row.payTypeName || payTypeMap[row.payType] || row.payType)
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 110,
    render(row) {
      const status = statusMap[row.status] || { label: row.statusName || row.status, type: 'default' }
      return h(NTag, { type: status.type, bordered: false, size: 'small' }, { default: () => row.statusName || status.label })
    },
  },
  {
    title: '支付时间',
    key: 'paidTime',
    width: 160,
    render(row) {
      return h('span', { class: 'muted-text' }, row.paidTime || '-')
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 128,
    fixed: 'right',
    render(row) {
      return h('div', { class: 'action-cell' }, [
        h(NButton, {
          size: 'small',
          secondary: true,
          onClick: () => showDetail(row),
        }, {
          icon: () => h(NIcon, null, { default: () => h(EyeOutline) }),
          default: () => '详情',
        }),
        h(NDropdown, {
          trigger: 'click',
          options: getActionOptions(row),
          onSelect: key => handleAction(key, row),
        }, {
          default: () => h(NButton, { size: 'small', quaternary: true }, { default: () => '更多' }),
        }),
      ])
    },
  },
]

onMounted(() => {
  if (canAccessPage.value) {
    loadOrders()
  }
})

async function loadOrders() {
  loading.value = true
  try {
    const result = await fetchAdminOrderPage(buildPageQuery())
    orders.value = result.rows
    pagination.itemCount = result.total
  } finally {
    loading.value = false
  }
}

function buildPageQuery() {
  const dateQuery = {}
  if (query.dateRange?.length === 2) {
    dateQuery.beginTime = formatDateTime(query.dateRange[0], false)
    dateQuery.endTime = formatDateTime(query.dateRange[1], true)
  }
  return {
    keyword: query.keyword,
    status: query.status,
    productType: query.productType,
    payType: query.payType,
    pageNum: pagination.page,
    pageSize: pagination.pageSize,
    ...dateQuery,
  }
}

function handleSearch() {
  pagination.page = 1
  loadOrders()
}

function resetQuery() {
  query.keyword = ''
  query.status = null
  query.productType = null
  query.payType = null
  query.dateRange = null
  handleSearch()
}

function handlePageChange(page) {
  pagination.page = page
  loadOrders()
}

function handlePageSizeChange(pageSize) {
  pagination.pageSize = pageSize
  pagination.page = 1
  loadOrders()
}

function handleExport() {
  message.info('导出接口本轮后端尚未实现，当前先使用列表查询')
}

async function showDetail(row) {
  selectedOrder.value = row
  detailVisible.value = true
  const result = await fetchAdminOrderDetail(row.orderNo)
  if (result.data) {
    selectedOrder.value = {
      ...row,
      ...result.data,
      payments: result.data.payments || [],
    }
  }
}

function getActionOptions(row) {
  return getAdminOrderActionOptions(row)
}

async function handleAction(key, row) {
  if (key === 'copy') {
    if (navigator?.clipboard) {
      await navigator.clipboard.writeText(row.orderNo)
    }
    message.success('订单号已复制')
    return
  }

  const actionText = {
    payment: '打开支付流水',
    close: '关闭订单',
    fulfill: '重新履约',
  }[key] || '处理订单'

  if (key === 'payment') {
    const result = await fetchAdminOrderPayment(row.orderNo)
    if (result.data) {
      selectedOrder.value = {
        ...row,
        payments: [result.data],
      }
      detailVisible.value = true
    }
    return
  }

  if (key === 'close') {
    await closeAdminOrder(row.orderNo)
    message.success(`已关闭订单: ${row.orderNo}`)
    await loadOrders()
    return
  }

  if (key === 'fulfill') {
    await retryAdminOrderFulfillment(row.orderNo)
    message.success(`已重新触发履约: ${row.orderNo}`)
    await loadOrders()
    return
  }

  message.info(`${actionText}: ${row.orderNo}`)
}

function formatDateTime(timestamp, endOfDay) {
  const date = new Date(timestamp)
  if (endOfDay) {
    date.setHours(23, 59, 59, 999)
  } else {
    date.setHours(0, 0, 0, 0)
  }
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
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
.toolbar-actions,
.action-cell {
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

.filter-panel,
.summary-strip,
.table-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.filter-panel {
  display: grid;
  grid-template-columns: minmax(220px, 1.3fr) minmax(130px, 0.8fr) minmax(130px, 0.8fr) minmax(130px, 0.8fr) minmax(250px, 1fr) auto auto;
  gap: 10px;
  padding: 14px;
  margin-bottom: 12px;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  margin-bottom: 12px;
  overflow: hidden;
}

.summary-strip div {
  padding: 14px 16px;
  background: #fff;
}

.summary-strip span,
.summary-strip strong {
  display: block;
}

.summary-strip span {
  color: #64748b;
  font-size: 12px;
}

.summary-strip strong {
  margin-top: 4px;
  font-size: 20px;
}

.table-panel {
  padding: 8px;
}

.detail-body {
  display: grid;
  gap: 18px;
}

.detail-body section {
  display: grid;
  gap: 10px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.detail-body section:last-child {
  border-bottom: none;
}

.detail-body h3 {
  margin: 0;
  font-size: 15px;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.detail-row span {
  color: #64748b;
}

.detail-row strong {
  text-align: right;
}

:deep(.order-cell),
:deep(.product-cell),
:deep(.amount-cell),
:deep(.points-cell) {
  display: grid;
  gap: 3px;
}

:deep(.order-cell strong) {
  font-family: var(--font-mono);
  font-size: 12px;
}

:deep(.order-cell span),
:deep(.product-cell span),
:deep(.amount-cell span),
:deep(.points-cell span),
:deep(.muted-text) {
  color: #64748b;
  font-size: 12px;
}

:deep(.product-cell) {
  min-width: 0;
}

:deep(.product-cell .n-ellipsis) {
  font-weight: 600;
}

:deep(.amount-cell strong) {
  color: #2563eb;
}

:deep(.points-cell strong) {
  color: #d97706;
}

@media (max-width: 1200px) {
  .filter-panel {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page-toolbar,
  .toolbar-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .filter-panel,
  .summary-strip {
    grid-template-columns: 1fr;
  }
}
</style>
