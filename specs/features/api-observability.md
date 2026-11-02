## 目标

为 Go API 建立统一错误响应、请求关联 ID、结构化访问日志和分层健康检查，使本地排查与后续功能开发能按同一约定定位问题。

## 范围

### 包含

- 统一错误体：`code`、`message`、`requestId`。
- 请求关联 ID：读取或生成 `X-Request-Id`，写入响应头、错误体和日志。
- 结构化 JSON 访问日志与 panic recovery；不记录 Authorization、Cookie、密码等凭据。
- `/healthz` 存活检查与 `/readyz` 就绪检查（至少探测 PostgreSQL）。
- 更新 OpenAPI、生成 Client、smoke 与相关测试。

### 不包含

- OpenTelemetry 全链路追踪、Sentry、集中日志平台。
- 前端统一错误展示组件重构（本切片只保证 API 契约可被前端使用）。
- Redis/S3 探活（未作为必需依赖前不强制）。

## 领域规则

- 所有 4xx/5xx JSON 错误必须包含稳定机器可读 `code`、人类可读 `message` 和 `requestId`。
- 若请求携带合法 `X-Request-Id`（可见 ASCII，长度 1–128），则复用；否则服务端生成。
- 访问日志字段至少包括：时间、级别、requestId、method、path、status、latency。
- `/healthz` 只表示进程可响应；`/readyz` 失败时返回 503 与统一错误体。
- panic 被捕获后返回 `INTERNAL_ERROR`，并记录带 requestId 的错误日志。

## API 契约

- `GET /healthz`：存活。
- `GET /readyz`：就绪；依赖数据库不可用时 503。
- `ErrorResponse` 增加 `requestId`。

## 验收条件

- [x] 未认证访问受保护接口返回带 `requestId` 的统一错误体，并回写 `X-Request-Id` 响应头。
- [x] 传入合法 `X-Request-Id` 时原样回传；非法值被替换为新 ID。
- [x] `/readyz` 在数据库可连时 200，不可连时 503。
- [x] 访问日志为 JSON，且不包含 Authorization 头内容。
- [x] `make generate` 与 `make verify` 通过。

## 验证命令

```bash
cd services/api && go test ./...
make generate
make verify
```

## 风险与回滚

- 风险：错误体新增 `requestId` 后，旧客户端若做严格字段校验可能受影响；当前生成 Client 允许额外字段。
- 回滚：恢复 Gin 默认 Logger/Recovery 与手写错误 JSON。
