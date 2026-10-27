#!/bin/sh
set -eu

if [ -f packages/contracts/openapi/openapi.yaml ]; then
	echo "发现 OpenAPI 契约"
	pnpm --filter web api:generate
else
	echo "缺少 OpenAPI 契约"
	exit 1
fi

echo "OpenAPI Client 已生成"
