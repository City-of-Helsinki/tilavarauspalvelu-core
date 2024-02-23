from typing import TYPE_CHECKING

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

        ReservationUnitOption.objects.filter(
            application_section__application__application_round=self.application_round,
        ).update(
            locked=False,
        )

        AllocatedTimeSlot.objects.filter(
            reservation_unit_option__application_section__application__application_round=self.application_round,
        ).delete()
