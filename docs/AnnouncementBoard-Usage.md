# AnnouncementBoard 接入说明

## 1. 文档目标

这份文档面向前端开发者和 AI 代码助手，说明如何在任意业务模块中接入公告栏组件：

- 正确请求后端公告接口
- 正确接收 WebSocket 刷新消息
- 正确配置模块自己的滚动速度、颜色、图标和链接规则
- 不需要修改 `useWebSocket.js` 里的事件判断

当前项目的公告栏组件为：

- `E:/juege/juege_osh_frontend/osh-frontend/components/Homepage/AnnouncementBoard.vue`

WebSocket 刷新解析在：

- `E:/juege/juege_osh_frontend/osh-frontend/composables/useWebSocket.js`

首页现有接入示例在：

- `E:/juege/juege_osh_frontend/osh-frontend/pages/index.vue`

## 2. 当前公告栏工作方式

公告栏不是直接吃 WebSocket 数据内容，而是走下面这条链路：

1. 页面先通过 HTTP 接口拉取系统公告和业务动态。
2. 后端业务发生变化后，通过 WebSocket 推送一条“刷新消息”。
3. 前端 `useWebSocket.js` 收到消息后，根据 `type + module + action` 生成一个刷新标记。
4. 页面把这个刷新标记作为 `refreshTrigger` 传给公告栏组件。
5. 公告栏组件监听 `refreshTrigger` 变化后，重新请求两个 HTTP 接口。

也就是说：

- WebSocket 只负责“通知前端重新拉取”
- 真正展示的数据仍然来自后端公告接口

### 2.1 支付成功时前后端如何联动

以“用户支付成功后，工具模块公告栏需要刷新”为例，完整链路如下：

1. 用户在前端完成支付。
2. 后端支付业务处理成功。
3. 后端把一条新的业务动态写入 `osh_announcement`，例如：
   - `title = 某用户购买了图片打码工具`
   - `channel = 2`
   - `resource_type = tool`
   - `icon_code = payment`
4. 后端通过 WebSocket 推送一条刷新消息：
   - `type = PAYMENT_STATUS_CHANGED`
   - `module = tool`
   - `action = paid`
   - `refresh = true`
   - `noticeApi = /pc/tool/announcement/notice`
   - `dynamicApi = /pc/tool/announcement/dynamic`
5. 前端 `useWebSocket.js` 收到消息后，生成刷新 key：

```js
PAYMENT_STATUS_CHANGED::tool::paid
```

6. 工具模块页面使用同样的 key 读取 `announcementRefreshFlags`
7. 页面把对应值传给公告栏组件的 `refreshTrigger`
8. 公告栏组件监听到 `refreshTrigger` 变化后，重新请求：
   - `/tool/announcement/notice`
   - `/tool/announcement/dynamic`
9. 前端页面展示最新公告数据

注意：

- 前端不会直接拿 WebSocket 里的公告正文来显示
- WebSocket 只负责通知“重新拉取”
- 真正展示的新内容必须先被后端写进 `osh_announcement`

## 3. 前端必须配合的统一协议

当前前端已经只适配“新协议”。

如果某个模块要让公告栏刷新，后端 WebSocket 消息必须明确传：

```json
{
  "type": "ANNOUNCEMENT_REFRESH",
  "bizId": "tool",
  "content": "{\"module\":\"tool\",\"action\":\"refresh\",\"refresh\":true,\"noticeApi\":\"/pc/tool/announcement/notice\",\"dynamicApi\":\"/pc/tool/announcement/dynamic\"}"
}
```

前端只认这几个字段：

- `type`
- `content.module`
- `content.action`
- `content.refresh === true`

缺任何一个，都不会触发公告栏刷新。

## 4. AnnouncementBoard 组件参数

组件支持的核心参数如下。

### 4.1 数据请求参数

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `moduleName` | `String` | 否 | 当前模块名称，仅用于空状态文案 |
| `noticeApiPath` | `String` | 是 | 系统公告接口路径 |
| `dynamicApiPath` | `String` | 是 | 业务动态接口路径 |
| `apiBaseURL` | `String` | 否 | API 基础地址，不传则使用 `fetchConfig.baseURL` |
| `requestMethod` | `String` | 否 | 请求方式，默认 `GET` |
| `noticeQuery` | `Object` | 否 | 系统公告请求参数 |
| `dynamicQuery` | `Object` | 否 | 业务动态请求参数 |
| `timeField` | `String` | 否 | 排序使用的时间字段，默认 `createTime` |

### 4.2 WebSocket 刷新参数

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `enableWsRefresh` | `Boolean` | 否 | 是否响应 WebSocket 刷新，默认 `true` |
| `refreshWsType` | `String` | 否 | 当前模块使用的 WS 类型，主要用于语义表达 |
| `refreshTrigger` | `Number/String` | 是 | 外层页面从 `useWebSocket()` 计算后传入的刷新标记 |

注意：

- 当前组件真正依赖的是 `refreshTrigger`
- `refreshWsType` 是为了让组件调用处更清晰

### 4.3 展示参数

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `noticeLabel` | `String` | 否 | 系统公告标题 |
| `dynamicLabel` | `String` | 否 | 业务动态标题 |
| `loadingText` | `String` | 否 | 加载中文案 |
| `scrollDurationSeconds` | `Number` | 否 | 默认滚动时长，单位秒 |
| `noticeScrollDurationSeconds` | `Number` | 否 | 系统公告滚动时长，优先级高于默认值 |
| `dynamicScrollDurationSeconds` | `Number` | 否 | 业务动态滚动时长，优先级高于默认值 |
| `noticeAccentColors` | `Array<String>` | 否 | 系统公告颜色列表 |
| `dynamicAccentColors` | `Array<String>` | 否 | 业务动态颜色列表 |

颜色规则：

- 不传时，组件默认使用黑色 `#111827`
- 传 3 到 5 个颜色时，组件会按条目数量循环使用

### 4.4 链接参数

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `linkBaseURL` | `String` | 否 | 链接前缀，不传时默认使用当前访问域名 |
| `linkPathRewriters` | `Array` | 否 | 仅对当前组件实例生效的路径重写规则 |

适用场景：

- 某个模块历史公告数据里的 `link` 是旧路径
- 但你不想影响其他模块
- 可以只在当前页面传 `linkPathRewriters`

## 5. 接入一个新模块时前端要做什么

假设现在要给“工具模块”接公告栏。

你至少要完成下面四件事：

1. 确认后端提供两个接口
2. 在页面中引入 `AnnouncementBoard.vue`
3. 从 `useWebSocket()` 中读取 `announcementRefreshFlags`
4. 使用 `buildAnnouncementRefreshKey(type, module, action)` 计算刷新标记

## 6. 标准接入代码示例

下面是一个适用于新模块的标准写法。

### 6.1 页面示例

```vue
<template>
  <HomepageAnnouncementBoard v-bind="toolAnnouncementBoardProps" />
</template>

<script setup>
import { computed } from 'vue'
import HomepageAnnouncementBoard from '~/components/Homepage/AnnouncementBoard.vue'
import { buildAnnouncementRefreshKey } from '~/composables/useWebSocket'

const { announcementRefreshFlags } = useWebSocket()

const toolAnnouncementRefreshType = 'ANNOUNCEMENT_REFRESH'
const toolAnnouncementRefreshAction = 'refresh'
const toolAnnouncementModule = 'tool'

const toolAnnouncementBoardProps = computed(() => ({
  moduleName: '工具模块',
  noticeApiPath: '/tool/announcement/notice',
  dynamicApiPath: '/tool/announcement/dynamic',
  requestMethod: 'GET',
  noticeLabel: '系统公告',
  dynamicLabel: '业务动态',
  enableWsRefresh: true,
  refreshWsType: toolAnnouncementRefreshType,
  refreshTrigger: announcementRefreshFlags.value[
    buildAnnouncementRefreshKey(
      toolAnnouncementRefreshType,
      toolAnnouncementModule,
      toolAnnouncementRefreshAction,
    )
  ] || 0,
  noticeScrollDurationSeconds: 180,
  dynamicScrollDurationSeconds: 300,
  noticeAccentColors: ['#111827', '#1f2937', '#374151'],
  dynamicAccentColors: ['#111827', '#374151', '#4b5563'],
}))
</script>
```

### 6.2 如果模块有旧链接，需要局部兼容

```vue
const toolAnnouncementBoardProps = computed(() => ({
  moduleName: '工具模块',
  noticeApiPath: '/tool/announcement/notice',
  dynamicApiPath: '/tool/announcement/dynamic',
  refreshWsType: toolAnnouncementRefreshType,
  refreshTrigger: announcementRefreshFlags.value[
    buildAnnouncementRefreshKey(
      toolAnnouncementRefreshType,
      toolAnnouncementModule,
      toolAnnouncementRefreshAction,
    )
  ] || 0,
  linkPathRewriters: [
    { pattern: '^/tool/detail/', replace: '/tool/detail/' },
  ],
}))
```

如果后端已经直接存的是正确前端路由，则不要传 `linkPathRewriters`。

## 7. 后端接口返回数据格式

公告栏组件当前通过 HTTP 接口读取后端数据，兼容以下几种常见返回结构：

```json
{
  "data": [
    {
      "id": 1,
      "title": "工具系统通知：图片打码工具已更新",
      "link": "/tool/detail/5",
      "icon": "publish",
      "channel": 1,
      "resourceType": "tool",
      "resourceId": 5,
      "createTime": "2026-06-20 12:00:00"
    }
  ]
}
```

也支持：

- 顶层直接是数组
- `rows`
- `data.rows`

组件内部会自动标准化：

- `title`
- `link`
- `icon` 或 `icon_code`
- `channel`
- `resourceType`
- `createTime`

## 8. 图标字段说明

后端推荐传 `icon_code`，前端组件会根据 `icon_code` 映射本地图标。

当前组件内置了一批常用场景，例如：

- `thumb_up`
- `publish`
- `online`
- `audit`
- `approve`
- `payment`
- `purchase`
- `course_online`
- `bugfix`

如果后端传入的 `icon_code` 不在内置列表内，组件会回退到默认图标。

因此推荐后端统一写：

- 数据库存 `icon_code`
- 接口中返回 `icon_code` 或 alias 为 `icon`

## 9. WebSocket 刷新是怎么接上的

前端公告栏不会自己建立独立 WebSocket 连接。

它依赖全局 `useWebSocket.js`。

核心逻辑是：

```js
const refreshKey = buildAnnouncementRefreshKey(type, module, action)
announcementRefreshFlags.value = {
  ...announcementRefreshFlags.value,
  [refreshKey]: Date.now(),
}
```

然后页面通过同样的 key 取值，再传给组件的 `refreshTrigger`。

所以如果一个新模块要接公告栏：

- 不需要修改 `useWebSocket.js` 里的事件分支
- 只需要保证后端 WS 消息里传对：
  - `type`
  - `module`
  - `action`
  - `refresh=true`

### 9.1 支付成功案例对应的前端写法

假设工具模块支付成功时，后端发送的是：

```json
{
  "type": "PAYMENT_STATUS_CHANGED",
  "bizId": "tool",
  "content": "{\"module\":\"tool\",\"action\":\"paid\",\"refresh\":true,\"noticeApi\":\"/pc/tool/announcement/notice\",\"dynamicApi\":\"/pc/tool/announcement/dynamic\"}"
}
```

那么前端工具模块页面应这样接：

```vue
<script setup>
import { computed } from 'vue'
import HomepageAnnouncementBoard from '~/components/Homepage/AnnouncementBoard.vue'
import { buildAnnouncementRefreshKey } from '~/composables/useWebSocket'

const { announcementRefreshFlags } = useWebSocket()

const toolAnnouncementRefreshType = 'PAYMENT_STATUS_CHANGED'
const toolAnnouncementRefreshAction = 'paid'
const toolAnnouncementModule = 'tool'

const toolAnnouncementBoardProps = computed(() => ({
  moduleName: '工具模块',
  noticeApiPath: '/tool/announcement/notice',
  dynamicApiPath: '/tool/announcement/dynamic',
  enableWsRefresh: true,
  refreshWsType: toolAnnouncementRefreshType,
  refreshTrigger: announcementRefreshFlags.value[
    buildAnnouncementRefreshKey(
      toolAnnouncementRefreshType,
      toolAnnouncementModule,
      toolAnnouncementRefreshAction,
    )
  ] || 0,
}))
</script>
```

这里要注意：

- 如果后端这次发的是 `PAYMENT_STATUS_CHANGED + tool + paid`
- 那前端必须完全按这三个值去取 key
- 不能还按 `ANNOUNCEMENT_REFRESH::tool::refresh` 去取

也就是说，前后端一定要对齐：

- `type`
- `module`
- `action`

## 10. 工具模块接入清单

如果 AI 要为工具模块接入公告栏，可以按下面清单执行：

1. 引入 `HomepageAnnouncementBoard`
2. 引入 `buildAnnouncementRefreshKey`
3. 从 `useWebSocket()` 读取 `announcementRefreshFlags`
4. 定义：
   - `toolAnnouncementRefreshType`
   - `toolAnnouncementRefreshAction`
   - `toolAnnouncementModule`
5. 配置：
   - `noticeApiPath`
   - `dynamicApiPath`
   - `refreshTrigger`
6. 如有旧路由，再配置 `linkPathRewriters`
7. 如需调整样式，再配置：
   - `noticeScrollDurationSeconds`
   - `dynamicScrollDurationSeconds`
   - `noticeAccentColors`
   - `dynamicAccentColors`

## 11. 常见错误

### 11.1 公告不刷新

优先检查后端 WS payload 是否满足：

```json
{
  "module": "tool",
  "action": "refresh",
  "refresh": true
}
```

如果 `refresh` 不是 `true`，前端不会刷新。

### 11.2 明明收到 WS，但组件没反应

检查页面读取的 key 是否和后端完全一致：

```js
buildAnnouncementRefreshKey(type, module, action)
```

三个值必须逐个一致。

### 11.3 链接点击后打开错误页面

说明后端 `link` 存的不是当前前端真实路由。

优先方案：

- 直接修正后端公告表里的 `link`

过渡方案：

- 只在当前模块页面传 `linkPathRewriters`

## 12. 推荐规则

为了让后续所有模块都能复用同一套公告栏能力，推荐遵循下面规则：

1. 后端公告接口统一返回 `title/link/icon_code/channel/createTime`
2. WebSocket 刷新统一使用：
   - `type`
   - `module`
   - `action`
   - `refresh=true`
3. 前端页面统一通过 `buildAnnouncementRefreshKey(type, module, action)` 取刷新标记
4. 公告表里的 `link` 优先存前端真实路由，不在组件里做全局路径修正

做到这四点后，AI 可以基于任意模块快速接入公告栏，而不需要修改底层公共逻辑。
