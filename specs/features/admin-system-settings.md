## 目标

为管理员提供只读的运行配置快照，便于确认当前实例的环境、认证签发方与数据库是否已接入，不暴露任何密钥。

## 范围

### 包含

- `GET /v1/admin/settings` 返回非敏感字段：`appEnv`、`apiPort`、`issuerURL`、`audience`、`databaseConfigured`。
- `/settings` 页面同时展示 Web 侧公开配置与 API 快照。
- 导航将系统设置标记为可用。
- OpenAPI 契约与生成的 TypeScript Client。

### 不包含

- 任何可写设置、密钥轮换、SMTP / 数据库连接串展示。
- 工作区品牌编辑、API Key、Webhook 端点。
- 多租户、OAuth、MFA、支付相关配置。

## 领域规则

- 仅 `admin` 可读取系统设置。
- 响应与页面不得包含 `BETTER_AUTH_SECRET`、SMTP 密码、数据库 DSN 或其他凭据。
- 本切片为只读；后续可写配置必须单独规格化和审计。

## API 契约

- `GET /v1/admin/settings`
- 响应：`{ settings: AdminSettings }`
- 错误：
  - 401 `UNAUTHENTICATED`
  - 403 `FORBIDDEN`

## 验收条件

- [x] 管理员可读取设置快照；普通用户返回 403。
- [x] 响应体不含 password / secret 等敏感字段。
- [x] `/settings` 覆盖成功、加载失败状态；中英文文案齐全。
- [x] 导航标记为 `available`。
- [x] `make generate` 与 `make verify` 通过。

## 验证命令

```bash
cd services/api && go test ./...
make generate
make verify
```
