.PHONY: bash
.PHONY: celery
.PHONY: clear-db
.PHONY: db-reset
.PHONY: dev
.PHONY: flush
.PHONY: generate
.PHONY: help
.PHONY: hooks
.PHONY: indices
.PHONY: lint
.PHONY: Makefile
.PHONY: migrate
.PHONY: migrations
.PHONY: run
.PHONY: services
.PHONY: stop
.PHONY: check-translations
.PHONY: translations
.PHONY: translate

# Trick to allow passing commands to make
# Use quotes (" ") if command contains flags (-h / --help)
args = `arg="$(filter-out $@,$(MAKECMDGOALS))" && echo $${arg:-${1}}`

# If command doesn't match, do not throw error
%:
	@:


define helptext

 Commands:

  bash                               Open bash in backend container.
  celery                             Run a local celery worker.
  clear-db                           Reset database.
  dev                                Run local backend.
  flush-db                           Flush database.
  generate                           Generate test data via a script.
  hooks                              Add pre-commit hooks.
  indices                            Rebuild search indices.
  lint                               Run pre-commit hooks.
  migrate                            Run database migrations.
  migrations                         Compile database migrations.
  run                                Start docker containers for frontend development.
  services                           Run required services in docker.
  stop                               Stop running containers.
  check-translations                 Check if translations are up to date.
  translations                       Fetch all translation strings under ./locale/.
  translate                          Compile translation strings.

endef

export helptext

# Help should be first so that make without arguments is the same as help
help:
	@echo "$$helptext"

bash:
	@docker exec -it tvp-core bash

celery:
	@celery -A tilavarauspalvelu worker --beat --loglevel=INFO --scheduler=django

clear-db:
	@python manage.py dbshell -- -c "DROP SCHEMA $(call args, 'public') CASCADE;CREATE SCHEMA $(call args, 'public');"

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

lint:
	@pre-commit run --all-files

migrate:
	@python manage.py migrate

migrations:
	@python manage.py makemigrations

run:
	@docker compose up --detach --build

services:
	@docker compose up --detach --build db elastic redis

stop:
	@docker compose stop

check-translations:
	@python -m tilavarauspalvelu.hooks.translations_done

translations:
	@echo ""
	@echo Making translations...
	@python manage.py maketranslations -l fi --no-obsolete --omit-header --add-location file
	@echo ""
	@echo Done!

translate:
	@echo ""
	@echo Compiling translations...
	@python manage.py compilemessages
	@echo ""
	@echo Done!
