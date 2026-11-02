# Core API

Go + Gin 核心业务 API。

```bash
set -a && . ../../.env && set +a
go run ./cmd/server
curl http://localhost:8080/healthz
curl http://localhost:8080/readyz
```

`/v1/me` 通过 Better Auth JWT 插件签发的 60 秒 EdDSA 凭据鉴权，并从 PostgreSQL 读取当前用户验证状态和角色。`GET /v1/admin/users` 与 `PATCH /v1/admin/users/:userId` 仅管理员可访问；管理员受限路由使用 `authz.RequireAdmin` 中间件。

服务入口只负责装配。认证中间件在 `internal/authz`，路由装配在 `internal/app`，业务处理器按领域放在 `internal/modules/`。

API 统一错误体为 `{ code, message, requestId }`，每个响应都会回写 `X-Request-Id`。`/healthz` 仅表示进程存活，`/readyz` 会探测 PostgreSQL 是否可用。

管理员引导命令：

```bash
go run ./cmd/promote-admin verified@example.com
```

当前已拆出 `adminusers`、`auditlogs` 与可移除的 `tasks` 示例模块；新增业务时继续按领域扩展，不要把处理器继续堆回 `cmd/server/main.go`。
