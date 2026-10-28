#!/bin/sh
set -eu

required_files="AGENTS.md SECURITY.md README.md Makefile docker-compose.yml .env.example packages/contracts/openapi/openapi.yaml"

for file in $required_files; do
	if [ ! -f "$file" ]; then
		echo "缺少必需文件: $file"
		exit 1
	fi
done

echo "结构检查通过"
./harness/scripts/check-generated.sh
./harness/scripts/test.sh
APP_ENV="${APP_ENV:-test}" \
BETTER_AUTH_URL="${BETTER_AUTH_URL:-http://localhost:3000}" \
NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}" \
BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-build-only-placeholder-secret-not-used-for-auth-at-least-32-characters}" \
DATABASE_URL="${DATABASE_URL:-postgres://build:build@localhost:5432/build?sslmode=disable}" \
API_INTERNAL_URL="${API_INTERNAL_URL:-http://localhost:8080}" \
pnpm --filter web build
echo "verify 完成；服务冒烟检查请在 API 启动后运行 make smoke"
