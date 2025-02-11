.PHONY: Makefile
.PHONY: backend
.PHONY: bash
.PHONY: frontend
.PHONY: help
.PHONY: run
.PHONY: stop

# Trick to allow passing commands to make
# Use quotes (" ") if command contains flags (-h / --help)
args = `arg="$(filter-out $@,$(MAKECMDGOALS))" && echo $${arg:-${1}}`

# If command doesn't match, do not throw error
%:
	@:


define helptext

 Commands:

  backend           Start backend containers.
  bash              Open bash in backend container.
  frontend          Start frontend containers.
  run               Start docker containers.
  stop              Stop running containers.

endef

export helptext

# Help should be first so that make without arguments is the same as help
help:
	@echo "$$helptext"

be:
	@docker compose --profile backend up --detach --build

bash:
	@docker exec -it tvp-core bash

fe:
	@docker compose --profile frontend up --detach --build

run:
	@docker compose --profile frontend --profile backend up --detach --build

stop:
	@docker compose --profile frontend --profile backend stop
