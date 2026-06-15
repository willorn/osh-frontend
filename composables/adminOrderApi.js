import {
  mapBackendAdminOrder,
  toBackendAdminOrderQuery,
} from '~/composables/orderAdmin.mjs'

function cleanQuery(query = {}) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== null && value !== undefined && value !== ''),
  )
}

function encodeOrderNo(orderNo) {
  return encodeURIComponent(String(orderNo || ''))
}

export async function fetchAdminOrderDashboard(rangeQuery = {}) {
  const query = cleanQuery(rangeQuery)
  const requests = await Promise.all([
    useHttpGet('AdminOrderDashboardSummary', '/admin/order/dashboard/summary', { $: true, query }),
    useHttpGet('AdminOrderDashboardRevenueTrend', '/admin/order/dashboard/revenue-trend', { $: true, query }),
    useHttpGet('AdminOrderDashboardPaymentMix', '/admin/order/dashboard/payment-mix', { $: true, query }),
    useHttpGet('AdminOrderDashboardFunnel', '/admin/order/dashboard/funnel', { $: true, query }),
    useHttpGet('AdminOrderDashboardPoints', '/admin/order/dashboard/points', { $: true, query }),
    useHttpGet('AdminOrderDashboardRankings', '/admin/order/dashboard/rankings', { $: true, query }),
  ])

  const [summary, revenueTrend, paymentMix, funnel, points, rankings] = requests.map(({ data }) => data.value || {})
  return {
    summary,
    revenueTrend,
    paymentMix,
    funnel,
    points,
    rankings,
  }
}

export async function fetchAdminOrderPage(query = {}) {
  const backendQuery = toBackendAdminOrderQuery(query)
  const { data, error } = await useHttpGet('AdminOrderPage', '/admin/order/page', {
    $: true,
    query: backendQuery,
  })
  const payload = data.value || {}
  return {
    rows: Array.isArray(payload.rows) ? payload.rows.map(mapBackendAdminOrder) : [],
    total: Number(payload.total || 0),
    error: error.value,
  }
}

export async function fetchAdminOrderDetail(orderNo) {
  const { data, error } = await useHttpGet('AdminOrderDetail', `/admin/order/${encodeOrderNo(orderNo)}`, {
    $: true,
  })
  const payload = data.value || null
  return {
    data: payload ? mapBackendAdminOrder(payload) : null,
    error: error.value,
  }
}

export async function fetchAdminOrderPayment(orderNo) {
  const { data, error } = await useHttpGet('AdminOrderPayment', `/admin/order/${encodeOrderNo(orderNo)}/payment`, {
    $: true,
  })
  return {
    data: data.value || null,
    error: error.value,
  }
}

export async function closeAdminOrder(orderNo) {
  const { data, error } = await useHttpPost('AdminOrderClose', `/admin/order/${encodeOrderNo(orderNo)}/close`, {
    $: true,
  })
  return {
    data: data.value,
    error: error.value,
  }
}

export async function retryAdminOrderFulfillment(orderNo) {
  const { data, error } = await useHttpPost('AdminOrderFulfillRetry', `/admin/order/${encodeOrderNo(orderNo)}/fulfill/retry`, {
    $: true,
  })
  return {
    data: data.value,
    error: error.value,
  }
}
