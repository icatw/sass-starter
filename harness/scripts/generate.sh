#!/bin/sh
set -eu

if [ -f packages/contracts/openapi/openapi.yaml ]; then
	echo "发现 OpenAPI 契约"
	# TODO: 选定生成器后在这里生成 packages/api-client。
	# 生成物禁止手工修改。
else
	echo "缺少 OpenAPI 契约"
	exit 1
fi

echo "契约生成入口已执行；生成器尚未接入"
