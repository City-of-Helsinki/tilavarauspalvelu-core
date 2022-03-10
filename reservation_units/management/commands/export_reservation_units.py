from typing import Any, Optional

from django.core.management.base import BaseCommand

from ...utils.export_data import ReservationUnitExporter


class Command(BaseCommand):
    help = "Exports reservation unit data from the database"

    def handle(self, *args: Any, **options: Any) -> Optional[str]:
        ReservationUnitExporter.export_reservation_unit_data()
