# 新人上手教程：用 SDD + Harness + OpenSpec + Superpowers 开发 OSH Frontend

这份文档给第一次加入项目前端的人看，也给第一次让 Codex 接手前端需求的人看。你不需要一开始就懂完整业务，但你必须知道团队如何把一个页面需求变成稳定、可审查、可回滚的代码。

## 1. 先理解这几个概念

### 1.1 SDD 是什么

SDD 是 Spec Driven Development，规格驱动开发。

它的意思是：先写清楚页面和系统应该表现成什么样，再写代码。

前端最容易发生这些问题：

- “优化一下 UI”最后改坏了点击行为。
- “加个权限判断”最后未登录跳转丢了来源页面。
- “换个接口”最后 QA 环境能用、生产路径不对。
- “改个组件”最后别的页面也被影响。
- 新人不知道某个 composable 为什么绕一圈。

SDD 要求每个重要变更都有一份规格，写清楚：

- 用户看到什么。
- 用户能做什么。
- 哪些状态必须支持。
- 调哪些接口。
- 哪些行为不能变。
- 怎么验收。
- 怎么回滚。

### 1.2 OpenSpec 是什么

OpenSpec 是把一个变更结构化的方式。在本仓库里，每个中大型变更都放到：

```text
openspec/changes/<change-id>/
  proposal.md
  design.md
  tasks.md
  specs/
    <capability>/
      spec.md
```

OpenSpec 是团队的需求事实来源。Codex、开发、测试、Reviewer 都按它对齐。

### 1.3 Harness 是什么

Harness 是 AI Coding 的运行环境。Codex、Claude Code、Cursor、Copilot Chat 都可以看成 harness。

Harness 会：

- 读取仓库规则。
- 调用终端。
- 编辑文件。
- 运行测试。
- 汇报结果。

我们通过 `AGENTS.md`、`docs/ai/codex-harness.md`、PR 模板和 CI，让 harness 不乱跑。

### 1.4 Superpowers 是什么

Superpowers 是一种强调工程纪律的 AI 开发流程：

- 先理解。
- 再计划。
- 独立分支。
- 小步实现。
- 运行验证。
- 做代码审核。
- 完成后总结风险。

我们吸收这套思想，让 Codex 像一个守规矩的前端工程师，而不是“看到按钮就想重画整座城市”的艺术冲动型同事。

### 1.5 为什么前端也必须这么严

OSH 前端覆盖课程、支付、工具、反馈、用户中心、秒杀、拼团等业务。很多页面不是展示而已，它们承载权限、订单、权益和支付状态。

如果没有统一流程：

- 页面风格会越来越散。
- API 调用会散落在页面里。
- 登录态和权限会互相打架。
- 样式优化会误伤功能。
- 后端拆服务时前端不知道怎么跟。
- 新人只能靠翻代码猜。

这套流程就是让团队少靠猜，多靠事实。

## 2. 仓库结构先看哪里

核心目录：

```text
pages/                 页面路由
components/            UI 组件和业务组件
composables/           API 封装、状态复用、业务逻辑
middleware/            登录态、权限、路由跳转
assets/                全局样式和静态资源
server/api/            Nuxt server API 或本地代理
openspec/              规格驱动开发目录
docs/ai/               AI 开发规范和新人教程
```

新人优先看：

1. `docs/ai/README.md`
2. `openspec/project.md`
3. `docs/ai/architecture.md`
4. `docs/ai/conventions/vue-nuxt.md`
5. `docs/ai/conventions/api-client.md`
6. `CODE_REVIEW.md`

## 3. 新人接一个需求时怎么做

### 第一步：判断任务类型

必须建 OpenSpec change 的情况：

- 新页面。
- 新组件体系。
- 影响用户行为的 Bug 修复。
- 改接口路径、参数、响应处理。
- 改登录态、权限、路由守卫。
- 改课程权益、VIP、小班、创始人相关页面。
- 改支付、订单、秒杀、拼团流程。
- 大面积 UI 风格调整。
- 升级 Nuxt、Vue、Node、构建工具。

可以豁免的情况：

- 文档错别字。
- 注释修正。
- 单个很小的静态样式微调，且不影响交互。

### 第二步：创建 change

```bash
mkdir -p openspec/changes/<change-id>/specs/<capability>
cp openspec/templates/proposal.md openspec/changes/<change-id>/proposal.md
cp openspec/templates/design.md openspec/changes/<change-id>/design.md
cp openspec/templates/tasks.md openspec/changes/<change-id>/tasks.md
cp openspec/templates/spec.md openspec/changes/<change-id>/specs/<capability>/spec.md
```

命名示例：

```text
polish-course-detail-layout
fix-login-redirect-source
add-tool-usage-purchase-flow
upgrade-nuxt-3-12
```

### 第三步：写 proposal

写清楚：

- 哪个页面/流程有问题。
- 用户现在怎么受影响。
- 本次想达成什么体验。
- 哪些事情本次不做。
- 怎么验收。

### 第四步：写 design

前端 design 必须说明：

- 涉及哪些页面。
- 涉及哪些组件。
- 涉及哪些 composable。
- 调哪些接口。
- 登录态和权限怎么处理。
- loading、empty、error 状态怎么表现。
- 移动端和桌面端怎么适配。
- 是否需要后端同步。

### 第五步：写 spec

示例：

```text
Requirement: 未登录用户访问课程小节时保留来源

GIVEN 用户未登录
WHEN 用户打开 /course/lesson/:id
THEN 页面跳转 /login?from=/course/lesson/:id
```

好 spec 的标准是：测试照着点页面就能验收。

### 第六步：让 Codex 开发

推荐提示词：

```text
请先阅读 AGENTS.md、openspec/project.md、openspec/changes/<change-id>/ 下的 proposal/design/tasks/spec。
基于当前分支新建 codex/<change-id> 分支。
只实现 tasks.md 里的内容。
不要改无关页面和组件。
完成后运行 npm run generate，并用浏览器检查主要页面。
```

## 4. 本地开发基本命令

安装依赖：

```bash
npm ci --legacy-peer-deps
```

启动开发：

```bash
npm run dev
```

生成静态产物：

```bash
npm run generate
```

查看变更：

```bash
git status --short
git diff
git diff --cached
```

## 5. 提 PR 前必须检查

- [ ] 有 OpenSpec change，或者 PR 写明 `OpenSpec-Exempt: true` 和原因。
- [ ] 页面路径和 API 路径没有误改。
- [ ] 登录态、权限、跳转逻辑已验证。
- [ ] loading、empty、error 状态已考虑。
- [ ] 移动端和桌面端没有明显错位。
- [ ] `npm run generate` 已运行，或写明没运行原因。
- [ ] 没有提交 token、密钥、构建产物。

## 6. Reviewer 怎么审

Reviewer 要看：

- 是否满足 spec。
- 页面状态是否完整。
- API 调用是否统一封装。
- 是否破坏已有路由。
- 是否破坏登录态和权限。
- 样式是否影响交互。
- 是否有无关重构。
- 是否做过构建或浏览器验证。

## 7. 后续升级和微服务怎么配合

后端以后会升级基础组件，也可能拆微服务。前端必须同步维护 API 边界：

- 按业务域组织 composable。
- 不在页面散写接口。
- 新旧接口切换要有兼容策略。
- 错误处理要统一。
- 后端服务拆分时，前端 API client 先分域，再逐步切换 base path。

## 8. 出问题时怎么办

1. 先确认影响页面。
2. 记录 URL、用户角色、操作步骤、接口响应。
3. 找关联 PR 和 OpenSpec。
4. 能回滚先回滚。
5. 事后补 spec、测试和复盘。

前端的问题常常不是“页面坏了”这么简单，而是某个状态被忘了。把状态写进 spec，就少踩一遍。
