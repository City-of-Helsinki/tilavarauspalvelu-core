from __future__ import annotations

from itertools import islice
from typing import TYPE_CHECKING, Self

from django.db import connections, models
from django.db.models import Q, prefetch_related_objects
from elasticsearch_django.models import SearchDocumentManagerMixin, SearchResultsQuerySet
from lookup_property import L

from tilavarauspalvelu.utils.first_reservable_time.first_reservable_time_helper import FirstReservableTimeHelper
from utils.db import ArrayUnnest, NowTT

if TYPE_CHECKING:
    import datetime
    from collections.abc import Callable, Generator
    from decimal import Decimal

    from query_optimizer.validators import PaginationArgs

    from tilavarauspalvelu.models import ReservationUnit


__all__ = [
    "ReservationUnitManager",
    "ReservationUnitQuerySet",
]


type ReservationUnitPK = int


class ReservationUnitQuerySet(SearchResultsQuerySet):
    def with_first_reservable_time(
        self,
        *,
        filter_date_start: datetime.date | None,
        filter_date_end: datetime.date | None,
        filter_time_start: datetime.time | None,
        filter_time_end: datetime.time | None,
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
    ) -> Generator[ReservationUnit]:
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

    def published(self) -> Self:
        return self.filter(is_draft=False, is_archived=False)

    @property
    def _is_visible(self) -> Q:
        return (
            Q(publish_begins__lte=NowTT())  #
            | Q(publish_begins__isnull=True)
        ) & (
            Q(publish_ends__gt=NowTT())  #
            | Q(publish_ends__isnull=True)
            | Q(publish_ends__lt=models.F("publish_begins"))
        )

    def visible(self) -> Self:
        return self.published().filter(self._is_visible)

    def hidden(self) -> Self:
        return self.published().exclude(self._is_visible)


class ReservationUnitManager(SearchDocumentManagerMixin.from_queryset(ReservationUnitQuerySet)):
    def get_search_queryset(self, index: str = "_all") -> models.QuerySet:  # noqa: ARG002
        return self.get_queryset()
