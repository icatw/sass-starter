#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$repo_root"

if [ -z "${DATABASE_URL:-}" ]; then
	echo "请先设置 DATABASE_URL；schema 生成会检查当前数据库结构" >&2
	exit 1
fi

next_version=1
for migration in db/migrations/[0-9]*.up.sql; do
	[ -e "$migration" ] || continue
	filename=${migration##*/}
	version=${filename%%_*}
	version_number=$(expr "$version" + 0)
	if [ "$version_number" -ge "$next_version" ]; then
		next_version=$((version_number + 1))
	fi
done

tmp_file=$(mktemp "${TMPDIR:-/tmp}/saas-auth-schema.XXXXXX")
trap 'rm -f "$tmp_file"' EXIT HUP INT TERM
pnpm --filter web exec auth generate --config ./lib/auth/config.ts --output "$tmp_file" --yes

if [ ! -s "$tmp_file" ]; then
	echo "Better Auth schema 已与数据库一致；没有新迁移"
	exit 0
fi

version=$(printf '%06d' "$next_version")
target="db/migrations/${version}_auth_schema.up.sql"
if [ -e "$target" ]; then
	echo "迁移文件已存在，拒绝覆盖: $target" >&2
	exit 1
fi
mv "$tmp_file" "$target"
echo "已生成 $target；请补充对应 down.sql 并审阅 SQL 后再执行迁移"
