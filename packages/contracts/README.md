# API Contracts

`openapi/openapi.yaml` 是 API 契约的唯一来源。

修改 API 时：

1. 先更新 OpenAPI。
2. 运行 `make generate` 生成 Client。
3. 修改 Go API 实现。
4. 运行契约测试和冒烟测试。
