# ADR 0001: 项目架构

## 状态

Accepted

## 决策

- 使用 Next.js 作为 Web、Dashboard 和 BFF。
- 使用 Go + Gin 作为核心业务 API。
- 使用 OpenAPI 作为前后端契约。
- 使用 PostgreSQL 作为主数据库。
- Worker 和 Python AI 服务按业务需要启用。
- 通过 `harness`、规格文件和自动化验证支持 AI-native 研发。

## 原因

核心业务需要稳定的权限、计费、数据和审计边界；AI 能力与异步任务应保持可替换。

## 后果

需要维护跨语言的契约、生成流程和本地开发命令，但可以降低前后端耦合并提高 AI 修改代码时的可验证性。
