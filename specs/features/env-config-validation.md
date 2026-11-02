## 目标

为 Web、Go API 和本地 Harness 建立集中式环境变量解析与启动校验，明确必需项、可选项和安全默认值，避免散落的 `os.Getenv` / `process.env` 读取导致配置漂移。

## 范围

### 包含

- 为 Go API 和 Next.js 分别提供共享配置加载入口。
- 校验 `APP_ENV`、应用 URL、数据库、认证密钥、内部 API 地址和邮件发送相关变量。
- 开发环境允许 Mailpit 捕获；生产环境缺少 SMTP 时启动失败，不回退到日志输出。
- `make doctor` 在本地检查关键环境变量是否可解析。
- 更新 `.env.example`、README 与路线图状态。

### 不包含

- 统一 API 错误格式、请求关联 ID、结构化日志（下一切片）。
- 支付、文件存储、Redis 业务接入和部署平台改造。
- 修改认证协议或数据库 schema。

## 领域规则

- `APP_ENV` 取值限定为 `development` / `test` / `production`；未设置时本地默认 `development`，构建校验可用 `test`。
- `BETTER_AUTH_SECRET` 至少 32 字符；生产环境禁止保留示例占位值。
- `BETTER_AUTH_URL`、`NEXT_PUBLIC_APP_URL`、`API_INTERNAL_URL`、`DATABASE_URL` 必须是绝对 URL / DSN，且可解析。
- 生产环境：`AUTH_EMAIL_MODE` 不得为 `mailpit`；必须提供 `SMTP_HOST`、`SMTP_PORT`、`SMTP_FROM`。
- Redis、S3 相关变量可为空；本切片只校验格式，不强制启用。
- 配置校验失败时在进程启动阶段失败，不带着半配置进入运行态。

## API 契约

- 本切片不新增业务 API。
- 现有 `/healthz` 继续可用；健康检查增强留给下一阶段。

## 验收条件

- [x] Go API 启动时通过集中配置加载；缺少 `DATABASE_URL` 或 issuer 时明确失败。
- [x] Web 认证配置与邮件发送读取同一配置模块，缺配置时在模块加载阶段失败。
- [x] `make doctor` 能报告缺失或非法环境变量；命令工具缺失与配置缺失都能阻断。
- [x] `.env.example` 与文档列出必需/可选变量及生产约束。
- [x] `make verify` 在注入测试占位环境变量后仍可通过。

## 验证命令

```bash
make doctor
make verify
```

## 风险与回滚

- 风险：现有本地 `.env` 缺少新增约束字段导致启动失败。
- 缓解：保持 `.env.example` 兼容现有开发默认值；文档说明生产额外约束。
- 回滚：恢复分散读取逻辑，不影响数据库与认证 schema。
