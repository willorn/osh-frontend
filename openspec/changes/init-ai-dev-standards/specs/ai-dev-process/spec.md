# Spec: AI Development Process

## ADDED Requirements

### Requirement: 中大型变更必须包含 OpenSpec change

仓库 SHALL 要求中大型前端变更在 `openspec/changes/<change-id>/` 下提供 proposal、design、tasks 和至少一个 spec。

#### Scenario: PR 包含页面行为变更

- GIVEN PR 修改页面行为、接口调用、登录态、权限或大面积样式
- WHEN GitHub Actions 执行 PR check
- THEN `Spec & Process Guard` SHALL 检查到 OpenSpec change

### Requirement: 轻量变更必须声明豁免

仓库 SHALL 允许文档、注释、格式等轻量变更豁免 OpenSpec，但 PR 描述必须包含 `OpenSpec-Exempt: true` 和明确原因。

#### Scenario: PR 只修正文档错别字

- GIVEN PR 没有 `openspec/changes/<change-id>/`
- WHEN PR 描述包含 `OpenSpec-Exempt: true` 和 `Reason:`
- THEN `Spec & Process Guard` SHALL 允许继续执行后续检查

### Requirement: 新人必须有统一上手入口

仓库 SHALL 提供 `docs/ai/newcomer-guide.md`，解释 SDD、Harness、OpenSpec、Superpowers、前端开发流程、PR 前检查和审查方式。

#### Scenario: 新人第一次进入仓库

- GIVEN 新人打开仓库
- WHEN 新人阅读 `docs/ai/README.md`
- THEN 新人 SHALL 能按顺序找到教程、工作流、代码风格、测试和审查规范
