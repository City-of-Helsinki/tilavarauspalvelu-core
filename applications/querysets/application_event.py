from collections.abc import Sequence
from datetime import timedelta
from typing import Self, TypedDict

from django.db import models

from applications.choices import ApplicationEventStatusChoice, ApplicationStatusChoice
from applications.querysets.helpers import (
    applicant_alias_case,
    application_event_status_case,
    application_event_status_required_aliases,
    application_status_case,
    unallocated_schedule_count,
    unallocated_schedule_filter,
)


class AggregateEventData(TypedDict):
    event_duration: timedelta
    min_duration: timedelta


class ApplicationEventQuerySet(models.QuerySet):
    def with_applicant_alias(self) -> Self:
        return self.alias(applicant=applicant_alias_case("application"))

    def get_event_duration_info(self) -> Sequence[AggregateEventData]:
        return (
            self.alias(
                event_duration_base=(models.F("begin") - models.F("end")) / 7 * models.F("events_per_week"),
            )
            .annotate(
                event_duration=models.Case(
                    models.When(models.Q(biweekly=True), then=models.F("event_duration_base") / 2),
                    default=models.F("event_duration_base"),
                    output_field=models.DurationField(),
                ),
            )
            .values("event_duration", "min_duration")
        )

    def unallocated(self) -> Self:
        return self.filter(unallocated_schedule_filter())

    def with_event_status(self) -> Self:
        return self.alias(
            **application_event_status_required_aliases(),
        ).annotate(
            event_status=application_event_status_case(),
        )

    def has_status(self, status: ApplicationEventStatusChoice) -> Self:
        return self.with_event_status().filter(event_status=status.value)

    def has_status_in(self, statuses: list[str]) -> Self:
        return self.with_event_status().filter(event_status__in=statuses)

    def with_application_status(self) -> Self:
        return self.alias(
            unallocated_schedule_count=unallocated_schedule_count(),
        ).annotate(
            application_status=application_status_case("application"),
        )

    def has_application_status(self, status: ApplicationStatusChoice) -> Self:
        return self.with_application_status().filter(application_status=status.value)

    def has_application_status_in(self, statuses: list[str]) -> Self:
        return self.with_application_status().filter(application_status__in=statuses)
