#!/bin/sh
set -eu

if [ -f services/api/go.mod ]; then
	(cd services/api && go test ./...)
fi

if [ -f apps/web/package.json ]; then
	 pnpm --filter web typecheck
	 pnpm --filter web lint
	 node --experimental-strip-types --test ./harness/scripts/env.test.mjs
fi

echo "测试入口执行完成"
