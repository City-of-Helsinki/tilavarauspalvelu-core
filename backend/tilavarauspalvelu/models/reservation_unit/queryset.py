from __future__ import annotations

import datetime
from itertools import islice
from typing import TYPE_CHECKING, Self

from django.contrib.postgres.search import SearchVector
from django.db import connections, models
from django.db.models import Q, prefetch_related_objects
from lookup_property import L

from tilavarauspalvelu.services.first_reservable_time.first_reservable_time_helper import FirstReservableTimeHelper
from utils.date_utils import local_date
from utils.db import ArrayUnnest, NowTT, SubqueryArray

if TYPE_CHECKING:
    from collections.abc import Callable, Generator
    from decimal import Decimal

    from query_optimizer.validators import PaginationArgs

    from tilavarauspalvelu.enums import AccessType
    from tilavarauspalvelu.models import ReservationUnit


__all__ = [
    "ReservationUnitManager",
    "ReservationUnitQuerySet",
]


type ReservationUnitPK = int


class ReservationUnitQuerySet(models.QuerySet):
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

    def with_available_access_types_on_period(
        self,
        begin_date: datetime.date | None = None,  # inclusive
        end_date: datetime.date | None = None,  # inclusive
    ) -> Self:
        """Add annotation of all access types that are used on the given date range."""
        from tilavarauspalvelu.models import ReservationUnitAccessType

        period_start = models.Value(begin_date or local_date())
        period_end = models.Value(end_date or datetime.date.max)

        return self.annotate(
            available_access_types=SubqueryArray(
                queryset=(
                    ReservationUnitAccessType.objects.filter(reservation_unit=models.OuterRef("pk"))
                    .filter(L(end_date__gt=period_start) & models.Q(begin_date__lte=period_end))
                    .values("access_type")
                ),
                agg_field="access_type",
                coalesce_output_type="varchar",
                output_field=models.CharField(null=True),
            )
        )

    def with_access_type_at(
        self,
        allowed_access_types: list[AccessType | str],
        begin_date: datetime.date | None = None,  # inclusive
        end_date: datetime.date | None = None,  # inclusive
    ) -> Self:
        """Filter to reservation units that have any of the allowed access types on the given date range."""
        return self.with_available_access_types_on_period(
            begin_date=begin_date,
            end_date=end_date,
        ).filter(available_access_types__overlap=allowed_access_types)

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

    def update_search_vectors(self, reservation_unit_pk: int | None = None) -> None:
        qs = self.select_related(
            "unit",
            "reservation_unit_type",
        ).prefetch_related(
            "spaces",
            "resources",
            "purposes",
            "equipments",
        )
        if reservation_unit_pk is not None:
            qs = qs.filter(pk=reservation_unit_pk)

        reservation_units: list[ReservationUnit] = list(qs)

        for reservation_unit in reservation_units:
            for lang, config in (("fi", "finnish"), ("en", "english"), ("sv", "swedish")):
                setattr(
                    reservation_unit,
                    f"search_vector_{lang}",
                    SearchVector(
                        models.F("pk"),
                        models.F(f"name_{lang}"),
                        models.F(f"description_{lang}"),
                        #
                        # Additional search terms
                        models.Value(
                            " ".join(term for term in reservation_unit.search_terms),
                            output_field=models.CharField(),
                        ),
                        models.Value(
                            " ".join(term for term in reservation_unit.unit.search_terms),
                            output_field=models.CharField(),
                        ),
                        #
                        # Joins are not allowed in search vectors, so we compute them as values beforehand.
                        models.Value(
                            getattr(reservation_unit.unit, f"name_{lang}", "") or "",
                            output_field=models.CharField(),
                        ),
                        models.Value(
                            getattr(reservation_unit.reservation_unit_type, f"name_{lang}", "") or "",
                            output_field=models.CharField(),
                        ),
                        models.Value(
                            " ".join(
                                name
                                for inst in reservation_unit.spaces.all()
                                if (name := getattr(inst, f"name_{lang}", ""))
                            ),
                            output_field=models.CharField(),
                        ),
                        models.Value(
                            " ".join(
                                name
                                for inst in reservation_unit.resources.all()
                                if (name := getattr(inst, f"name_{lang}", ""))
                            ),
                            output_field=models.CharField(),
                        ),
                        models.Value(
                            " ".join(
                                name
                                for inst in reservation_unit.purposes.all()
                                if (name := getattr(inst, f"name_{lang}", ""))
                            ),
                            output_field=models.CharField(),
                        ),
                        models.Value(
                            " ".join(
                                name
                                for inst in reservation_unit.equipments.all()
                                if (name := getattr(inst, f"name_{lang}", ""))
                            ),
                            output_field=models.CharField(),
                        ),
                        #
                        config=config,
                    ),
                )

        self.model.objects.bulk_update(
            reservation_units,
            ["search_vector_fi", "search_vector_en", "search_vector_sv"],
        )


class ReservationUnitManager(models.Manager.from_queryset(ReservationUnitQuerySet)):
    use_in_migrations = True
