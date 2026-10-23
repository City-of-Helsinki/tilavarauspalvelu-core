# The frontend containers run as the host user. See docker-compose.yml.
export HOST_UID := `id -u`
export HOST_GID := `id -g`

# Commands like "down" and "exec" see only the services of the active profiles. Use both by default.
# Override it for one command, for example "COMPOSE_PROFILES=backend just stack up".
export COMPOSE_PROFILES := env("COMPOSE_PROFILES", "backend,frontend")

# List the commands for the Docker Compose setups
[private]
default:
    @just --justfile {{ source_file() }} --list

# Create the env files if they do not exist. backend/.env.docker is backend/.env.example
# without the database and Redis addresses, so the defaults of the "Docker" settings environment apply.
env:
    @just setup
    @[ -f backend/.env.docker ] || grep -v -E "^(DATABASE_URL|REDIS_URL)=" backend/.env.example > backend/.env.docker

# Start the development setup, watch for changes and show the logs. Extra arguments go to "docker compose up".
up *args: env
    docker compose up --build --watch {{ args }}

# Start the backend only, watch for changes and show the logs. Run the frontends on the host.
up-backend *args: env
    COMPOSE_PROFILES=backend docker compose up --build --watch {{ args }}

# Start only the database and Redis. Run the backend on the host.
services:
    @docker compose up --detach db redis

# Build the images of the development setup
build *args:
    docker compose build {{ args }}

# Stop the containers of the development setup
stop *args:
    docker compose stop {{ args }}

# Remove the containers of the development setup. Add "-v" to also remove the data.
down *args:
    docker compose down {{ args }}

# Restart services of the development setup, for example "worker scheduler"
restart *args:
    docker compose restart {{ args }}

# Show the logs of the development setup
logs *args:
    docker compose logs --follow {{ args }}

# List the containers of the development setup
ps *args:
    docker compose ps {{ args }}

# Run a command in a running container, for example "--user root backend bash"
exec +args:
    docker compose exec {{ args }}

# Open bash in the backend container
bash:
    @docker compose exec backend bash

# Run a Django management command in the backend container
manage *args:
    @docker compose exec backend python manage.py {{ args }}

# Install the frontend dependencies and generate the GraphQL types
install:
    @docker compose run --rm frontend-install

# Run any docker compose command for the development setup
compose +args:
    docker compose {{ args }}
