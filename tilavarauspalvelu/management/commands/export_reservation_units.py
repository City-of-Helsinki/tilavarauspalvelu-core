from typing import Any

from django.core.management.base import BaseCommand

from tilavarauspalvelu.utils.reservation_units import ReservationUnitExporter


class Command(BaseCommand):
    help = "Exports reservation unit data from the database"

    def handle(self, *args: Any, **options: Any) -> str | None:
        ReservationUnitExporter.export_reservation_unit_data()
