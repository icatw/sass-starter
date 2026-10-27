# SaaS Starter 项目协作规范

## 项目定位

这是一个面向 AI 辅助研发的全栈 SaaS 模板：Next.js Web、Go + Gin 核心 API、可选异步 Worker，以及 OpenAPI 驱动的前后端契约。

## 架构边界

- `apps/web`：营销页面、Dashboard、BFF 和用户交互。
- `services/api`：用户、组织、权限、业务规则、计费和审计等核心 API。
- `services/worker`：异步任务；只有确实需要时才加入 Python AI 能力。
- `packages/contracts/openapi`：OpenAPI 是 API 契约唯一来源。
- `packages/api-client`：由契约生成的 TypeScript Client，不手工修改。
- `specs`：需求、领域规则和 ADR；不要把业务规则只写在 Prompt 中。
- `harness`：开发环境检查、Fixture、冒烟验证和报告。

## 开发方式

1. 先阅读相关 `specs/features`、`specs/domain`、ADR 和本目录规则。
2. 每次只实现一个垂直功能切片：数据、API、契约、前端和验证一起完成。
3. 先确认基线状态，再修改文件；保留用户已有改动。
4. API 变更先更新 OpenAPI 契约，再更新实现和生成 Client。
5. 数据库变更必须新增迁移文件，不要修改已执行的迁移。
6. 完成后运行与改动范围匹配的验证，并报告命令、结果和未验证事项。

## Web Skills

项目级 Vercel Skills 位于 `.agents/skills/`，按任务类型加载对应 Skill：

- `vercel-react-best-practices`：编写、审查或优化 React / Next.js 组件和数据加载。
- `web-design-guidelines`：用户要求 UI、可访问性或 UX 审查时使用。
- `vercel-composition-patterns`：设计或重构可复用 React 组件 API 时使用。
- `vercel-react-view-transitions`：明确涉及 React View Transition 动效时使用。

不要为普通页面改动强行套用所有 Skills。Next.js 版本相关实践以当前安装版本自带文档为准；开发服务器生成的 Next.js `AGENTS.md` / `.next-docs` 文档可补充本文件，不得覆盖项目业务规则。

## 常用命令

```bash
make doctor
make setup
make dev
make db-migrate
make db-reset
make generate
make test
make smoke
make verify
```

## 安全边界

- 不提交 `.env`、Token、密码、Cookie、私钥或真实用户数据。
- 不让 API 通过单独的 `X-User-ID` 信任身份。
- 认证、权限、计费和额度由 Go API 负责最终校验。
- 外部副作用、生产配置、数据库清理和部署需要明确的任务范围。

## 代码审查

- 优先检查权限、数据隔离、幂等、迁移兼容性和错误处理。
- 生成文件不手工修改；修改源契约后重新生成。
- 不把“命令执行成功”当成业务验证成功，必须检查实际响应或页面行为。
