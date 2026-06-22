# Design: feedback-announcement-board

## 方案概览

在 `pages/feedback/list.vue` 用公共 `HomepageAnnouncementBoard` 替换自建 `AnnouncementMarquee`，通过 computed props 传入配置；在 `pages/feedback/create.vue` 新增邮箱缺失检测与 NAlert 提示。

## 现状分析

- 反馈列表页：`pages/feedback/list.vue`，使用自建 `AnnouncementMarquee` 组件。
- 公共组件：`components/Homepage/AnnouncementBoard.vue`，支持 props 配置 + WS 刷新。
- WebSocket：`composables/useWebSocket.ts` 已有 `announcementRefreshFlags` 和 `buildAnnouncementRefreshKey`。
- 提交反馈页：`pages/feedback/create.vue`，当前无邮箱检测逻辑。

## 详细设计

### 修改文件

| 路径 | 改动 |
|---|---|
| `pages/feedback/list.vue` | 移除 AnnouncementMarquee，改用 HomepageAnnouncementBoard；移除 loadAnnouncements、相关 ref 和样式 |
| `pages/feedback/create.vue` | 新增 showMissingEmailNotice computed + NAlert 提示 |

### 公共组件配置（feedbackAnnouncementBoardProps）

| 属性 | 值 |
|---|---|
| noticeApiPath | `/feedback/announcement/list` |
| dynamicApiPath | `/feedback/dynamics/list` |
| noticeQuery | `{ channel: 1, limit: 10 }` |
| dynamicQuery | `{ limit: 10 }` |
| requestMethod | `GET` |
| enableWsRefresh | `true` |
| refreshWsType | `ANNOUNCEMENT_REFRESH` |
| refreshTrigger | `announcementRefreshFlags[buildAnnouncementRefreshKey(...)]` |

### WebSocket 刷新

- 监听 `ANNOUNCEMENT_REFRESH`，key 为 `buildAnnouncementRefreshKey('ANNOUNCEMENT_REFRESH', 'feedback', 'refresh')`。
- refreshTrigger 变化时公共组件自动重新拉取公告与动态。

### 邮箱提示

- `showMissingEmailNotice`：当 `user` 存在且 `user.email` 为空时返回 true。
- 在表单标题下方渲染 `<n-alert type="warning">` 提示用户前往设置邮箱。

## 兼容性

- 不修改其他模块的公告实现。
- 移除旧 `AnnouncementMarquee` 引用和相关 API import。

## 测试计划

- 本地 `bun run dev`，访问反馈列表页。
- 确认双栏公告显示正常（含空状态）。
- 确认 WS 刷新触发后公告重新加载。
- 访问提交反馈页，确认未设置邮箱时显示警告。

## 发布与回滚

- 发布：合并 PR 后前端部署即可。
- 回滚：revert commit。
