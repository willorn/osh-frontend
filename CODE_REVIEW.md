# Code Review

代码审核以 `docs/ai/07-review-rubric.md` 为准。

Reviewer 必须检查：

- OpenSpec change 是否存在或是否有合理豁免。
- 页面行为是否满足 spec。
- 路由和 API 是否兼容。
- 登录态和权限是否正确。
- loading/empty/error 状态是否完整。
- 响应式和交互是否可用。
- 是否存在无关重构。

没有 OpenSpec 且没有合理豁免的 PR 不应合并。
