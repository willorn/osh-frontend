# 构建与部署约定

- 当前构建命令：`npm run generate`。
- 构建产物目录：`.output/public`。
- CI 使用 Node 18。
- 依赖安装使用 `npm ci --legacy-peer-deps`。
- 修改 Nuxt 配置、依赖版本、构建输出路径必须写 OpenSpec。
