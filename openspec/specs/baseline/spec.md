# Baseline Spec: OSH Frontend

## CURRENT Requirements

### Requirement: 前端保持主网站路由兼容

前端 SHALL 保持已有核心路由可访问，除非 OpenSpec change 明确说明迁移和跳转策略。

#### Scenario: 用户访问课程详情

- GIVEN 用户打开 `/course_detail/:id`
- WHEN 页面加载课程详情
- THEN 页面 SHALL 使用兼容接口获取数据并展示课程信息

### Requirement: API 代理路径保持兼容

前端 SHALL 保持 `/api/**` 到后端 `/pc/**` 的开发代理约定。

#### Scenario: 页面调用业务接口

- GIVEN composable 调用 `/api/course/...`
- WHEN Nuxt dev proxy 转发请求
- THEN 后端 SHALL 收到对应 `/pc/course/...` 请求

### Requirement: 登录态和权限跳转必须显式评审

任何登录、注册、用户中心、课程权益、VIP、小班、创始人权限相关变更 SHALL 建立 OpenSpec change。

#### Scenario: 未登录用户访问需要登录的页面

- GIVEN 用户未登录
- WHEN 用户访问受保护页面
- THEN 前端 SHALL 按 middleware 规则跳转登录页并保留来源

### Requirement: UI 风格调整不得破坏功能

样式调整 SHALL 不改变接口路径、业务状态、权限判断和核心交互，除非 OpenSpec 明确要求。

#### Scenario: 优化课程卡片样式

- GIVEN 课程卡片原本可以点击进入详情
- WHEN 样式优化后
- THEN 点击、价格、权益状态、按钮行为 SHALL 保持兼容
