from __future__ import annotations

from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from applications.choices import ApplicationEventStatusChoice
from common.db import ArrayUnnest

if TYPE_CHECKING:
    from applications.models import ApplicationEvent, ApplicationEventSchedule
    from applications.querysets.application_event import ApplicationEventQuerySet


class ApplicationEventActions:
    def __init__(self, application_event: ApplicationEvent) -> None:
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

        schedule: ApplicationEventSchedule
        for schedule in self.application_event.application_event_schedules.all().accepted():
            schedule.actions.create_reservation_for_schedule()

    def application_events_affecting_allocations(self) -> ApplicationEventQuerySet:
        from applications.models import ApplicationEvent
        from reservation_units.models import ReservationUnit

        return (
            ApplicationEvent.objects.distinct()
            .alias(
                _affecting_ids=models.Subquery(
                    queryset=(
                        ReservationUnit.objects.alias(
                            # All reservation units that are possible for this application event
                            _reservation_unit_ids=models.Subquery(
                                self.application_event.event_reservation_units.values("reservation_unit__id"),
                            ),
                        )
                        .filter(id__in=models.F("_reservation_unit_ids"))
                        .with_reservation_unit_ids_affecting_reservations()
                        .annotate(_found_ids=ArrayUnnest("reservation_units_affecting_reservations"))
                        .values("_found_ids")
                    )
                )
            )
            .filter(
                # Don't include this event.
                ~models.Q(id=self.application_event.id),
                # Application event has schedules.
                application_event_schedules__isnull=False,
                # Schedule has been allocated to any reservation unit affecting this event's allocations.
                application_event_schedules__allocated_reservation_unit__isnull=False,
                application_event_schedules__allocated_reservation_unit__id__in=models.F("_affecting_ids"),
                # Allocation period overlaps with this event's period.
                application_event_schedules__application_event__begin__lte=self.application_event.end,
                application_event_schedules__application_event__end__gte=self.application_event.begin,
            )
        )
