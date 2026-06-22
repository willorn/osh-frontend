# Spec: Course Announcement UI

## ADDED Requirements

### Requirement: 课程列表页展示双栏公告

课程列表页 SHALL 在筛选栏上方展示「系统通知」与「课程动态」两个独立公告栏。

#### Scenario: 页面加载

- GIVEN 用户访问 `/course/*` 列表页
- WHEN 页面 mount 或 activate
- THEN 分别请求系统通知与课程动态接口
- AND 渲染双栏公告区域

#### Scenario: 无公告数据

- GIVEN 接口返回空数组
- WHEN 公告栏渲染
- THEN 系统通知栏显示「暂无系统通知」
- AND 课程动态栏显示「暂无课程动态」

### Requirement: 公告支持点击跳转

公告条目 SHALL 在有 link 时支持点击跳转。

#### Scenario: 内部链接

- GIVEN 公告 link 以 `/` 开头
- WHEN 用户点击公告标题
- THEN 使用客户端路由跳转到对应页面

#### Scenario: 外部链接

- GIVEN 公告 link 为 http(s) URL
- WHEN 用户点击公告标题
- THEN 在新窗口打开链接

### Requirement: WebSocket 触发公告刷新

课程页 SHALL 在收到课程公告刷新消息时重新拉取公告数据。

#### Scenario: 收到刷新广播

- GIVEN 用户位于 `/course` 路径下
- WHEN WebSocket 收到 `COURSE_USER_NOTICE_REFRESH`
- THEN 重新请求系统通知与课程动态接口
- AND 更新公告栏展示
