.PHONY: help
.PHONY: dev
.PHONY: bash
.PHONY: generate
.PHONY: db-reset
.PHONY: migrations
.PHONY: flush
.PHONY: clear-db


define helptext

 Commands:

  dev                                Start docker containers for frontend development.
  bash                               Open bash in backend container.
  clear-db                           Reset database.
  flush-db                           Flush database.
  migrations                         Compile database migrations.
  migrate                            Run database migrations.
  generate                           Generate test data via a script.

endef

export helptext

# Help should be first so that make without arguments is the same as help
help:
	@echo "$$helptext"

dev:
	@docker compose up --detach --build db elastic redis backend

bash:
	@docker exec -it tilavarauspalvelu_core bash

clear-db:
	@python manage.py dbshell -- -c "DROP SCHEMA public CASCADE;CREATE SCHEMA public;"

flush-db:
	@python manage.py flush --no-input

migrations:
	@python manage.py makemigrations

migrate:
	@python manage.py migrate

generate:
	@python manage.py create_test_data
