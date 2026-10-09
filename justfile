mod be 'backend/justfile'
mod fe 'frontend/justfile'

# List all available commands
help:
    @just --list
    @echo -e "\n[Backend] \033[0;31m(just be <recipe>)\033[0m"
    @just --list be
    @echo -e "\n[Frontend] \033[0;31m(just fe <recipe>)\033[0m"
    @just --list fe

# Setup environment variables
setup:
    @[ -f frontend/apps/customer/.env.local ] || cp frontend/apps/customer/.env.example frontend/apps/customer/.env.local
    @[ -f frontend/apps/staff/.env.local ] || cp frontend/apps/staff/.env.example frontend/apps/staff/.env.local

# Create symlinks for Claude Code (AGENTS.md and skills)
claude-setup: claude-hooks
    @ln -sf AGENTS.md CLAUDE.md
    @mkdir -p .claude
    @ln -sf ../.agents/skills .claude/skills

# Create Claude Code hooks from .agents/hooks. Run again after claude-hooks.json changes.
claude-hooks:
    @mkdir -p .claude
    @ln -sfn ../.agents/hooks .claude/hooks
    @[ -f .claude/settings.json ] || echo '{}' > .claude/settings.json
    @jq --slurpfile hooks .agents/hooks/claude-hooks.json '.hooks = $hooks[0]' .claude/settings.json > .claude/settings.json.tmp
    @mv .claude/settings.json.tmp .claude/settings.json

# Open bash in backend container
bash:
    @docker exec -it tvp-core bash

# Start docker containers for frontend development
run:
    @docker compose up --detach --build

# Run required services in docker
services:
    @docker compose up --detach --build db redis

# Stop running containers
stop:
    @docker compose stop

# Generate GraphQL types for the frontend
codegen: fe::codegen
