from collections.abc import Sequence
from datetime import timedelta
from typing import Literal, Self, TypedDict

from django.db import models
from django.db.models import Subquery

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
    def order_by_expression(self, alias: str, expression: models.Expression, *, desc: bool = False) -> Self:
        order_by = models.OrderBy(models.F(alias), descending=desc)
        return self.alias(**{alias: expression}).order_by(order_by)

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

    def order_by_preferred_unit_name(self, *, lang: Literal["fi", "en", "sv"], desc: bool = False) -> Self:
        return self.preferred_unit_name_alias(lang=lang).order_by(
            models.OrderBy(models.F("preferred_unit_name"), descending=desc),
        )

    def preferred_unit_name_alias(self, *, lang: Literal["fi", "en", "sv"]) -> Self:
        from applications.models import EventReservationUnit

        return self.alias(
            preferred_unit_name=Subquery(
                queryset=(
                    EventReservationUnit.objects.filter(
                        application_event=models.OuterRef("pk"),
                        preferred_order=0,
                    )
                    .select_related("reservation_unit__unit")
                    # Name of the unit of the preferred reservation unit
                    .values(f"reservation_unit__unit__name_{lang}")[:1]
                ),
                output_field=models.CharField(),
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
        return self.with_event_status().order_by_expression(
            alias="__event_status",
            expression=APPLICATION_EVENT_STATUS_SORT_ORDER,
            desc=desc,
        )


APPLICATION_EVENT_STATUS_SORT_ORDER = models.Case(
    models.When(
        event_status=ApplicationEventStatusChoice.UNALLOCATED,
        then=models.Value(1),
    ),
    models.When(
        event_status=ApplicationEventStatusChoice.DECLINED,
        then=models.Value(2),
    ),
    models.When(
        event_status=ApplicationEventStatusChoice.APPROVED,
        then=models.Value(3),
    ),
    models.When(
        event_status=ApplicationEventStatusChoice.FAILED,
        then=models.Value(4),
    ),
    models.When(
        event_status=ApplicationEventStatusChoice.RESERVED,
        then=models.Value(5),
    ),
    default=models.Value(6),
)
