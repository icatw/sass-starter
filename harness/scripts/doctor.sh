#!/bin/sh
set -eu

missing=0

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

if [ "$missing" -gt 0 ]; then
	echo "环境检查发现 $missing 个必需命令缺失"
	exit 1
fi

echo "环境检查通过"
