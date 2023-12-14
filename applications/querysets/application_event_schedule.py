from typing import Self

from django.db import models
from django.db.models import Case, Value, When
from django.db.models.functions import Cast, Concat

from applications.choices import ApplicationEventStatusChoice
from applications.querysets.helpers import (
    applicant_alias_case,
    application_event_status_case,
    application_event_status_required_aliases,
    application_status_case,
    unallocated_schedule_count,
)


class ApplicationEventScheduleQuerySet(models.QuerySet):
    def order_by_expression(self, alias: str, expression: models.Expression, *, desc: bool = False) -> Self:
        order_by = models.OrderBy(models.F(alias), descending=desc)
        return self.alias(**{alias: expression}).order_by(order_by)

    def allocated(self) -> Self:
        return self.exclude(
            models.Q(allocated_begin__isnull=True)
            | models.Q(allocated_end__isnull=True)
            | models.Q(allocated_day__isnull=True)
            | models.Q(allocated_reservation_unit__isnull=True)
        )

    def with_application_status(self) -> Self:
        return self.alias(
            unallocated_schedule_count=unallocated_schedule_count("application_event"),
        ).annotate(
            application_status=application_status_case("application_event__application"),
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

    def order_by_allocated_time_of_week(self, *, desc: bool = False) -> Self:
        return self.allocated_time_of_week_alias().order_by(
            models.OrderBy(models.F("allocated_time_of_week"), descending=desc),
        )

    def allocated_time_of_week_alias(self) -> Self:
        """Annotate allocated time of week as a string of the form `w-hh:mm:ss-hh:mm:ss`"""
        return self.alias(
            allocated_time_of_week=Case(
                When(
                    condition=(
                        models.Q(allocated_day__isnull=False)
                        & models.Q(allocated_begin__isnull=False)
                        & models.Q(allocated_end__isnull=False)
                    ),
                    then=Concat(
                        Cast("allocated_day", output_field=models.CharField(max_length=1)),
                        Value("-"),
                        Cast("allocated_begin", output_field=models.CharField(max_length=8)),
                        Value("-"),
                        Cast("allocated_end", output_field=models.CharField(max_length=8)),
                    ),
                ),
                default=None,
            ),
        )

    def order_by_application_status(self, *, desc: bool = False) -> Self:
        from applications.querysets.application import APPLICATION_STATUS_SORT_ORDER

        return self.with_application_status().order_by_expression(
            alias="__application_status",
            expression=APPLICATION_STATUS_SORT_ORDER,
            desc=desc,
        )

    def order_by_application_event_status(self, *, desc: bool = False) -> Self:
        from applications.querysets.application_event import APPLICATION_EVENT_STATUS_SORT_ORDER

        return self.with_event_status().order_by_expression(
            alias="__event_status",
            expression=APPLICATION_EVENT_STATUS_SORT_ORDER,
            desc=desc,
        )
