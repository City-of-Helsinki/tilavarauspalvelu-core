from datetime import date, time
from decimal import Decimal
from typing import Self

from django.db import models
from django.db.models import Q
from elasticsearch_django.models import SearchResultsQuerySet

from common.date_utils import local_datetime
from common.db import ArrayUnnest, SubqueryArray
from reservation_units.utils.first_reservable_time import (
    FirstReservableTimeHelper,
)
from resources.models import Resource
from spaces.models import Space

type ReservationUnitPK = int


class ReservationUnitQuerySet(SearchResultsQuerySet):
    def scheduled_for_publishing(self) -> Self:
        now = local_datetime()
        return self.filter(
            Q(is_archived=False, is_draft=False)
            & (
                Q(publish_begins__isnull=False, publish_begins__gt=now)
                | Q(publish_ends__isnull=False, publish_ends__lte=now)
            )
        )

    def with_first_reservable_time(
        self,
        filter_date_start: date | None,
        filter_date_end: date | None,
        filter_time_start: time | None,
        filter_time_end: time | None,
        minimum_duration_minutes: int | float | Decimal | None,
    ) -> Self:
        """Annotate the queryset with `first_reservable_time` and `is_closed` for each reservation unit."""
        helper = FirstReservableTimeHelper(
            reservation_unit_queryset=self,
            filter_date_start=filter_date_start,
            filter_date_end=filter_date_end,
            filter_time_start=filter_time_start,
            filter_time_end=filter_time_end,
            minimum_duration_minutes=minimum_duration_minutes,
        )
        helper.calculate_all_first_reservable_times()
        return helper.get_annotated_queryset()

    def with_affecting_spaces_alias(self) -> Self:
        return self.alias(
            spaces_affecting_reservations=models.Subquery(
                queryset=(
                    Space.objects.filter(reservation_units__id=models.OuterRef("id"))
                    .with_family(include_self=True)
                    .annotate(all_families=ArrayUnnest("family"))
                    .values("all_families")
                ),
            ),
        )

    def with_affecting_resources_alias(self) -> Self:
        return self.alias(
            resources_affecting_reservations=models.Subquery(
                queryset=Resource.objects.filter(reservation_units__id=models.OuterRef("id")).values("id"),
            ),
        )

    def with_reservation_unit_ids_affecting_reservations(self) -> Self:
        """Annotate queryset with reservation ids for all reservation units that affect its reservations."""
        from reservation_units.models import ReservationUnit

        return (
            self.with_affecting_spaces_alias()
            .with_affecting_resources_alias()
            .annotate(
                reservation_units_affecting_reservations=SubqueryArray(
                    queryset=(
                        ReservationUnit.objects.distinct()
                        .filter(
                            Q(spaces__in=models.OuterRef("spaces_affecting_reservations"))
                            | Q(resources__in=models.OuterRef("resources_affecting_reservations"))
                        )
                        .values("id")
                    ),
                    agg_field="id",
                ),
            )
        )

    def reservation_units_with_common_hierarchy(self) -> Self:
        """
        Get a new queryset of reservation units that share a common hierarchy
        with any reservation unit in the original queryset.
        """
        from reservation_units.models import ReservationUnit

        return ReservationUnit.objects.alias(
            _ids=models.Subquery(
                queryset=(
                    self.with_reservation_unit_ids_affecting_reservations()
                    .annotate(_found_ids=ArrayUnnest("reservation_units_affecting_reservations"))
                    .values("_found_ids")
                )
            )
        ).filter(pk__in=models.F("_ids"))
