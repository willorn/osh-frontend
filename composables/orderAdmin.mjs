export const ADMIN_ORDER_STATUS_OPTIONS = [
  { label: '待支付', value: 'PENDING' },
  { label: '已支付', value: 'PAID' },
  { label: '已取消', value: 'CANCELED' },
  { label: '已关闭', value: 'CLOSED' },
]

export const ADMIN_ORDER_PRODUCT_TYPE_OPTIONS = [
  { label: '课程', value: 'COURSE' },
  { label: '电子书', value: 'BOOK' },
  { label: '专栏', value: 'COLUMN' },
  { label: '工具套餐', value: 'TOOL' },
  { label: '拼团', value: 'GROUP' },
  { label: '秒杀', value: 'SECKILL' },
  { label: '会员', value: 'MEMBER' },
]

export const ADMIN_ORDER_PAY_TYPE_OPTIONS = [
  { label: '微信支付', value: 'WECHAT' },
  { label: '支付宝', value: 'ALIPAY' },
  { label: '免费订单', value: 'FREE' },
]

export const ADMIN_ORDER_STATUS_MAP = {
  PENDING: { label: '待支付', type: 'warning' },
  PAID: { label: '已支付', type: 'success' },
  CANCELED: { label: '已取消', type: 'default' },
  CLOSED: { label: '已关闭', type: 'default' },
  FULFILL_FAILED: { label: '履约异常', type: 'error' },
}

export const ADMIN_ORDER_STATUS_CODE_MAP = {
  0: 'PENDING',
  1: 'PAID',
  2: 'CANCELED',
  3: 'CLOSED',
}

export const ADMIN_ORDER_STATUS_VALUE_MAP = {
  PENDING: 0,
  PAID: 1,
  CANCELED: 2,
  CLOSED: 3,
}

export const ADMIN_ORDER_PRODUCT_TYPE_CODE_MAP = {
  1: 'COURSE',
  2: 'BOOK',
  3: 'COLUMN',
  4: 'SECKILL',
  5: 'TOOL',
  6: 'GROUP',
  7: 'MEMBER',
}

export const ADMIN_ORDER_PRODUCT_TYPE_VALUE_MAP = {
  COURSE: 1,
  BOOK: 2,
  COLUMN: 3,
  SECKILL: 4,
  TOOL: 5,
  GROUP: 6,
  MEMBER: 7,
}

export const ADMIN_ORDER_PAY_TYPE_CODE_MAP = {
  1: 'WECHAT',
  2: 'ALIPAY',
  5: 'FREE',
}

export const ADMIN_ORDER_PAY_TYPE_VALUE_MAP = {
  WECHAT: 1,
  ALIPAY: 2,
  FREE: 5,
}

export const ADMIN_ORDER_PRODUCT_TYPE_MAP = Object.fromEntries(
  ADMIN_ORDER_PRODUCT_TYPE_OPTIONS.map((item) => [item.value, item.label]),
)

export const ADMIN_ORDER_PAY_TYPE_MAP = Object.fromEntries(
  ADMIN_ORDER_PAY_TYPE_OPTIONS.map((item) => [item.value, item.label]),
)

const BACKEND_APIS = [
  {
    method: 'GET',
    path: '/pc/admin/order/dashboard/summary',
    permission: 'order:dashboard',
    desc: '订单看板汇总指标，包含流水、订单数、积分抵扣、待支付和状态卡片。',
  },
  {
    method: 'GET',
    path: '/pc/admin/order/dashboard/revenue-trend',
    permission: 'order:dashboard',
    desc: '每日流水趋势，包含实收、积分抵扣和待支付金额。',
  },
  {
    method: 'GET',
    path: '/pc/admin/order/dashboard/payment-mix',
    permission: 'order:dashboard',
    desc: '支付渠道结构。',
  },
  {
    method: 'GET',
    path: '/pc/admin/order/dashboard/funnel',
    permission: 'order:dashboard',
    desc: '下单转化漏斗。',
  },
  {
    method: 'GET',
    path: '/pc/admin/order/dashboard/points',
    permission: 'order:dashboard',
    desc: '积分消费情况和来源。',
  },
  {
    method: 'GET',
    path: '/pc/admin/order/dashboard/rankings',
    permission: 'order:dashboard',
    desc: '商品贡献排行和待处理风险。',
  },
  {
    method: 'GET',
    path: '/pc/admin/order/page',
    permission: 'order:list',
    desc: '订单分页查询，支持关键词、状态、商品类型、支付方式、创建时间范围筛选。',
  },
  {
    method: 'GET',
    path: '/pc/admin/order/{orderNo}',
    permission: 'order:detail',
    desc: '订单详情，返回订单、支付流水、积分抵扣、履约记录和操作日志。',
  },
  {
    method: 'GET',
    path: '/pc/admin/order/{orderNo}/payment',
    permission: 'payment:detail',
    desc: '支付流水与回调记录，便于排查金额、签名和重复回调问题。',
  },
  {
    method: 'POST',
    path: '/pc/admin/order/{orderNo}/close',
    permission: 'order:close',
    desc: '关闭待支付订单，需要提交关闭原因。',
  },
  {
    method: 'POST',
    path: '/pc/admin/order/{orderNo}/fulfill/retry',
    permission: 'order:fulfill:retry',
    desc: '对支付成功但履约异常的订单重新触发权益发放。',
  },
  {
    method: 'GET',
    path: '/pc/admin/order/export',
    permission: 'order:export',
    desc: '按当前筛选条件导出订单明细。',
  },
]

export function getAdminOrderBackendApis() {
  return BACKEND_APIS.map((item) => ({ ...item }))
}

export function normalizeAdminOrderStatus(status) {
  if (status === null || status === undefined || status === '') return ''
  if (typeof status === 'number') return ADMIN_ORDER_STATUS_CODE_MAP[status] || String(status)
  const text = String(status).trim()
  if (/^\d+$/.test(text)) return ADMIN_ORDER_STATUS_CODE_MAP[Number(text)] || text
  return text.toUpperCase()
}

export function normalizeAdminOrderProductType(productType) {
  if (productType === null || productType === undefined || productType === '') return ''
  if (typeof productType === 'number') return ADMIN_ORDER_PRODUCT_TYPE_CODE_MAP[productType] || String(productType)
  const text = String(productType).trim()
  if (/^\d+$/.test(text)) return ADMIN_ORDER_PRODUCT_TYPE_CODE_MAP[Number(text)] || text
  return text.toUpperCase()
}

export function normalizeAdminOrderPayType(payType) {
  if (payType === null || payType === undefined || payType === '') return ''
  if (typeof payType === 'number') return ADMIN_ORDER_PAY_TYPE_CODE_MAP[payType] || String(payType)
  const text = String(payType).trim()
  if (/^\d+$/.test(text)) return ADMIN_ORDER_PAY_TYPE_CODE_MAP[Number(text)] || text
  const upper = text.toUpperCase()
  if (upper === 'WXPAY') return 'WECHAT'
  return upper
}

export function toBackendAdminOrderQuery(query = {}) {
  const result = {}
  Object.entries(query).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      result[key] = value
    }
  })
  if (result.status) {
    result.status = ADMIN_ORDER_STATUS_VALUE_MAP[result.status] ?? result.status
  }
  if (result.productType) {
    result.productType = ADMIN_ORDER_PRODUCT_TYPE_VALUE_MAP[result.productType] ?? result.productType
  }
  if (result.payType) {
    result.payChannel = ADMIN_ORDER_PAY_TYPE_VALUE_MAP[result.payType] ?? result.payType
    delete result.payType
  }
  return result
}

export function mapBackendAdminOrder(row = {}) {
  const status = normalizeAdminOrderStatus(row.status)
  const productType = normalizeAdminOrderProductType(row.productType)
  const payType = normalizeAdminOrderPayType(row.payType ?? row.payChannel ?? row.channel)
  return {
    ...row,
    userName: row.userName || row.username || row.nickname || '-',
    status,
    statusName: row.statusName || ADMIN_ORDER_STATUS_MAP[status]?.label || status || '-',
    productType,
    productTypeName: row.productTypeName || ADMIN_ORDER_PRODUCT_TYPE_MAP[productType] || productType || '-',
    payType,
    payTypeName: row.payTypeName || row.payChannelName || ADMIN_ORDER_PAY_TYPE_MAP[payType] || payType || '未支付',
    cashAmount: Number(row.cashAmount ?? row.payableAmount ?? row.paidAmount ?? 0),
    originalAmount: Number(row.originalAmount ?? row.payableAmount ?? 0),
    discountAmount: Number(row.discountAmount ?? 0),
    payableAmount: Number(row.payableAmount ?? row.cashAmount ?? 0),
    pointsAmount: Number(row.pointsAmount ?? row.usedPoints ?? 0),
    pointsDeductAmount: Number(row.pointsDeductAmount ?? row.deductAmount ?? 0),
  }
}

export function getMockAdminOrders() {
  return [
    createOrder('O202606110001', 'AI 编程实战课', 'COURSE', '张同学', 'PAID', 'CASH_POINTS', 299, 239, 6000, 60, '2026-06-11 14:28', '2026-06-11 14:30', 'FULFILLED'),
    createOrder('O202606110002', '开发者效率工具包', 'TOOL', '李同学', 'PAID', 'WECHAT', 199, 199, 0, 0, '2026-06-11 13:16', '2026-06-11 13:17', 'FULFILLED'),
    createOrder('O202606110003', '前端工程化电子书', 'BOOK', '王同学', 'PENDING', 'CASH_POINTS', 89, 69, 2000, 20, '2026-06-11 12:54', null, 'NONE'),
    createOrder('O202606110004', '服务器拼团专栏', 'GROUP', '赵同学', 'PAID', 'WECHAT', 159, 159, 0, 0, '2026-06-11 11:02', '2026-06-11 11:04', 'FULFILLED'),
    createOrder('O202606110005', '秒杀课程包', 'SECKILL', '陈同学', 'CLOSED', 'WECHAT', 49, 0, 0, 0, '2026-06-11 10:28', null, 'NONE'),
    createOrder('O202606100086', 'AI 面试专题课', 'COURSE', '刘同学', 'FULFILL_FAILED', 'CASH_POINTS', 199, 149, 5000, 50, '2026-06-10 21:12', '2026-06-10 21:14', 'FAILED'),
    createOrder('O202606100079', '工具调用次数包', 'TOOL', '周同学', 'PAID', 'POINTS', 39, 0, 3900, 39, '2026-06-10 19:42', '2026-06-10 19:42', 'FULFILLED'),
    createOrder('O202606100071', '架构师成长电子书', 'BOOK', '吴同学', 'CLOSED', 'FREE', 0, 0, 0, 0, '2026-06-10 18:20', null, 'NONE'),
    createOrder('O202606100064', 'Java 后端实战营', 'COURSE', '郑同学', 'PAID', 'WECHAT', 399, 399, 0, 0, '2026-06-10 16:03', '2026-06-10 16:05', 'FULFILLED'),
    createOrder('O202606100052', 'AI 编程实战课', 'COURSE', '孙同学', 'PAID', 'CASH_POINTS', 299, 259, 4000, 40, '2026-06-10 13:47', '2026-06-10 13:49', 'FULFILLED'),
    createOrder('O202606090041', '服务器拼团专栏', 'GROUP', '钱同学', 'PAID', 'WECHAT', 159, 159, 0, 0, '2026-06-09 22:08', '2026-06-09 22:09', 'FULFILLED'),
    createOrder('O202606090039', '前端工程化电子书', 'BOOK', '何同学', 'PENDING', 'CASH_POINTS', 89, 79, 1000, 10, '2026-06-09 20:21', null, 'NONE'),
  ]
}

export function buildAdminOrderDashboard(orders) {
  const paidOrders = orders.filter((item) => item.status === 'PAID' || item.status === 'FULFILL_FAILED')
  const pendingOrders = orders.filter((item) => item.status === 'PENDING')
  const cashTotal = sumBy(paidOrders, 'cashAmount')
  const paidCount = paidOrders.length
  const pendingCashTotal = sumBy(pendingOrders, 'cashAmount')
  const pointsAmount = sumBy(orders, 'pointsAmount')
  const pointsDeductAmount = sumBy(orders, 'pointsDeductAmount')
  const checkoutCount = 884
  const paidRate = checkoutCount ? Math.round((paidCount / orders.length) * 1000) / 10 : 0
  const fulfilledCount = orders.filter((item) => item.fulfillmentStatus === 'FULFILLED').length
  const todayLabel = '今日'

  const paymentMix = buildPaymentMix(paidOrders)
  const dailyRevenue = buildDailyRevenue(orders)
  const risks = buildRisks(orders)

  return {
    metrics: [
      { label: '今日流水', value: `¥${formatMoney(cashTotal)}`, change: '+18.4%', changeType: 'up', note: `按${todayLabel}支付时间`, tone: 'green', iconName: 'cash' },
      { label: '支付订单', value: `${paidCount}`, change: '+9.7%', changeType: 'up', note: '支付成功', tone: 'blue', iconName: 'receipt' },
      { label: '支付转化率', value: `${paidRate}%`, change: '+3.2%', changeType: 'up', note: '订单支付成功率', tone: 'purple', iconName: 'trend' },
      { label: '积分抵扣', value: `¥${formatMoney(pointsDeductAmount)}`, change: `${getPercent(pointsDeductAmount, cashTotal + pointsDeductAmount)}%`, changeType: 'flat', note: '抵扣金额占比', tone: 'amber', iconName: 'wallet' },
      { label: '待支付金额', value: `¥${formatMoney(pendingCashTotal)}`, change: `${pendingOrders.length} 笔`, changeType: 'flat', note: '待用户完成支付', tone: 'red', iconName: 'bar' },
      { label: '待处理订单', value: `${risks.reduce((total, item) => total + item.count, 0)}`, change: `${risks[2]?.count || 0} 笔`, changeType: 'flat', note: '超时未支付', tone: 'slate', iconName: 'stats' },
    ],
    statusCards: [
      { label: '已支付', value: paidCount, tone: 'success' },
      { label: '待支付', value: pendingOrders.length, tone: 'warning' },
      { label: '已关闭', value: orders.filter((item) => item.status === 'CLOSED').length, tone: 'default' },
      { label: '履约异常', value: orders.filter((item) => item.status === 'FULFILL_FAILED').length, tone: 'danger' },
    ],
    dailyRevenue,
    paymentMix,
    paymentMixTotal: paidOrders.length,
    funnel: [
      { label: '进入结算', count: checkoutCount, rate: 100 },
      { label: '创建订单', count: 746, rate: 84 },
      { label: '拉起支付', count: 692, rate: 78 },
      { label: '支付成功', count: 642, rate: 73 },
      { label: '履约完成', count: fulfilledCount, rate: getPercent(fulfilledCount, paidCount) },
    ],
    pointsSummary: {
      deductAmount: `¥${formatMoney(pointsDeductAmount)}`,
      usedPoints: formatInteger(pointsAmount),
      usageRate: `${getPercent(orders.filter((item) => item.pointsAmount > 0).length, orders.length)}%`,
    },
    pointsSources: buildPointsSources(orders),
    topProducts: buildTopProducts(orders),
    risks,
  }
}

export function filterAdminOrders(orders, query = {}) {
  const keyword = String(query.keyword || '').trim().toLowerCase()
  return orders.filter((item) => {
    const matchesKeyword = !keyword
      || item.orderNo.toLowerCase().includes(keyword)
      || item.productName.toLowerCase().includes(keyword)
      || item.userName.toLowerCase().includes(keyword)
    const matchesStatus = !query.status || item.status === query.status
    const matchesProductType = !query.productType || item.productType === query.productType
    const matchesPayType = !query.payType || item.payType === query.payType
    const matchesDate = !query.dateRange || isInRange(item.createdTime, query.dateRange)
    return matchesKeyword && matchesStatus && matchesProductType && matchesPayType && matchesDate
  })
}

export function paginateAdminOrders(orders, pagination = {}) {
  const page = Math.max(1, Number(pagination.page || 1))
  const pageSize = Math.max(1, Number(pagination.pageSize || 10))
  const start = (page - 1) * pageSize
  return {
    rows: orders.slice(start, start + pageSize),
    total: orders.length,
  }
}

export function summarizeAdminOrders(orders) {
  return [
    { label: '支付成功', value: `${orders.filter((item) => item.status === 'PAID').length} 笔` },
    { label: '实收金额', value: `¥${formatMoney(sumBy(orders.filter((item) => item.status === 'PAID' || item.status === 'FULFILL_FAILED'), 'cashAmount'))}` },
    { label: '积分消耗', value: formatInteger(sumBy(orders, 'pointsAmount')) },
    { label: '待支付订单', value: `${orders.filter((item) => item.status === 'PENDING').length} 笔` },
  ]
}

export function getAdminOrderActionOptions(row) {
  const options = [
    { label: '复制订单号', key: 'copy' },
    { label: '查看支付流水', key: 'payment' },
  ]
  if (row.status === 'PENDING') {
    options.push({ label: '关闭订单', key: 'close' })
  }
  if (row.status === 'FULFILL_FAILED') {
    options.push({ label: '重新履约', key: 'fulfill' })
  }
  return options
}

export function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function formatInteger(value) {
  return Number(value || 0).toLocaleString()
}

function createOrder(orderNo, productName, productType, userName, status, payType, originalAmount, cashAmount, pointsAmount, pointsDeductAmount, createdTime, paidTime, fulfillmentStatus) {
  return {
    orderNo,
    productName,
    productType,
    userName,
    status,
    payType,
    originalAmount,
    cashAmount,
    pointsAmount,
    pointsDeductAmount,
    createdTime,
    paidTime,
    fulfillmentStatus,
  }
}

function buildPaymentMix(orders) {
  const colors = {
    WECHAT: '#16a34a',
    CASH_POINTS: '#2563eb',
    POINTS: '#f59e0b',
    FREE: '#94a3b8',
  }
  return ADMIN_ORDER_PAY_TYPE_OPTIONS.map((item) => {
    const count = orders.filter((order) => order.payType === item.value).length
    return {
      label: item.label,
      value: getPercent(count, orders.length),
      count,
      color: colors[item.value],
    }
  }).filter((item) => item.count > 0)
}

function buildDailyRevenue(orders) {
  const byDay = new Map()
  orders.forEach((item) => {
    const day = item.createdTime.slice(5, 10)
    if (!byDay.has(day)) {
      byDay.set(day, { day, cash: 0, points: 0, pending: 0 })
    }
    const row = byDay.get(day)
    if (item.status === 'PAID' || item.status === 'FULFILL_FAILED') {
      row.cash += item.cashAmount
      row.points += item.pointsDeductAmount
    }
    if (item.status === 'PENDING') {
      row.pending += item.cashAmount
    }
  })
  const rows = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day))
  const maxTotal = Math.max(...rows.map((item) => item.cash + item.points), 1)
  const maxPending = Math.max(...rows.map((item) => item.pending), 1)
  return rows.map((item) => ({
    ...item,
    cashLabel: `¥${formatMoney(item.cash)}`,
    pointsLabel: `¥${formatMoney(item.points)}`,
    pendingLabel: `¥${formatMoney(item.pending)}`,
    cashHeight: Math.round((item.cash / maxTotal) * 88),
    pointsHeight: Math.round((item.points / maxTotal) * 88),
    pendingHeight: Math.max(8, Math.round((item.pending / maxPending) * 82)),
  }))
}

function buildPointsSources(orders) {
  const colors = {
    COURSE: '#2563eb',
    TOOL: '#16a34a',
    BOOK: '#f59e0b',
    GROUP: '#7c3aed',
    SECKILL: '#ef4444',
  }
  const total = Math.max(sumBy(orders, 'pointsAmount'), 1)
  return ADMIN_ORDER_PRODUCT_TYPE_OPTIONS.map((type) => {
    const value = orders
      .filter((item) => item.productType === type.value)
      .reduce((sum, item) => sum + item.pointsAmount, 0)
    return {
      label: type.label,
      rate: getPercent(value, total),
      value: formatInteger(value),
      color: colors[type.value],
    }
  }).filter((item) => item.rate > 0)
}

function buildTopProducts(orders) {
  const bucket = new Map()
  orders.forEach((item) => {
    if (!bucket.has(item.productName)) {
      bucket.set(item.productName, {
        name: item.productName,
        orders: 0,
        points: 0,
        amount: 0,
      })
    }
    const row = bucket.get(item.productName)
    row.orders += 1
    row.points += item.pointsDeductAmount
    if (item.status === 'PAID' || item.status === 'FULFILL_FAILED') {
      row.amount += item.cashAmount
    }
  })
  return [...bucket.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((item, index) => ({
      rank: index + 1,
      name: item.name,
      orders: item.orders,
      points: formatMoney(item.points),
      amount: formatMoney(item.amount),
    }))
}

function buildRisks(orders) {
  const fulfillFailed = orders.filter((item) => item.status === 'FULFILL_FAILED').length
  const pending = orders.filter((item) => item.status === 'PENDING').length
  const pointsException = orders.filter((item) => item.payType === 'CASH_POINTS' && item.pointsAmount > 0 && item.pointsDeductAmount <= 0).length
  return [
    { label: '支付成功未履约', desc: '需要补偿权益发放', count: fulfillFailed, tone: 'danger' },
    { label: '金额不一致', desc: '回调金额与订单金额不一致', count: 1, tone: 'danger' },
    { label: '超时未关闭', desc: '待支付超过 30 分钟', count: pending, tone: 'warning' },
    { label: '积分扣减异常', desc: '订单金额与积分抵扣需要核对', count: pointsException, tone: 'info' },
  ]
}

function getPercent(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 1000) / 10
}

function sumBy(list, key) {
  return list.reduce((total, item) => total + Number(item[key] || 0), 0)
}

function isInRange(createdTime, range) {
  if (!range || range.length !== 2) return true
  const time = new Date(createdTime.replace(/-/g, '/')).getTime()
  return time >= range[0] && time <= range[1] + 24 * 60 * 60 * 1000 - 1
}
