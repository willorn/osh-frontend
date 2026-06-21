# 前端通用约定

## 职责边界

- `pages/`：路由页面和页面级编排。
- `components/`：可复用 UI 与业务组件。
- `composables/`：API、状态、业务逻辑复用。
- `middleware/`：路由守卫、登录态、权限跳转。
- `assets/`：全局样式和资源。

## 变更要求

- 页面行为变更必须写 spec。
- API 路径变化必须写 design。
- 大面积 UI 改动必须做浏览器验证。
- 不做无关重构。
