#!/bin/sh
set -eu

if [ ! -f .env ]; then
	cp .env.example .env
	echo "已创建 .env，请按本地环境补充配置"
else
	echo ".env 已存在，保留现有配置"
fi

echo "项目基础设置完成"
