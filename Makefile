.PHONY: Makefile
.PHONY: bash
.PHONY: help
.PHONY: hooks
.PHONY: run
.PHONY: services
.PHONY: stop

# Trick to allow passing commands to make
# Use quotes (" ") if command contains flags (-h / --help)
args = `arg="$(filter-out $@,$(MAKECMDGOALS))" && echo $${arg:-${1}}`

# If command doesn't match, do not throw error
%:
	@:


define helptext

 Commands:

  bash                               Open bash in backend container.
  run                                Start docker containers for frontend development.
  services                           Run required services in docker.
  stop                               Stop running containers.

endef

export helptext

# Help should be first so that make without arguments is the same as help
help:
	@echo "$$helptext"

bash:
	@docker exec -it tvp-core bash

run:
	@docker compose up --detach --build

services:
	@docker compose up --detach --build db redis

stop:
	@docker compose stop
