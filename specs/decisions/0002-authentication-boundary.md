# ADR 0002：邮箱认证与单实例授权边界

## 状态

已采纳

## 决策

- Better Auth 在 Next.js 中负责邮箱密码、验证邮件和数据库 Session；浏览器只持有 HttpOnly Cookie。
- Next 服务端先验证 Session，再签发有效期 60 秒、EdDSA、固定 issuer 与 `saas-api` audience 的内部 JWT。该 JWT 只包含 `sub`，公开的 `/api/auth/token` 被路由层拒绝。
- Gin 通过 Better Auth JWKS 验证 JWT，每次请求按 `sub` 实时读取用户验证状态、禁用状态和角色。
- 角色限定为 `user` 和 `admin`。单实例 Dashboard 与平台管理能力属于管理员控制台；普通用户入口为 `/account`。
- PostgreSQL 迁移由 `golang-migrate` 执行；Better Auth schema 变更生成新迁移，不覆盖已存在迁移。

## 后果

- 登出后尚未到期的内部 JWT 最多还能使用 60 秒；数据库用户状态与角色更新会在下一次 API 请求生效。
- 本地邮件通过 Mailpit 捕获；生产未配置 SMTP 时邮件发送失败，不写入日志。
- OAuth、MFA 和多租户保留为后续扩展，本 ADR 不引入其数据模型或流程。
