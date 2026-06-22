# Proposal: feedback-announcement-board

## 背景

反馈列表页之前使用自建 AnnouncementMarquee 组件展示公告与动态。首页/课程模块已统一为公共 HomepageAnnouncementBoard 组件，反馈模块需要对齐，复用公共组件并接入 WebSocket 刷新能力。此外，提交反馈页缺少用户未设置邮箱的提醒，导致后续状态变更邮件通知无法送达。

## 目标

- 反馈列表页替换自建 AnnouncementMarquee 为公共 HomepageAnnouncementBoard 组件。
- 通过 computed props 配置接口路径、查询参数、滚动速度、配色，委托公共组件自行 fetch。
- 接入 WebSocket `ANNOUNCEMENT_REFRESH` 刷新机制，后台发布公告时前端实时刷新。
- 提交反馈页在用户未设置邮箱时展示 NAlert 警告提示。

## 非目标

- 本次不改造其他模块的公告实现。
- 本次不新增后端接口（复用已有 `/feedback/announcement/list` 和 `/feedback/dynamics/list`）。
- 本次不改动反馈卡片、筛选、分页等交互逻辑。

## 用户影响

- 访问反馈列表页可看到与首页/课程页一致的公告双栏样式。
- 后台发布公告或产生新动态时，公告栏自动刷新，无需手动刷新页面。
- 未设置邮箱的用户在提交反馈时会看到提醒，引导其前往设置页补充邮箱。

## 风险

- 兼容性风险：低。公共组件已在首页/课程页验证。
- 数据风险：无。纯 UI 层替换，不涉及数据写入。
- 性能风险：低。公共组件按需 fetch，与旧实现请求次数一致。
- 安全风险：低。复用现有鉴权 headers。
- 回滚风险：revert commit 即可。

## 验收标准

- [ ] 反馈列表页展示公告、动态双栏，样式与首页一致。
- [ ] 收到 `ANNOUNCEMENT_REFRESH` 后自动刷新公告与动态。
- [ ] 未设置邮箱用户在提交反馈页看到警告提示。
- [ ] 不影响反馈卡片、筛选、分页、点赞、收藏等现有功能。

## 关联信息

- 后端 PR：osh-backend #263
- 参考：`components/Homepage/AnnouncementBoard.vue`
