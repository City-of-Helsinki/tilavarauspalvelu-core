import datetime
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

    def accepted(self) -> Self:
        """Schedules that have been allocated, but not declined"""
        return self.exclude(
            models.Q(declined=True)
            | models.Q(allocated_begin__isnull=True)
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

    @staticmethod
    def merge_periods(
        time_periods: list[dict[str, datetime.time]],
        *,
        begin_key: str,
        end_key: str,
    ) -> list[dict[str, datetime.time]]:
        """
        Merge periods that overlap or touch each other.
        Time periods should be in chronological order, and on the same day.
        """
        merged_periods = time_periods[:1]

        # Go through all periods in order.
        for period in time_periods[1:]:
            last_period = merged_periods[-1]
            # If time periods overlap, or are next to each other -> merge them and continue.
            if last_period[end_key] >= period[begin_key]:
                last_period[end_key] = max(period[end_key], last_period[end_key])
                continue

            # Otherwise the periods are not contiguous -> append the period and continue.
            merged_periods.append(period)
        return merged_periods

    def allocation_fits_in_wished_periods(self, day: int, begin: datetime.time, end: datetime.time) -> bool:
        """
        Check if allocation can be made on the given day and time period
        to the wished days and time periods of schedules in this queryset.
        """
        time_periods = list(self.filter(day=day).order_by("begin").values("begin", "end"))
        merged_periods = self.merge_periods(time_periods, begin_key="begin", end_key="end")

        for period in merged_periods:  # noqa: SIM110
            # If the allocated period fits in any of the merged periods, it can be allocated.
            if begin >= period["begin"] and end <= period["end"]:
                return True
        # Otherwise it cannot be allocated.
        return False

    def has_overlapping_allocations(self, day: int, begin: datetime.time, end: datetime.time) -> bool:
        """Does this queryset have any approved schedules that overlap with the given day and time period?"""
        time_periods = list(
            self.filter(allocated_day=day)
            .exclude(allocated_begin__isnull=True, allocated_end__isnull=True)
            .order_by("allocated_begin")
            .values("allocated_begin", "allocated_end")
        )
        merged_periods = self.merge_periods(time_periods, begin_key="allocated_begin", end_key="allocated_end")

        for period in merged_periods:  # noqa: SIM110
            # If the allocated period overlaps with any of the merged periods, it cannot be allocated.
            if period["allocated_end"] > begin and period["allocated_begin"] < end:
                return True
        # Otherwise, it can be allocated.
        return False
