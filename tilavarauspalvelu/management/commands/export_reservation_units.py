from __future__ import annotations

from pathlib import Path
from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand

from tilavarauspalvelu.services.csv_export import ReservationUnitExporter


class Command(BaseCommand):
    help = "Exports reservation unit data from the database"

    def handle(self, *args: Any, **options: Any) -> None:
        string_io = ReservationUnitExporter().write()
        string_io.seek(0)
        Path(settings.BASE_DIR).write_bytes(string_io.getvalue().encode("utf-8"))
