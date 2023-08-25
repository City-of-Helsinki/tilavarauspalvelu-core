.PHONY: bash
.PHONY: clear-db
.PHONY: db-reset
.PHONY: dev
.PHONY: flush
.PHONY: generate
.PHONY: help
.PHONY: hooks
.PHONY: indices
.PHONY: Makefile
.PHONY: migrate
.PHONY: migrations
.PHONY: run
.PHONY: services
.PHONY: services-local-start
.PHONY: services-local-stop
.PHONY: services-local-status
.PHONY: stop

define helptext

 Commands:

  bash                               Open bash in backend container.
  clear-db                           Reset database.
  dev                                Run local backend.
  flush-db                           Flush database.
  generate                           Generate test data via a script.
  hooks                              Add pre-commit hooks.
  indices                            Rebuild search indices.
  migrate                            Run database migrations.
  migrations                         Compile database migrations.
  run                                Start docker containers for frontend development.
  services                           Run required services in docker.
  services-local-start               Start required services locally with 'systemctl'.
  services-local-stop                Stop required services locally with 'systemctl'.
  services-local-status              Check status of services running locally with 'systemctl'.
  stop                               Stop running containers.

endef

export helptext

# Help should be first so that make without arguments is the same as help
help:
	@echo "$$helptext"

bash:
	@docker exec -it tvp-core bash

clear-db:
	@python manage.py dbshell -- -c "DROP SCHEMA public CASCADE;CREATE SCHEMA public;"

dev:
	@python manage.py runserver localhost:8000

flush-db:
	@python manage.py flush --no-input

generate:
	@python manage.py create_test_data

hooks:
	@pre-commit install

indices:
	@python manage.py rebuild_search_index reservation_units

migrate:
	@python manage.py migrate

migrations:
	@python manage.py makemigrations

run:
	@docker compose up --detach --build

services:
	@docker compose up --detach --build db elastic redis

services-local-start:
	@echo "Starting PostgreSQL..."
	@sudo systemctl start postgresql
	@echo "Starting Redis..."
	@sudo systemctl start redis-server
	@echo "Starting ElasticSearch..."
	@sudo systemctl start elasticsearch.service
	@echo "Done!"

services-local-stop:
	@echo "Stopping PostgreSQL..."
	@sudo systemctl stop postgresql
	@echo "Stopping Redis..."
	@sudo systemctl stop redis-server
	@echo "Stopping ElasticSearch..."
	@sudo systemctl stop elasticsearch.service
	@echo "Done!"

services-local-status:
	@echo -n "PostgreSQL status: "
	@sudo systemctl is-active postgresql || true
	@echo -n "Redis status: "
	@sudo systemctl is-active redis-server || true
	@echo -n "ElasticSearch status: "
	@sudo systemctl is-active elasticsearch.service || true

stop:
	@docker compose stop
