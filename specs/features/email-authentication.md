# 邮箱认证与单实例权限

## 范围

- 邮箱密码注册、邮箱验证、登录、登出、忘记和重置密码、Session 查询。
- 单实例角色：`user` 与 `admin`。注册接口不能设置角色；管理员由命令提升已验证用户。
- Next.js 持有 Better Auth Session Cookie；服务端通过 60 秒 EdDSA JWT 调用 Go API。
- Go 按 JWT `sub` 查 PostgreSQL 用户状态和角色，作为最终授权依据。
- 不包含 OAuth、MFA、组织成员、多租户、部署平台变更。

## 验收条件

- 未验证邮箱不能登录；验证/重置链接一小时有效且一次性使用。
- 密码重置撤销旧 Session；登出后 Session 不再有效。
- Session 七天过期、24 小时滚动刷新；浏览器 Cookie 为 HttpOnly、SameSite=Lax、Path=/，生产环境 Secure，不设置 Domain。
- 内部 JWT 使用 EdDSA、固定 issuer、`saas-api` audience、60 秒过期，只包含稳定用户标识，不含授权角色。
- Go 固定算法并验证签名、issuer、audience、exp、sub，实时查邮箱验证/禁用状态和角色。
- `/v1/me` 未登录返回 401；管理员资源中普通用户返回 403；所有变更 API 要求匹配应用 Origin。
- 开发 SMTP 指向 Mailpit；生产缺少 SMTP 配置时邮件失败关闭，不写日志兜底。

## 验证入口

- `make auth-smoke`：需要 Web、Go API、PostgreSQL、Mailpit 已启动。
- `make test`：包含 JWT、401/403 和 Go 权限测试以及 Web lint/typecheck。
