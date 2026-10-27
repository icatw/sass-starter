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
./harness/scripts/test.sh
pnpm --filter web build
echo "verify 完成；服务冒烟检查请在 API 启动后运行 make smoke"
