## 目标

为管理员提供可查询的操作审计证据。首版先覆盖用户停用/恢复事件，并提供最近事件列表页面。

## 范围

### 包含

- 新增 `audit_logs` 表与迁移。
- 管理员停用/恢复用户成功后，在同一事务内写入审计事件。
- `GET /v1/admin/audit-logs` 返回最近 100 条事件。
- `/audit-logs` 页面展示时间、操作者、动作、资源、请求 ID 与 metadata。

### 不包含

- 搜索、分页、筛选、导出。
- 角色变更、登录失败、设置变更等其他事件类型。
- 自动清理/保留策略作业。

## 领域规则

- 仅 `admin` 可查询审计日志。
- 审计写入失败时，管理操作必须整体失败并回滚，不能出现“状态已改但无审计证据”。
- metadata 只记录非敏感字段：`disabled`、`targetEmail`、`targetRole`、`emailVerified`；不记录密码、Session、JWT。
- 事件动作首版仅允许：`user.disable`、`user.restore`。
- 资源类型首版仅允许：`user`。

## API 契约

- `GET /v1/admin/audit-logs`
- 响应：`{ events: AuditLogEvent[] }`
- 错误：
  - 401 `UNAUTHENTICATED`
  - 403 `FORBIDDEN`
  - 500 `INTERNAL_ERROR`

## 验收条件

- [x] 空库可执行 `000004_audit_logs` 迁移。
- [x] 管理员停用用户后可在审计列表看到 `user.disable`。
- [x] 管理员恢复用户后可在审计列表看到 `user.restore`。
- [x] 普通用户访问审计接口返回 403。
- [x] `/audit-logs` 覆盖加载、空数据、成功和错误状态；中英文文案齐全。
- [x] `make generate` 与 `make verify` 通过。

## 验证命令

```bash
cd services/api && go test ./...
make generate
make verify
```
