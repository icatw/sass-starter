# Domain Model

在这里记录跨模块稳定的领域概念、状态机、不变量和数据隔离规则。

具体功能规则优先写在 `specs/features/`，不要在这里重复复制。
## 身份与权限

- 用户角色仅有 `user` 与 `admin`；角色由服务器维护。
- 邮箱必须验证后才可建立登录 Session。
- Session Cookie 只在 Next.js/BFF 信任边界内使用。Go API 使用短时内部 JWT 识别用户，但每次请求都从 PostgreSQL 获取当前角色和账号状态。
- 用户被禁用、邮箱验证状态撤销或角色变更时，Go API 下一个请求立即采用数据库状态。
- 管理员提升通过 `services/api/cmd/promote-admin` 执行，目标用户必须已有已验证邮箱。
