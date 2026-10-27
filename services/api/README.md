# Core API

Go + Gin 核心业务 API。

```bash
go run ./cmd/server
curl http://localhost:8080/healthz
```

业务模块建议按领域放在 `internal/modules/`，不要按 HTTP 动词堆叠所有处理器。
