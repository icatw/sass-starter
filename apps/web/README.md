# Web

Next.js Web、Dashboard 和少量必要 BFF 接口。

应用使用 pnpm workspace 管理。仓库根目录安装依赖并启动：

```bash
pnpm install
pnpm --filter web dev
```

路由采用 App Router Route Groups：`(marketing)`、`(auth)`、`(dashboard)` 仅用于组织布局，不进入 URL。Dashboard 位于 `/dashboard`，管理页面位于 `/admin/...`，计费页面位于 `/billing/...`。

目前 Dashboard 展示内存 Mock 数据，认证、后端授权和业务 API 尚未接入。其他无 API 支持的功能会显示占位说明。

页面级业务逻辑和组件放入 `features/`；跨功能复用的 UI 放入 `components/`；共享工具、服务端 API Client 和配置放入 `lib/`。

前端通过 `packages/api-client` 调用 Go API；不要在组件中散落手写 API URL 和响应类型。仅在需要处理浏览器 Session、聚合数据或隐藏内部 API 地址时新增 `app/api` BFF Route Handler。
