## 目标

为管理员提供账号停用与恢复能力，使后台用户目录从只读查看升级为可执行的基础运营操作；停用后立即切断该账号的已有 Session，并阻止后续 API 访问。

## 范围

### 包含

- 管理员停用或恢复指定用户。
- 停用时删除该用户全部 Better Auth Session。
- 防止管理员停用自己。
- 防止停用系统中最后一个未停用的管理员。
- 管理页提供操作按钮、成功后刷新，以及失败提示。

### 不包含

- 角色变更、邀请、模拟登录、批量操作。
- 完整审计日志（仅预留后续扩展；本切片不做审计表）。
- 搜索、分页、筛选。

## 领域规则

- 仅 `admin` 可调用；目标用户不存在返回 404。
- 请求体只接受 `{ disabled: boolean }`。
- 不能修改自己的 `disabled` 状态。
- 若目标是管理员且操作是停用，系统中必须仍保留至少 1 个未停用管理员。
- 停用成功后删除 `sessions` 中该用户全部记录；恢复账号不自动重建 Session。
- Go 认证中间件继续拒绝 `disabled=true` 的账号，即使仍持有未过期内部 JWT。

## API 契约

- `PATCH /v1/admin/users/{userId}`
- 请求：`{ disabled: boolean }`
- 响应：`{ user: AdminUser }`
- 错误：
  - 400 `INVALID_USER_STATUS`
  - 401 `UNAUTHENTICATED`
  - 403 `FORBIDDEN`
  - 404 `USER_NOT_FOUND`
  - 409 `LAST_ADMIN`
  - 500 `INTERNAL_ERROR`

## 验收条件

- [x] 管理员可停用普通用户；该用户现有 Session 失效，后续 `/v1/me` 返回 401。
- [x] 管理员可恢复已停用用户。
- [x] 管理员停用自己被拒绝。
- [x] 停用最后一个未停用管理员被拒绝。
- [x] 管理页展示操作结果；中英文文案齐全。
- [x] `make generate` 与 `make verify` 通过。

## 验证命令

```bash
cd services/api && go test ./cmd/server
make generate
make verify
```
