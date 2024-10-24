from __future__ import annotations

from itertools import islice
from typing import TYPE_CHECKING, Self

from django.db import connections, models
from django.db.models import Q, prefetch_related_objects
from elasticsearch_django.models import SearchDocumentManagerMixin, SearchResultsQuerySet
from lookup_property import L

from tilavarauspalvelu.utils.first_reservable_time.first_reservable_time_helper import FirstReservableTimeHelper
from utils.date_utils import local_datetime
from utils.db import ArrayUnnest, SubqueryArray

if TYPE_CHECKING:
    from collections.abc import Callable, Generator
    from datetime import date, time
    from decimal import Decimal

    from query_optimizer.validators import PaginationArgs

    from tilavarauspalvelu.models import ReservationUnit


__all__ = [
    "ReservationUnitManager",
    "ReservationUnitQuerySet",
]


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
        minimum_duration_minutes: float | Decimal | None,
        show_only_reservable: bool = False,
        pagination_args: PaginationArgs | None = None,
        cache_key: str = "",
    ) -> Self:
        """Annotate the queryset with `first_reservable_time` and `is_closed` for each reservation unit."""
        helper = FirstReservableTimeHelper(
            reservation_unit_queryset=self,
            filter_date_start=filter_date_start,
            filter_date_end=filter_date_end,
            filter_time_start=filter_time_start,
            filter_time_end=filter_time_end,
            minimum_duration_minutes=minimum_duration_minutes,
            show_only_reservable=show_only_reservable,
            pagination_args=pagination_args,
            cache_key=cache_key,
        )
        helper.calculate_all_first_reservable_times()
        return helper.get_annotated_queryset()

    @property
    def _related_space_ids(self) -> models.QuerySet[dict[str, int]]:
        from tilavarauspalvelu.models import Space

        return (
            Space.objects.filter(reservation_units__id=models.OuterRef("id"))
            .with_family(include_self=True)
            .annotate(all_families=ArrayUnnest("family"))
            .values("all_families")
        )

    def with_affecting_spaces(self) -> Self:
        """
        Annotate the queryset with a list of distinct space ids of all spaces
        that are either direct spaces of the reservation unit, or are
        in the same space hierarchy with one of those spaces.
        """
        return self.annotate(
            spaces_affecting_reservations=SubqueryArray(
                queryset=self._related_space_ids,
                agg_field="all_families",
                distinct=True,
            ),
        )

    def with_affecting_spaces_alias(self) -> Self:
        return self.alias(
            spaces_affecting_reservations=models.Subquery(
                queryset=self._related_space_ids,
            ),
        )

    @property
    def _related_resource_ids(self) -> models.QuerySet[dict[str, int]]:
        from tilavarauspalvelu.models import Resource

        return Resource.objects.filter(reservation_units__id=models.OuterRef("id")).values("id")

    def with_affecting_resources(self) -> Self:
        """
        Annotate the queryset with a list of distinct resource ids of all resources
        that are linked to the reservation unit.
        """
        return self.annotate(
            resources_affecting_reservations=SubqueryArray(
                queryset=self._related_resource_ids,
                agg_field="id",
                distinct=True,
            ),
        )

    def with_affecting_resources_alias(self) -> Self:
        return self.alias(
            resources_affecting_reservations=models.Subquery(
                queryset=self._related_resource_ids,
            ),
        )

    def with_reservation_unit_ids_affecting_reservations(self) -> Self:
        """Annotate queryset with reservation ids for all reservation units that affect its reservations."""
        from tilavarauspalvelu.models import ReservationUnit

        return (
            self.with_affecting_spaces_alias()
            .with_affecting_resources_alias()
            .annotate(
                reservation_units_affecting_reservations=SubqueryArray(
                    queryset=(
                        ReservationUnit.objects.filter(
                            Q(id=models.OuterRef("id"))
                            | Q(spaces__in=models.OuterRef("spaces_affecting_reservations"))
                            | Q(resources__in=models.OuterRef("resources_affecting_reservations"))
                        ).values("id")
                    ),
                    agg_field="id",
                    distinct=True,
                ),
            )
        )

    @property
    def affected_reservation_unit_ids(self) -> models.QuerySet[dict[str, int]]:
        """
        Get a "values" queryset of reservation unit ids that affect a given reservation unit in the queryset.
        This can be used in two ways:

        >>> sq = ReservationUnit.objects.filter(...)
        >>>
        >>> # 1
        >>> qs.filter(reservation_units__in=Subquery(sq.affected_reservation_unit_ids))
        >>>
        >>> # 2
        >>> qs.annotate(affected=SubqueryArray(sq.affected_reservation_unit_ids, agg_field="ids", distinct=True))
        """
        return (
            self.annotate(ids=ArrayUnnest("reservation_unit_hierarchy__related_reservation_unit_ids"))
            .values("ids")
            .distinct()
        )

    def reservation_units_with_common_hierarchy(self) -> Self:
        """
        Get a new queryset of reservation units that share a common hierarchy
        with any reservation unit in the original queryset.
        """
        from tilavarauspalvelu.models import ReservationUnit

        ids = models.Subquery(self.affected_reservation_unit_ids)
        return ReservationUnit.objects.alias(ids=ids).filter(pk__in=models.F("ids"))

    def hooked_iterator(
        self,
        hook: Callable[[list[ReservationUnit]], None],
        *,
        chunk_size: int,
    ) -> Generator[ReservationUnit, None, None]:
        """A `QuerySet.iterator()` that calls the given hook for each chunk of results before yielding them."""
        chunked_fetch = not connections[self.db].settings_dict.get("DISABLE_SERVER_SIDE_CURSORS")
        iterable = self._iterable_class(self, chunked_fetch=chunked_fetch, chunk_size=chunk_size)
        iterator = iter(iterable)

        while results := list(islice(iterator, chunk_size)):
            prefetch_related_objects(results, *self._prefetch_related_lookups)
            hook(results)
            yield from results

    def with_publishing_state_in(self, states: list[str]) -> Self:
        return self.filter(L(publishing_state__in=states))

    def with_reservation_state_in(self, states: list[str]) -> Self:
        return self.filter(L(reservation_state__in=states))


class ReservationUnitManager(SearchDocumentManagerMixin.from_queryset(ReservationUnitQuerySet)):
    def get_search_queryset(self, index: str = "_all") -> models.QuerySet:
        return self.get_queryset()
