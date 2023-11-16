from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from applications.models import Application


class ApplicationActions:
    def __init__(self, application: "Application") -> None:
        self.application = application

    def decline(self) -> None:
        for application_event in self.application.application_events.all():
            application_event.actions.decline_event_schedules()

    def reset_application_allocation(self) -> None:
        """Reset application allocations to a state before any allocations were made."""
        from applications.models import ApplicationEventSchedule

        ApplicationEventSchedule.objects.filter(
            application_event__application=self.application,
        ).update(
            allocated_day=None,
            allocated_begin=None,
            allocated_end=None,
            allocated_reservation_unit=None,
            declined=False,
        )
