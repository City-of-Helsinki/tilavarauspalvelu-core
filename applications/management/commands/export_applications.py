from typing import Any

from django.core.management.base import BaseCommand

from applications.exporter import ApplicationDataExporter


class Command(BaseCommand):
    help = "Exports application data from the database"

    def add_arguments(self, parser):
        parser.add_argument(
            "application_round",
            nargs="+",
            type=int,
            help="an integer or several representing the ID of the application round(s) to export",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        application_rounds = options.get("application_round")

        for application_round in application_rounds:
            ApplicationDataExporter.export_application_data(application_round)
