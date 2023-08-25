from typing import Any, Optional

from django.core.management.base import BaseCommand

from ...utils.export_data import ApplicationDataExporter


class Command(BaseCommand):
    help = "Exports reservation unit statistic data for the given application round from the database"

    def add_arguments(self, parser):
        parser.add_argument(
            "application_round",
            nargs="+",
            type=int,
            help="an integer or several representing the ID of the application round(s) to export",
        )

    def handle(self, *args: Any, **options: Any) -> Optional[str]:
        application_rounds = options.get("application_round")

        for application_round in application_rounds:
            ApplicationDataExporter.export_application_round_statistics_for_reservation_units(application_round)
