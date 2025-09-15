# ruff: noqa: E402
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from django.conf import settings
from django.core.management import BaseCommand
from django.utils.translation import activate
from undine.settings import undine_settings

# Must be called before importing schema to force translation to English
activate("en")

from tilavarauspalvelu.api.graphql.schema import schema


class OutdatedSchemaError(Exception): ...


class Command(BaseCommand):
    help = "Print the GraphQL schema to stdout."

    def handle(self, *args: Any, **options: Any) -> None:
        filepath = settings.BASE_DIR.parent / "tilavaraus.graphql"
        new_schema = undine_settings.SDL_PRINTER.print_schema(schema)

        # Remove trailing whitespace for linting, add trailing newline
        new_schema = "\n".join(line.rstrip() for line in new_schema.splitlines()) + "\n"

        old_schema = Path(filepath).read_text(encoding="utf-8")

        if os.getenv("CI") == "true" and old_schema != new_schema:
            msg = "GraphQL schema has changed. Please run `python manage.py update_graphql_schema` to update it."
            raise OutdatedSchemaError(msg)

        Path(filepath).write_text(new_schema, encoding="utf-8")
