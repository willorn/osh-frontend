# AI 开发规范入口

这套目录是 `osh-frontend` 的 AI Coding 工作方式。目标是让页面开发、接口调用、权限跳转、样式调整和代码审查都有统一轨道。

## 必读顺序

1. [小白上手教程](newcomer-guide.md)
2. [AI 开发工作流](workflow.md)
3. [Codex Harness 使用规范](codex-harness.md)
4. [前端架构说明](architecture.md)
5. [代码风格](code-style.md)
6. [测试规范](testing.md)
7. [代码审核标准](review-rubric.md)
8. [发布流程](release-flow.md)
9. [升级策略](upgrade-strategy.md)

## 核心约束

- 中大型需求必须先建 `openspec/changes/<change-id>/`。
- Codex 开发必须先读 `AGENTS.md` 和当前 change 的 `proposal/design/tasks/spec`。
- PR 必须经过 GitHub Actions 的 `Spec & Process Guard`。
- UI 样式优化不得影响接口、登录态、权限和核心交互。
- 紧急修复可以先发，但必须在事后补 OpenSpec change。

## 当前仓库属性

- 类型：Nuxt 3 / Vue 3 主网站前端。
- 当前基线：Nuxt 3.6.5，SSR 关闭。
- 演进方向：统一组件规范、接口封装、权限中间件、后续框架和构建工具升级。
