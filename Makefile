SHELL := /bin/sh

API_DIR := services/api

.PHONY: doctor setup dev api web db-migrate db-reset generate auth-schema test smoke auth-smoke verify

doctor:
	@./harness/scripts/doctor.sh

setup:
	@./harness/scripts/setup.sh

dev:
	@docker compose up -d postgres redis mailpit
	@echo "基础服务已启动：PostgreSQL、Redis、Mailpit (http://localhost:8025)"
	@echo "另开终端运行 make api 或 make web"

api:
	@cd $(API_DIR) && go run ./cmd/server

web:
	@pnpm --filter web dev

db-migrate:
	@test -n "$(DATABASE_URL)" || (echo "请先设置 DATABASE_URL" && exit 1)
	@cd $(API_DIR) && go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate -path ../../db/migrations -database "$(DATABASE_URL)" up

db-reset:
	@docker compose down -v
	@docker compose up -d postgres redis mailpit

generate:
	@./harness/scripts/generate.sh

auth-schema:
	@pnpm --filter web auth:schema

test:
	@./harness/scripts/test.sh

smoke:
	@./harness/scripts/smoke.sh

auth-smoke:
	@node ./harness/scripts/auth-smoke.mjs

verify:
	@./harness/scripts/verify.sh
