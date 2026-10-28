# CI 工作流

`ci.yml` 在 Pull Request 和 `main` 分支推送时运行 `make verify`，包括 OpenAPI Client 同步检查、Go 测试、Web 类型检查、Lint 和 Next.js 构建。

CI 不使用真实密钥或外部账户。认证端到端冒烟依赖 PostgreSQL、Mailpit 和完整认证环境，当前仍通过本地 `make auth-smoke` 执行，后续可单独评估稳定的服务容器方案。
