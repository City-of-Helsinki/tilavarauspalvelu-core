from __future__ import annotations

from pathlib import Path
from typing import Any

from django.conf import settings
from django.core.management import BaseCommand

from tilavarauspalvelu.api.graphql.schema import schema


class Command(BaseCommand):
    help = "Print the GraphQL schema to stdout."

    def handle(self, *args: Any, **options: Any) -> None:
        filepath = settings.BASE_DIR.parent / "tilavaraus.graphql"
        with Path.open(filepath, "w", encoding="utf-8") as file:
            file.write(str(schema))
