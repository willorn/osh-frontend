# Contributing

## 开发前

1. 从最新 `qa/**` 或负责人指定分支创建 feature/codex 分支。
2. 判断是否需要 OpenSpec change。
3. 阅读 `docs/ai/newcomer-guide.md` 和 `docs/ai/workflow.md`。

## 必须建 OpenSpec 的情况

- 新页面、新组件体系。
- 页面行为变化。
- API、登录态、权限、支付、订单变化。
- 大面积 UI 调整。
- Nuxt/Vue/Node/构建工具升级。

## PR 前

- 确认 `openspec/changes/<change-id>` 已补齐。
- 运行相关构建或页面 smoke。
- 填写 PR 模板。
- 不提交密钥、token、构建产物。
