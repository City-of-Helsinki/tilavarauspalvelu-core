from datetime import timedelta
from typing import Literal, Self, TypedDict

from django.db import models
from django.db.models import Subquery
from lookup_property import L


class AggregateSectionData(TypedDict):
    event_duration: timedelta
    min_duration: timedelta


class ApplicationSectionQuerySet(models.QuerySet):
    def has_status_in(self, statuses: list[str]) -> Self:
        return self.alias(status=L("status")).filter(status__in=statuses)

    def has_application_status_in(self, statuses: list[str]) -> Self:
        return self.alias(application_status=L("application__status")).filter(application_status__in=statuses)

    def order_by_status(self, *, desc: bool = False) -> Self:
        return self.alias(
            status_sort_order=L("status_sort_order"),
        ).order_by(
            models.OrderBy(models.F("status_sort_order"), descending=desc),
        )

    def order_by_application_status(self, *, desc: bool = False) -> Self:
        return self.alias(
            application_status_sort_order=L("application__status_sort_order"),
        ).order_by(
            models.OrderBy(models.F("application_status_sort_order"), descending=desc),
        )

    def order_by_applicant(self, *, desc: bool = False) -> Self:
        return self.alias(
            applicant=L("application__applicant"),
        ).order_by(
            models.OrderBy(models.F("applicant"), descending=desc),
        )

    def order_by_preferred_unit_name(self, *, lang: Literal["fi", "en", "sv"], desc: bool = False) -> Self:
        from applications.models import ReservationUnitOption

        return self.alias(
            preferred_unit_name=Subquery(
                queryset=(
                    ReservationUnitOption.objects.filter(
                        application_section=models.OuterRef("pk"),
                        preferred_order=0,
                    )
                    .select_related("reservation_unit__unit")
                    # Name of the unit of the preferred reservation unit
                    .values(f"reservation_unit__unit__name_{lang}")[:1]
                ),
                output_field=models.CharField(),
            ),
        ).order_by(
            models.OrderBy(models.F("preferred_unit_name"), descending=desc),
        )
