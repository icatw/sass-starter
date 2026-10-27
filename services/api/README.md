# Core API

Go + Gin 核心业务 API。

```bash
set -a && . ../../.env && set +a
go run ./cmd/server
curl http://localhost:8080/healthz
```

`/v1/me` 通过 Better Auth JWT 插件签发的 60 秒 EdDSA 凭据鉴权，并从 PostgreSQL 读取当前用户验证状态和角色。管理员受限路由使用 `requireAdmin` 中间件。

管理员引导命令：

```bash
go run ./cmd/promote-admin verified@example.com
```

业务模块建议按领域放在 `internal/modules/`，不要按 HTTP 动词堆叠所有处理器。
