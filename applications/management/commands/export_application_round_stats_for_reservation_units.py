from typing import Any

from django.core.management.base import BaseCommand

from applications.exporter import export_application_round_statistics_for_reservation_units


class Command(BaseCommand):
    help = "Exports reservation unit statistic data for the given application round from the database"

    def add_arguments(self, parser):
        parser.add_argument(
            "application_round",
            nargs="+",
            type=int,
            help="an integer or several representing the ID of the application round(s) to export",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        application_rounds: list[int] = options.get("application_round")

        for application_round in application_rounds:
            export_application_round_statistics_for_reservation_units(application_round)
