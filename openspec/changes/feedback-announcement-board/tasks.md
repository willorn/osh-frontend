# Tasks: feedback-announcement-board

## 准备

- [x] 确认公共 HomepageAnnouncementBoard 组件可用。
- [x] 确认后端公告/动态接口可用。

## 实现

- [x] `list.vue` 替换为 HomepageAnnouncementBoard + computed props 配置。
- [x] `list.vue` 接入 WebSocket 刷新（ANNOUNCEMENT_REFRESH）。
- [x] `list.vue` 移除旧 AnnouncementMarquee、loadAnnouncements、相关 ref 和样式。
- [x] `create.vue` 新增 showMissingEmailNotice + NAlert 提示。
- [x] 新增 OpenSpec change 文档。

## 验证

- [x] 反馈列表页展示公告/动态双栏。
- [x] WS 刷新触发后公告重新加载。
- [x] 未设置邮箱时提交反馈页显示警告。
- [x] 反馈卡片、筛选、分页、点赞、收藏正常。
- [x] `bash scripts/verify-ai-process.sh` 通过。

## PR

- [x] PR 描述关联 `openspec/changes/feedback-announcement-board`。
- [x] 填写验证结果。
