# OSH Frontend OpenSpec Project

## 项目定位

`osh-frontend` 是 OSH 主网站前端，当前基于 Nuxt 3、Vue 3、Naive UI、WindiCSS 和自定义组件构建。它承载首页、课程、课程详情、电子书、工具、资源、拼团、秒杀、反馈、问答、用户中心、登录注册等页面。

## SDD 工作原则

SDD 是 Spec Driven Development，先写清楚用户行为、页面状态、接口契约和验收标准，再写代码。任何影响页面交互、路由、登录态、权限、接口调用、支付流程、课程权益、样式系统或构建部署的变更，都必须先建 `openspec/changes/<change-id>/`。

## OpenSpec 目录约定

```text
openspec/
  project.md
  specs/
    baseline/
      spec.md
  changes/
    README.md
    <change-id>/
      proposal.md
      design.md
      tasks.md
      specs/
        <capability>/
          spec.md
  templates/
    proposal.md
    design.md
    tasks.md
    spec.md
```

## 当前技术基线

- Nuxt 3.6.5。
- Vue 3。
- SSR 关闭，当前是客户端渲染主导。
- Naive UI。
- WindiCSS。
- `nuxt.config.ts` 中 `/api/**` 代理到后端 `/pc/**`。

## 前端架构边界

- `pages/` 负责路由页面和页面级编排。
- `components/` 负责可复用 UI 和业务组件。
- `composables/` 负责接口封装、状态复用、业务逻辑复用。
- `middleware/` 负责路由守卫、登录态、权限跳转。
- `assets/` 负责全局样式和静态资源。
- `server/api/` 只放 Nuxt server API 或本地代理逻辑。

## 自动化要求

所有 PR 都会触发 `Spec & Process Guard`：

- 检查基础规范文件是否存在。
- 检查 PR 是否包含 OpenSpec change，或在 PR 描述中声明 `OpenSpec-Exempt: true` 和豁免原因。
- 检查 change 包里是否有 `proposal.md`、`design.md`、`tasks.md`。

UI 样式调整如果影响多个页面、组件交互或业务流程，也必须建 OpenSpec。只改错别字、注释或极小视觉瑕疵可以豁免。
