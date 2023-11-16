from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from applications.models import ApplicationRound


class ApplicationRoundActions:
    def __init__(self, application_round: "ApplicationRound") -> None:
        self.application_round = application_round

    def reset_application_round_allocation(self):
        """Reset application round applications to a state before any allocations were made."""
        from applications.models import ApplicationEventSchedule

        ApplicationEventSchedule.objects.filter(
            application_event__application__application_round=self.application_round,
        ).update(
            allocated_day=None,
            allocated_begin=None,
            allocated_end=None,
            allocated_reservation_unit=None,
            declined=False,
        )
