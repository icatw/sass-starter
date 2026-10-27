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

前置环境：Go 1.25+、Docker、Node.js 24+ 和 Corepack/pnpm 9.15.0。

```bash
cp .env.example .env
make doctor
make setup
make dev
```

当前仓库包含已整合的 Next.js Dashboard UI、最小 Go 健康检查服务和项目 Harness。Dashboard 数据目前来自前端内存 Mock；登录、权限、账单和其他管理模块仍是占位实现，不能用于生产业务。

```bash
corepack enable
pnpm install
pnpm dev
```

核心页面：营销首页 `/`、登录 `/login`、Dashboard `/dashboard`、用户管理 `/admin/users`、订单 `/admin/orders`、订阅 `/admin/subscriptions`、计费 `/billing` 和设置 `/settings`。

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
