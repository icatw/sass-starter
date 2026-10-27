# Worker

可选的异步任务执行器。

约定：

- 普通任务可以使用 Go Worker。
- AI、文档解析和数据处理可以使用 Python Worker。
- Worker 不绕过 API 的权限和领域规则直接修改核心数据。
