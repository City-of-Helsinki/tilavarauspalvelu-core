from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from applications.choices import ApplicationEventStatusChoice

if TYPE_CHECKING:
    from applications.models import ApplicationEvent, ApplicationEventSchedule


class ApplicationEventActions:
    def __init__(self, application_event: "ApplicationEvent") -> None:
        self.application_event = application_event

    def decline_event_schedules(self) -> None:
        schedules = self.application_event.application_event_schedules.all()
        if not schedules.exists():
            raise ValidationError(_("Cannot decline an event without defined schedules"))

        schedules.update(declined=True)

    def create_reservations_for_event(self) -> None:
        status = self.application_event.status
        if status != ApplicationEventStatusChoice.APPROVED:
            raise ValidationError(_(f"Cannot create reservations for event based on its status: '{status.value}'"))

        schedule: "ApplicationEventSchedule"
        for schedule in self.application_event.application_event_schedules.all().accepted():
            schedule.actions.create_reservation_for_schedule()
