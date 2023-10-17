from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from applications.models import Application


class ApplicationActions:
    def __init__(self, application: "Application") -> None:
        self.application = application

    def decline(self) -> None:
        for application_event in self.application.application_events.all():
            application_event.actions.decline_event_schedules()
