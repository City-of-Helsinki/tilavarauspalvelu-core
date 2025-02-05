.PHONY: Makefile
.PHONY: celery
.PHONY: check-translations
.PHONY: clear-db
.PHONY: db-reset
.PHONY: dev
.PHONY: flush
.PHONY: generate
.PHONY: help
.PHONY: hooks
.PHONY: indices
.PHONY: lint
.PHONY: migrate
.PHONY: migrations
.PHONY: translate
.PHONY: translations

# Trick to allow passing commands to make
# Use quotes (" ") if command contains flags (-h / --help)
args = `arg="$(filter-out $@,$(MAKECMDGOALS))" && echo $${arg:-${1}}`

# If command doesn't match, do not throw error
%:
	@:


define helptext

 Commands:

  celery                             Run a local celery worker.
  check-translations                 Check if translations are up to date.
  clear-db                           Reset database.
  dev                                Run local backend.
  flush-db                           Flush database.
  generate                           Generate test data via a script.
  hooks                              Add pre-commit hooks.
  lint                               Run pre-commit hooks.
  migrate                            Run database migrations.
  migrations                         Compile database migrations.
  translate                          Compile translation strings.
  translations                       Fetch all translation strings under ./locale/.

endef

export helptext

# Help should be first so that make without arguments is the same as help
help:
	@echo "$$helptext"

celery:
	@celery -A config worker --beat --loglevel=INFO --scheduler=django

check-translations:
	@python -m config.hooks.translations_done

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

lint:
	@pre-commit run --all-files

migrate:
	@python manage.py migrate

migrations:
	@python manage.py makemigrations

translate:
	@echo ""
	@echo Compiling translations...
	@python manage.py compilemessages
	@echo ""
	@echo Done!

translations:
	@echo ""
	@echo Making translations...
	@python manage.py maketranslations -l fi -l sv --no-obsolete --omit-header --add-location file
	@echo ""
	@echo Done!
