from typing import Self

from django.db import models

from applications.choices import ApplicationEventStatusChoice
from applications.querysets.helpers import (
    applicant_alias_case,
    application_event_status_case,
    application_event_status_required_aliases,
)


class ApplicationEventScheduleQuerySet(models.QuerySet):
    def allocated(self) -> Self:
        return self.exclude(
            models.Q(allocated_begin__isnull=True)
            | models.Q(allocated_end__isnull=True)
            | models.Q(allocated_day__isnull=True)
            | models.Q(allocated_reservation_unit__isnull=True)
        )

    def with_event_status(self) -> Self:
        return self.alias(
            **application_event_status_required_aliases("application_event"),
        ).annotate(
            event_status=application_event_status_case(),
        )

    def with_applicant_alias(self):
        return self.alias(applicant=applicant_alias_case("application_event__application"))

    def has_event_status(self, status: ApplicationEventStatusChoice) -> Self:
        return self.with_event_status().filter(event_status=status.value)

    def has_event_status_in(self, statuses: list[str]) -> Self:
        return self.with_event_status().filter(event_status__in=statuses)
