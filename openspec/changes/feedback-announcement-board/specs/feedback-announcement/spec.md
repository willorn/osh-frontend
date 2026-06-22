# Spec: Feedback Announcement Board

## ADDED Requirements

### Requirement: 反馈列表页使用公共公告栏组件

反馈列表页 SHALL 使用公共 HomepageAnnouncementBoard 组件展示「公告」与「动态」双栏。

#### Scenario: 页面加载

- GIVEN 用户访问反馈列表页
- WHEN 页面 mount
- THEN HomepageAnnouncementBoard 组件自行请求 `/feedback/announcement/list` 和 `/feedback/dynamics/list`
- AND 渲染公告与动态双栏

#### Scenario: 无公告数据

- GIVEN 接口返回空数组
- WHEN 公告栏渲染
- THEN 公告栏显示空状态占位文案

### Requirement: WebSocket 触发公告刷新

反馈列表页 SHALL 在收到 `ANNOUNCEMENT_REFRESH` 消息时触发公告栏重新拉取数据。

#### Scenario: 收到刷新广播

- GIVEN 用户位于反馈列表页
- WHEN WebSocket 收到 `ANNOUNCEMENT_REFRESH` 且 module 为 feedback
- THEN refreshTrigger 递增
- AND HomepageAnnouncementBoard 重新请求公告与动态接口

### Requirement: 提交反馈页邮箱缺失提示

提交反馈页 SHALL 在当前用户未设置邮箱时展示警告提示。

#### Scenario: 用户未设置邮箱

- GIVEN 用户已登录且 email 字段为空
- WHEN 提交反馈页渲染
- THEN 在表单标题下方显示 NAlert warning 提示

#### Scenario: 用户已设置邮箱

- GIVEN 用户已登录且 email 字段非空
- WHEN 提交反馈页渲染
- THEN 不显示邮箱警告提示

#### Scenario: 用户未登录

- GIVEN 用户未登录
- WHEN 提交反馈页渲染
- THEN 不显示邮箱警告提示
