# SaaS Starter

面向独立开发者的 AI-native 全栈 SaaS 模板。

## 技术边界

- `apps/web`：Next.js Web、Dashboard、BFF
- `services/api`：Go + Gin 核心业务 API
- `services/worker`：可选异步任务和 Python AI 服务
- `packages/contracts`：OpenAPI 和错误码
- `packages/api-client`：生成的 TypeScript Client
- `db`：迁移、种子和 Fixture
- `specs`：功能规格、领域规则和 ADR
- `harness`：环境检查、冒烟测试和验证报告

Web 页面采用 Route Groups 组织营销、认证和 Dashboard 布局；前端业务按 `apps/web/features/` 划分，避免将页面、共享组件和业务逻辑混在单个目录。

## 快速开始

前置环境：Go 1.25.11+、Docker、Node.js 24+ 和 Corepack/pnpm 9.15.0。

```bash
cp .env.example .env
make doctor
make setup
make dev
```

首次启动认证基础设施与迁移：

```bash
corepack enable
pnpm install
set -a && . ./.env && set +a
make db-migrate
pnpm dev
```

`make dev` 启动 PostgreSQL、Redis 和 Mailpit；开发环境认证邮件会进入 [Mailpit](http://localhost:8025)。生产环境必须配置有效 SMTP，不会将认证链接写入日志。Better Auth 使用 `BETTER_AUTH_SECRET`（至少 32 个字符）、`BETTER_AUTH_URL` 和 `DATABASE_URL`。

注册默认创建普通用户。用户验证邮箱后可登录并访问 `/account`；Dashboard、`/admin/**` 和平台计费页面仅管理员可访问。已验证账户可通过以下命令安全提升为管理员，重复执行不会产生副作用：

```bash
set -a && . ./.env && set +a
cd services/api && go run ./cmd/promote-admin verified@example.com
```

核心页面：营销首页 `/`、登录 `/login`、注册 `/register`、普通用户账户 `/account`、个人任务示例 `/account/tasks`、管理员 Dashboard `/dashboard`。普通用户可编辑姓名和管理自己的示例任务；管理员 Dashboard 的“用户”页可查看最近注册账号。认证邮件和密码重置分别使用一次性、一小时有效链接。

Better Auth 初始 schema 迁移位于 `db/migrations/000001_auth_schema.up.sql`。只有尚未发布/执行的初始迁移才允许重新生成；后续 schema 变更必须新增迁移。

schema 差异使用 `make auth-schema` 生成新的带序号 `.up.sql`，命令会拒绝覆盖旧迁移；请检查生成 SQL、补齐对应 `.down.sql`，然后运行 `make db-migrate`。`make generate` 重新生成 OpenAPI Client；`make contract-check` 检查生成文件与契约是否一致。认证全链路冒烟测试入口为 `make auth-smoke`，要求 Web、API、PostgreSQL 和 Mailpit 都已启动。`make verify` 包含契约一致性检查，并由 GitHub Actions 在 PR 和 `main` 推送时执行。

## AI-native 工作流

1. 在 `specs/features/` 创建功能规格和验收条件。
2. 更新 `packages/contracts/openapi/` 中的契约。
3. 实现 Gin API、数据库迁移和 Web 页面。
4. 运行 `make generate`、`make test`、`make smoke` 和 `make verify`。
5. 检查 diff，并报告证据和未验证事项。

## 目录

```text
apps/ services/ packages/ db/ specs/ harness/ .agents/ deploy/ .github/
```
