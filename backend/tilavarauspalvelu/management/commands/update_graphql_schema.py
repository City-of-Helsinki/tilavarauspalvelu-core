# ruff: noqa: E402
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from django.conf import settings
from django.core.management import BaseCommand
from django.utils.translation import activate

# Remove `graphiql_debug_toolbar` from INSTALLED_APPS to prevent `debug` from being included in the schema.
if "graphiql_debug_toolbar" in settings.INSTALLED_APPS:
    settings.INSTALLED_APPS.pop(settings.INSTALLED_APPS.index("graphiql_debug_toolbar"))

# Must be called before importing schema to force translation to English
activate("en")

from tilavarauspalvelu.api.graphql.schema import schema


class OutdatedSchemaError(Exception): ...


class Command(BaseCommand):
    help = "Print the GraphQL schema to stdout."

    def handle(self, *args: Any, **options: Any) -> None:
        filepath = settings.BASE_DIR.parent / "tilavaraus.graphql"
        new_schema = str(schema)

        # Remove trailing whitespace for linting, add trailing newline
        new_schema = "\n".join(line.rstrip() for line in new_schema.splitlines()) + "\n"

        old_schema = Path(filepath).read_text(encoding="utf-8")

        if os.getenv("CI") == "true" and old_schema != new_schema:
            msg = "GraphQL schema has changed. Please run `python manage.py update_graphql_schema` to update it."
            raise OutdatedSchemaError(msg)

        Path(filepath).write_text(new_schema, encoding="utf-8")
