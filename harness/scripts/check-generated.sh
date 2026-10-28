#!/bin/sh
set -eu

generated_file="packages/api-client/src/schema.d.ts"
temporary_file="$(mktemp)"
trap 'rm -f "$temporary_file"' EXIT HUP INT TERM

if [ ! -f "$generated_file" ]; then
	echo "缺少生成的 OpenAPI Client: $generated_file"
	exit 1
fi

pnpm --filter web exec openapi-typescript ../../packages/contracts/openapi/openapi.yaml -o "$temporary_file"

if ! cmp -s "$generated_file" "$temporary_file"; then
	echo "OpenAPI Client 与契约不同步，请运行 make generate 并提交生成结果。"
	diff -u "$generated_file" "$temporary_file" || true
	exit 1
fi

echo "OpenAPI Client 与契约一致"
