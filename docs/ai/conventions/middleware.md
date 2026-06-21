# Middleware 约定

- middleware 只处理路由级逻辑。
- 登录态判断要一致。
- 跳转要保留来源。
- 不在 middleware 做慢接口串行阻塞，除非必须。
- 权限失败要给用户清晰去向。
