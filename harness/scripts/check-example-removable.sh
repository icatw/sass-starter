#!/bin/sh
set -eu

# Inventory check: ensure platform foundations do not hard-depend on the
# personal-tasks example. This does not delete files; it verifies the template
# can keep working after the example is removed according to the removal guide.

required_platform_files="
AGENTS.md
Makefile
.github/workflows/ci.yml
packages/contracts/openapi/openapi.yaml
services/api/cmd/server/main.go
apps/web/lib/auth/config.ts
db/migrations/000001_auth_schema.up.sql
db/migrations/000002_user_role_constraints.up.sql
harness/scripts/verify.sh
"

for file in $required_platform_files; do
	if [ ! -f "$file" ]; then
		echo "缺少平台必需文件: $file"
		exit 1
	fi
done

if ! grep -q '/v1/me' packages/contracts/openapi/openapi.yaml; then
	echo "OpenAPI 缺少认证核心接口 /v1/me"
	exit 1
fi

if ! grep -q '/v1/admin/users' packages/contracts/openapi/openapi.yaml; then
	echo "OpenAPI 缺少管理员用户目录接口 /v1/admin/users"
	exit 1
fi

# Makefile / CI must not require the example UI path.
if grep -n 'account/tasks' Makefile .github/workflows/*.yml >/dev/null 2>&1; then
	echo "Makefile/CI 不应硬编码示例页面 /account/tasks"
	exit 1
fi

# Auth smoke may mention the example page only when gated by file existence.
if [ -f harness/scripts/auth-smoke.mjs ]; then
	if grep -q "account/tasks" harness/scripts/auth-smoke.mjs; then
		if ! grep -q "existsSync(new URL('../../apps/web/app/account/tasks/page.tsx'" harness/scripts/auth-smoke.mjs; then
			echo "auth-smoke.mjs 引用 /account/tasks 时必须按示例文件是否存在做可选检查"
			exit 1
		fi
	fi
fi

echo "示例可移除性检查通过：平台文件完整，Harness/CI 不硬依赖 /account/tasks"
