from typing import TYPE_CHECKING

from django.db import models

from applications.choices import ApplicationRoundStatusChoice
from reservations.models import RecurringReservation, Reservation

if TYPE_CHECKING:
    from applications.models import ApplicationRound


class ApplicationRoundActions:
    def __init__(self, application_round: "ApplicationRound") -> None:
        self.application_round = application_round

    def reset_application_round_allocation(self) -> None:
        """
        Remove application round allocations, and unlock locked reservation unit options.
        Rejected options stay rejected.
        """
        from applications.models import AllocatedTimeSlot, ReservationUnitOption

        match self.application_round.status:
            case ApplicationRoundStatusChoice.IN_ALLOCATION:
                # Unlock all reservation unit options, and remove all allocated time slots
                lookup = (
                    "application_section"  #
                    "__application"
                    "__application_round"
                )
                ReservationUnitOption.objects.filter(models.Q(**{lookup: self.application_round})).update(locked=False)

                lookup = (
                    "reservation_unit_option"  #
                    "__application_section"
                    "__application"
                    "__application_round"
                )
                AllocatedTimeSlot.objects.filter(models.Q(**{lookup: self.application_round})).delete()

            case ApplicationRoundStatusChoice.HANDLED:
                # Remove all recurring reservations, and set application round back to HANDLED
                lookup = (
                    "recurring_reservation"  #
                    "__allocated_time_slot"
                    "__reservation_unit_option"
                    "__application_section"
                    "__application"
                    "__application_round"
                )
                Reservation.objects.filter(models.Q(**{lookup: self.application_round})).delete()

                lookup = (
                    "allocated_time_slot"  #
                    "__reservation_unit_option"
                    "__application_section"
                    "__application"
                    "__application_round"
                )
                RecurringReservation.objects.filter(models.Q(**{lookup: self.application_round})).delete()

                self.application_round.handled_date = None
                self.application_round.save()

            case _:
                msg = f"Application round in status {self.application_round.status.value!r} cannot be reset"
                raise ValueError(msg)
