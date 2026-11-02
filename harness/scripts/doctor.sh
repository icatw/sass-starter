#!/bin/sh
set -eu

missing=0

load_env_file() {
	if [ -f .env ]; then
		set -a
		# shellcheck disable=SC1091
		. ./.env
		set +a
		echo "INFO loaded .env for configuration checks"
		return 0
	else
		echo "INFO .env missing; configuration checks use current shell environment"
		return 1
	fi
}

check_command() {
	command_name="$1"
	if command -v "$command_name" >/dev/null 2>&1; then
		echo "OK   $command_name: $(command -v "$command_name")"
	else
		echo "MISS $command_name"
		missing=$((missing + 1))
	fi
}

check_command go
check_command docker

if command -v go >/dev/null 2>&1; then
	go_version="$(go version | awk '{print $3}')"
	echo "INFO go version: $go_version"
	go_major_minor="$(printf '%s' "$go_version" | sed 's/^go//' | cut -d. -f1,2)"
	if ! awk -v version="$go_major_minor" 'BEGIN { split(version, current, "."); exit !((current[1] > 1) || (current[1] == 1 && current[2] >= 25)) }'; then
		echo "MISS Go 1.25+: 当前为 $go_version"
		missing=$((missing + 1))
	fi
fi

if [ -d apps/web ] && [ -f apps/web/package.json ]; then
	check_command node
	check_command pnpm
else
	echo "SKIP node/npm: apps/web 尚未初始化"
fi

env_file_present=0
if load_env_file; then
	env_file_present=1
fi

if [ "$env_file_present" -eq 1 ] || [ -n "${DATABASE_URL:-}" ] || [ -n "${BETTER_AUTH_URL:-}" ] || [ -n "${NEXT_PUBLIC_APP_URL:-}" ]; then
	if command -v go >/dev/null 2>&1 && [ -f services/api/go.mod ]; then
		if (
			cd services/api
			go run ./cmd/check-env
		) >/tmp/saas-starter-doctor-api-env.out 2>/tmp/saas-starter-doctor-api-env.err; then
			echo "OK   api env: $(cat /tmp/saas-starter-doctor-api-env.out)"
		else
			echo "MISS api env: $(tr '\n' ' ' </tmp/saas-starter-doctor-api-env.err)"
			missing=$((missing + 1))
		fi
	fi

	if command -v node >/dev/null 2>&1 && [ -f apps/web/lib/env.ts ]; then
		if node --experimental-strip-types ./harness/scripts/check-env.mjs >/tmp/saas-starter-doctor-web-env.out 2>/tmp/saas-starter-doctor-web-env.err; then
			cat /tmp/saas-starter-doctor-web-env.out
		else
			echo "MISS web env: $(tr '\n' ' ' </tmp/saas-starter-doctor-web-env.err)"
			missing=$((missing + 1))
		fi
	fi
else
	echo "SKIP env validation: run make setup and fill .env first"
fi

if [ "$missing" -gt 0 ]; then
	echo "环境检查发现 $missing 个问题"
	exit 1
fi

echo "环境检查通过"
