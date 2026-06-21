# 前端架构说明

## 当前形态

当前前端是 Nuxt 3 客户端渲染应用：

- `pages/`：文件路由。
- `components/`：复用组件。
- `composables/`：接口封装和业务状态。
- `middleware/`：登录态、权限、路由跳转。
- `assets/`：全局样式。
- `server/api/`：本地 server API 或代理。

## 数据流

```text
Page -> Component -> Composable -> /api/** -> Nuxt proxy -> Backend /pc/**
```

## 页面开发原则

- 页面只做页面级编排。
- 业务请求放 composable。
- 组件只通过 props/emits 或明确状态交互。
- 登录态和权限放 middleware 或统一 composable。

## 后续演进

- 统一 API client。
- 统一错误处理和 loading 状态。
- 收敛业务组件目录。
- 为后端微服务化预留 API domain 分组。
