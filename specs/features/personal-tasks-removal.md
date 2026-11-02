## 目标

说明如何安全移除个人任务示例，且不破坏认证、用户目录、OpenAPI 生成、迁移流程和基础 Harness。

## 删除范围

移除示例时，只删除以下产品切片相关文件与引用；不要回滚认证迁移或通用基础设施。

### 代码与页面

- `apps/web/app/account/tasks/`
- `apps/web/lib/tasks/`
- `apps/web/app/account/page.tsx` 中指向 `/account/tasks` 的入口
- `apps/web/lib/i18n/dictionaries/*.ts` 中的 `tasks` 文案块
- `services/api/cmd/server/main.go` 中的 `task` 类型、CRUD handler 与 `/v1/tasks*` 路由注册
- `services/api/cmd/server/auth_test.go` 中的 tasks 相关用例外

### 契约与文档

- `packages/contracts/openapi/openapi.yaml` 中的 `/v1/tasks`、`/v1/tasks/{taskId}` 与 `Task` schema
- 重新执行 `make generate`，更新 `packages/api-client`
- `specs/features/personal-tasks.md`、本移除说明、README 中示例页面说明

### 数据库

- 已发布环境：新增迁移删除 `tasks` 表，例如 `00000N_drop_personal_tasks.up.sql`
- 未发布的本地模板：可保留 `000003_personal_tasks.*` 作为历史，或在干净模板中用新迁移删除；**不要改写已执行过的旧迁移内容**

## 必须保留

- 认证迁移：`000001_auth_schema.*`、`000002_user_role_constraints.*`
- Better Auth、`/v1/me`、`/v1/admin/users`、env 校验、`httpx`、CI、`make verify`
- `harness/scripts/*`、`Makefile`、`.github/workflows/ci.yml`

## 验收步骤

1. 按上面清单删除示例引用并更新 OpenAPI。
2. 运行：

```bash
make generate
make contract-check
make test
make verify
```

3. 确认：
   - `/account`、登录注册、管理员用户目录仍可用
   - `/v1/tasks` 不再出现在 OpenAPI 与生成 Client
   - `make doctor` / `make verify` 不依赖 tasks 页面或 tasks 路由

## 验证命令

```bash
./harness/scripts/check-example-removable.sh
make verify
```
