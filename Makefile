SHELL := /bin/sh

API_DIR := services/api

.PHONY: doctor setup dev api web db-migrate db-reset generate test smoke verify

doctor:
	@./harness/scripts/doctor.sh

setup:
	@./harness/scripts/setup.sh

dev:
	@docker compose up -d postgres redis
	@echo "基础服务已启动：PostgreSQL、Redis"
	@echo "另开终端运行 make api 或 make web"

api:
	@cd $(API_DIR) && go run ./cmd/server

web:
	@pnpm --filter web dev

db-migrate:
	@echo "数据库迁移命令将在数据库工具选型后接入"

db-reset:
	@docker compose down -v
	@docker compose up -d postgres redis

generate:
	@./harness/scripts/generate.sh

test:
	@./harness/scripts/test.sh

smoke:
	@./harness/scripts/smoke.sh

verify:
	@./harness/scripts/verify.sh
