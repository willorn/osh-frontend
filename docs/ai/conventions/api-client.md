# API Client 约定

## 路径

- 前端调用优先走 `/api/**`。
- 开发代理把 `/api/**` 转到后端 `/pc/**`。
- `/api/qna/**` 有独立代理规则。

## 封装

- API 调用放 composables。
- 页面不要散写 `$fetch('/api/...')`。
- 同一业务域使用同一组 composable。

## 错误处理

- 登录失效统一跳转。
- 权限不足给明确提示。
- 业务失败展示用户能理解的消息。
- 网络失败要有重试或返回入口。

## 后端微服务化准备

后端拆服务前，前端先按业务域整理 API：

- user
- course
- order
- tool
- feedback
- content/search
