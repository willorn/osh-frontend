# Design: course-announcement

## 方案概览

在 `pages/course/[page].vue` 增加双栏公告 UI，通过 `course.js` 调用后端接口，通过 `useWebSocket.js` 监听刷新消息。

## 现状分析

- 课程列表页：`pages/course/[page].vue`，已有筛选、卡片、分页。
- 工具参考：`pages/tool/index.vue` 双栏滚动公告 + WS 刷新。
- API base：`fetchConfig.baseURL` → `/pc`

## 详细设计

### 修改文件

| 路径 | 改动 |
|---|---|
| `composables/Api/Course/course.js` | 新增 `apiCourseSystemAnnouncements`、`apiCourseUserAnnouncements` |
| `pages/course/[page].vue` | 双栏公告 UI、加载逻辑、WS watch |
| `composables/useWebSocket.js` | 新增 `COURSE_USER_NOTICE_REFRESH` 处理与 `courseUserNoticeRefreshFlag` |

### API 调用

| 函数 | 路径 |
|---|---|
| `apiCourseSystemAnnouncements` | `GET /course/announcement/systemNotice/latest` |
| `apiCourseUserAnnouncements` | `GET /course/announcement/userNotice/latest` |

### UI 设计

- 面包屑下方、筛选栏上方，两行独立公告栏。
- 左标签「系统通知 / 课程动态」，右侧横向滚动。
- 悬停暂停滚动；内部链接 `navigateTo`，外部链接新窗口打开。
- 配色与课程页绿色主色 `#18a058` 一致。

### WebSocket

- 收到 `COURSE_USER_NOTICE_REFRESH` 且当前路径以 `/course` 开头时，重新拉取两类公告。

## 兼容性

- 不修改现有 course API 与其他页面 WS 逻辑。

## 测试计划

- 本地 `npm run dev`，访问 `/course/1`。
- 确认双栏显示（含空状态）。
- 确认课程列表、筛选、分页正常。

## 发布与回滚

- 发布：合并 PR 后前端部署即可。
- 回滚：revert commit。
