/**
 * 原生 WebSocket 连接管理 + 消息通知状态
 *
 * 连接地址：ws://host/ws/connect?token=xxx
 * 消息格式：WsNotifyMessage JSON
 *   { type, title, content, jumpUrl, bizId, createTime }
 */

export const useNotifications = () => useState('ws_notifications', () => [])
export const useUnreadCount = () => useState('ws_unread', () => 0)
export const useWsStatus = () => useState('ws_status', () => 'disconnected')
export const useProjectAnnouncements = () => useState('ws_project_announcements', () => [])
export const useToolUserNoticeRefreshFlag = () => useState('ws_tool_user_notice_refresh', () => 0)
export const useHomepageAnnouncementRefreshFlag = () => useState('ws_homepage_announcement_refresh', () => 0)

const BROADCAST_TYPES = new Set([
  'NEW_OPEN_PROJECT',
  'TOOL_USER_NOTICE_REFRESH',
  'HOMEPAGE_ANNOUNCEMENT_REFRESH',
  'SECKILL_NOTICE_UPDATE',
  'SECKILL_DYNAMIC_NEW',
])

let _ws = null
let _heartbeatTimer = null
let _reconnectTimer = null
let _manualClose = false

function getWsBaseURL() {
  const hostname = window.location.hostname
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
  const host = isLocal ? 'localhost:8081' : '43.242.200.25:8081'
  return `ws://${host}`
}

function resolveToken() {
  try {
    const cookie = useCookie('token').value
    if (cookie) return cookie
  } catch {}

  return localStorage.getItem('token') || localStorage.getItem('Token') || ''
}

function parseJsonSafely(value) {
  if (!value || typeof value !== 'string') {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function isHomepageRefreshMessage(msg) {
  if (msg.type !== 'HOMEPAGE_ANNOUNCEMENT_REFRESH') {
    return false
  }

  if (msg.bizId === 'homepage') {
    return true
  }

  const contentPayload = parseJsonSafely(msg.content)
  return contentPayload?.module === 'homepage'
}

export function useWebSocket() {
  const notifications = useNotifications()
  const unreadCount = useUnreadCount()
  const wsStatus = useWsStatus()
  const projectAnnouncements = useProjectAnnouncements()
  const toolUserNoticeRefreshFlag = useToolUserNoticeRefreshFlag()
  const homepageAnnouncementRefreshFlag = useHomepageAnnouncementRefreshFlag()

  function connect() {
    if (!process.client) return
    if (_ws && (_ws.readyState === WebSocket.CONNECTING || _ws.readyState === WebSocket.OPEN)) return

    const token = resolveToken()
    if (!token) return

    _manualClose = false
    wsStatus.value = 'connecting'

    const url = `${getWsBaseURL()}/ws/connect?token=${encodeURIComponent(token)}`
    _ws = new WebSocket(url)

    _ws.onopen = () => {
      wsStatus.value = 'connected'
      console.log('[WS] 连接成功')
      _startHeartbeat()
    }

    _ws.onmessage = (event) => {
      if (event.data === 'pong') return

      try {
        const payload = JSON.parse(event.data)
        const msg = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: payload.type || 'SYSTEM',
          title: payload.title || '新消息',
          content: payload.content || '',
          jumpUrl: payload.jumpUrl || null,
          bizId: payload.bizId || null,
          createTime: payload.createTime || new Date().toISOString(),
          read: false,
        }

        const isBroadcast = BROADCAST_TYPES.has(msg.type)

        if (!isBroadcast) {
          notifications.value.unshift(msg)
          if (notifications.value.length > 50) notifications.value = notifications.value.slice(0, 50)
          unreadCount.value++
        }

        if (msg.type === 'NEW_OPEN_PROJECT') {
          projectAnnouncements.value.unshift(msg)
          if (projectAnnouncements.value.length > 10) {
            projectAnnouncements.value = projectAnnouncements.value.slice(0, 10)
          }
        }

        if (msg.type === 'TOOL_USER_NOTICE_REFRESH') {
          toolUserNoticeRefreshFlag.value = Date.now()
          if (process.client && msg.title) {
            try {
              window.dispatchEvent(new CustomEvent('tool-announcement-toast', {
                detail: { title: msg.title },
              }))
            } catch (err) {
              console.error('[WS] 工具公告提示派发失败', err)
            }
          }
        }

        if (isHomepageRefreshMessage(msg)) {
          homepageAnnouncementRefreshFlag.value = Date.now()
        }
      } catch (e) {
        console.error('[WS] 消息解析失败', e)
      }
    }

    _ws.onclose = () => {
      wsStatus.value = 'disconnected'
      _stopHeartbeat()
      console.log('[WS] 连接关闭')
      if (!_manualClose) {
        _reconnectTimer = setTimeout(connect, 5000)
      }
    }

    _ws.onerror = (err) => {
      wsStatus.value = 'error'
      console.error('[WS] 连接错误', err)
    }
  }

  function disconnect() {
    _manualClose = true
    clearTimeout(_reconnectTimer)
    _stopHeartbeat()
    if (_ws) {
      _ws.close()
      _ws = null
    }
    wsStatus.value = 'disconnected'
  }

  function markAllRead() {
    notifications.value.forEach(n => (n.read = true))
    unreadCount.value = 0
  }

  function markRead(id) {
    const msg = notifications.value.find(n => n.id === id)
    if (msg && !msg.read) {
      msg.read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  function clearAll() {
    notifications.value = []
    unreadCount.value = 0
  }

  return {
    notifications,
    unreadCount,
    wsStatus,
    connect,
    disconnect,
    markAllRead,
    markRead,
    clearAll,
    projectAnnouncements,
    toolUserNoticeRefreshFlag,
    homepageAnnouncementRefreshFlag,
  }
}

function _startHeartbeat() {
  _stopHeartbeat()
  _heartbeatTimer = setInterval(() => {
    if (_ws && _ws.readyState === WebSocket.OPEN) {
      _ws.send('ping')
    }
  }, 30000)
}

function _stopHeartbeat() {
  if (_heartbeatTimer) {
    clearInterval(_heartbeatTimer)
    _heartbeatTimer = null
  }
}
