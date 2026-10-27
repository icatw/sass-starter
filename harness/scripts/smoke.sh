#!/bin/sh
set -eu

api_url="${API_INTERNAL_URL:-http://localhost:8080}"

if command -v curl >/dev/null 2>&1; then
	if curl --fail --silent --show-error "$api_url/healthz" >/dev/null; then
		echo "API health smoke passed"
	else
		echo "API health smoke skipped or failed: $api_url/healthz"
		exit 1
	fi
else
	echo "缺少 curl，无法执行 API 冒烟检查"
	exit 1
fi
