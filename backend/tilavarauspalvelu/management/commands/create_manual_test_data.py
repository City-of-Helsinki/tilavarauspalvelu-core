from __future__ import annotations

import os
from typing import TYPE_CHECKING, Any

from django.core.management import BaseCommand, CommandError

from .data_creation.create_manual_test_data import (
    create_manual_test_round_in_allocation,
    create_open_manual_test_round,
    create_open_paid_manual_test_round,
    create_paid_manual_test_round_in_allocation,
    remove_manual_test_round_in_allocation,
    remove_open_manual_test_round,
    remove_open_paid_manual_test_round,
    remove_paid_manual_test_round_in_allocation,
)

if TYPE_CHECKING:
    from django.core.management import CommandParser


class Command(BaseCommand):
    help = (
        "Makes the named manual test rounds. A round that exists is made again. "
        "This deletes its applications and reservations, also those that testers made. "
        "Its unit, and a paid round's unit group, stay, so their unit roles stay. "
        "With '--remove', the rounds are deleted and not made again. Never run in production."
    )

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "rounds",
            nargs="+",
            choices=["open", "in-allocation", "open-paid", "paid-in-allocation"],
            help="The rounds to make, or to delete with '--remove'.",
        )
        parser.add_argument(
            "--remove",
            action="store_true",
            help=(
                "Delete the rounds and do not make them again. "
                "This also deletes their units, and the unit groups of the paid rounds."
            ),
        )

    def handle(self, *args: Any, **options: Any) -> None:
        environment = os.getenv("DJANGO_SETTINGS_ENVIRONMENT")
        if environment == "Production":
            msg = "This command makes test data, so it cannot run in production."
            raise CommandError(msg)

        round_arguments: list[str] = options["rounds"]

        if options["remove"]:
            for round_argument in round_arguments:
                match round_argument:
                    case "open":
                        remove_open_manual_test_round()
                    case "in-allocation":
                        remove_manual_test_round_in_allocation()
                    case "open-paid":
                        remove_open_paid_manual_test_round()
                    case "paid-in-allocation":
                        remove_paid_manual_test_round_in_allocation()

                self.stdout.write(f"Removed the round '{round_argument}'.")

            return

        for round_argument in round_arguments:
            match round_argument:
                case "open":
                    create_open_manual_test_round()
                case "in-allocation":
                    create_manual_test_round_in_allocation()
                case "open-paid":
                    create_open_paid_manual_test_round()
                case "paid-in-allocation":
                    create_paid_manual_test_round_in_allocation()

            self.stdout.write(f"Made the round '{round_argument}'.")
