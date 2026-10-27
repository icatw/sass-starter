# Security Policy

## Trust boundaries

- Next.js 是用户交互和 BFF 层，不是最终授权边界。
- Go API 是身份、租户、权限、计费和数据访问的最终授权边界。
- Worker 通过受控内部接口或队列访问业务数据。
- 本地开发服务使用测试数据；生产凭据通过部署平台的 Secret 管理注入。

## Required controls

- HTTP-only、Secure、SameSite Cookie 或经过签名和过期校验的内部身份令牌。
- 每个租户资源查询都必须带有服务端授权条件。
- Webhook 必须验证签名并使用幂等键。
- 文件上传使用短期预签名 URL，并校验大小、类型和归属。
- 日志不得输出 Token、密码、Cookie、完整 Authorization 或用户隐私内容。

## Reporting

请不要在 Issue、日志或测试 Fixture 中提交真实凭据和真实用户数据。
