from collections.abc import Sequence
from datetime import timedelta
from typing import Self, TypedDict

from django.db import models

from applications.choices import ApplicationEventStatusChoice, ApplicationStatusChoice
from applications.querysets.helpers import (
    accepted_event_count,
    applicant_alias_case,
    application_status_case,
    non_declined_event_count,
    unallocated_schedule_count,
    unallocated_schedule_filter,
)
from reservations.choices import ReservationStateChoice


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
            schedule_count=models.Count("application_event_schedules"),
            non_declined_count=non_declined_event_count(),
            accepted_count=accepted_event_count(),
            recurring_count=models.Count("recurring_reservations"),
            recurring_denied_count=models.Count(
                "recurring_reservations",
                filter=models.Q(recurring_reservations__reservations__state=ReservationStateChoice.DENIED),
            ),
        ).annotate(
            event_status=models.Case(
                models.When(
                    # If there are schedules
                    # AND all of them are declined
                    ~models.Q(schedule_count=0) & models.Q(non_declined_count=0),
                    then=models.Value(
                        ApplicationEventStatusChoice.DECLINED.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    # If there are no schedules
                    # OR none of them are accepted
                    models.Q(schedule_count=0) | models.Q(accepted_count=0),
                    then=models.Value(
                        ApplicationEventStatusChoice.UNALLOCATED.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    # If there are no recurring reservations
                    models.Q(recurring_count=0),
                    then=models.Value(
                        ApplicationEventStatusChoice.APPROVED.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    # If there is at least one denied recurring reservation
                    ~models.Q(recurring_denied_count=0),
                    then=models.Value(
                        ApplicationEventStatusChoice.FAILED.value,
                        output_field=models.CharField(),
                    ),
                ),
                default=models.Value(
                    # Otherwise all reservation are successful
                    ApplicationEventStatusChoice.RESERVED.value,
                    output_field=models.CharField(),
                ),
                output_field=models.CharField(),
            ),
        )

    def has_status(self, status: ApplicationEventStatusChoice) -> Self:
        return self.with_event_status().filter(event_status=status.value)

    def with_application_status(self) -> Self:
        return self.alias(
            unallocated_schedule_count=unallocated_schedule_count(),
        ).annotate(
            application_status=application_status_case("application"),
        )

    def has_application_status(self, status: ApplicationStatusChoice) -> Self:
        return self.with_application_status().filter(application_status=status.value)
