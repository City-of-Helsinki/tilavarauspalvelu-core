import operator
from datetime import date, time
from decimal import Decimal
from functools import reduce
from typing import Any

import django_filters
from django.db.models import Expression, F, Q, QuerySet
from elasticsearch_django.models import SearchQuery
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from common.date_utils import local_datetime
from elastic_django.reservation_units.query_builder import build_elastic_query_str
from reservation_units.enums import ReservationKind, ReservationState, ReservationUnitState
from reservation_units.models import ReservationUnit
from reservation_units.querysets import ReservationUnitQuerySet
from reservation_units.utils.reservation_unit_reservation_state_helper import ReservationUnitReservationStateHelper
from reservation_units.utils.reservation_unit_state_helper import ReservationUnitStateHelper
from spaces.models import Unit

__all__ = [
    "ReservationUnitFilterSet",
]


class ReservationUnitFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    tprek_id = django_filters.CharFilter(field_name="unit__tprek_id")
    tprek_department_id = django_filters.CharFilter(field_name="unit__tprek_department_id")
    unit = IntMultipleChoiceFilter()
    reservation_unit_type = IntMultipleChoiceFilter()

    min_persons_gte = django_filters.NumberFilter(field_name="min_persons", method="get_min_persons_gte")
    min_persons_lte = django_filters.NumberFilter(field_name="min_persons", method="get_min_persons_lte")
    max_persons_gte = django_filters.NumberFilter(field_name="max_persons", method="get_max_persons_gte")
    max_persons_lte = django_filters.NumberFilter(field_name="max_persons", method="get_max_persons_lte")

    text_search = django_filters.CharFilter(method="get_text_search")

    keyword_groups = IntMultipleChoiceFilter()
    purposes = IntMultipleChoiceFilter()
    qualifiers = IntMultipleChoiceFilter()
    equipments = IntMultipleChoiceFilter(conjoined=True)

    is_draft = django_filters.BooleanFilter()
    is_visible = django_filters.BooleanFilter(method="get_is_visible")

    application_round = IntMultipleChoiceFilter(field_name="application_rounds")

    name_fi = django_filters.CharFilter(field_name="name_fi", lookup_expr="istartswith")
    name_en = django_filters.CharFilter(field_name="name_en", lookup_expr="istartswith")
    name_sv = django_filters.CharFilter(field_name="name_sv", lookup_expr="istartswith")

    surface_area_gte = django_filters.NumberFilter(field_name="surface_area", lookup_expr="gte")
    surface_area_lte = django_filters.NumberFilter(field_name="surface_area", lookup_expr="lte")

    rank_gte = django_filters.NumberFilter(field_name="rank", lookup_expr="gte")
    rank_lte = django_filters.NumberFilter(field_name="rank", lookup_expr="lte")

    type_rank_gte = django_filters.NumberFilter(field_name="reservation_unit_type__rank", lookup_expr="gte")
    type_rank_lte = django_filters.NumberFilter(field_name="reservation_unit_type__rank", lookup_expr="lte")

    reservation_kind = django_filters.CharFilter(field_name="reservation_kind", method="get_reservation_kind")

    state = django_filters.MultipleChoiceFilter(
        method="get_state",
        choices=tuple((state.value, state.value) for state in ReservationUnitState),
    )

    reservation_state = django_filters.MultipleChoiceFilter(
        method="get_reservation_state",
        choices=tuple((state.name, state.value) for state in ReservationState),
    )

    only_with_permission = django_filters.BooleanFilter(method="get_only_with_permission")

    reservable_date_start = django_filters.DateFilter(method="get_filter_reservable")
    reservable_date_end = django_filters.DateFilter(method="get_filter_reservable")
    reservable_time_start = django_filters.TimeFilter(method="get_filter_reservable")
    reservable_time_end = django_filters.TimeFilter(method="get_filter_reservable")
    reservable_minimum_duration_minutes = django_filters.NumberFilter(method="get_filter_reservable")
    show_only_reservable = django_filters.BooleanFilter(method="get_filter_reservable")
    calculate_first_reservable_time = django_filters.BooleanFilter(method="get_filter_reservable")

    class Meta:
        model = ReservationUnit
        fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
            "description_fi": ["exact", "icontains"],
            "description_sv": ["exact", "icontains"],
            "description_en": ["exact", "icontains"],
        }
        combination_methods = [
            "get_filter_reservable",
        ]
        order_by = [
            "pk",
            "name_fi",
            "name_en",
            "name_sv",
            ("reservation_unit_type__name_fi", "type_fi"),
            ("reservation_unit_type__name_en", "type_en"),
            ("reservation_unit_type__name_sv", "type_sv"),
            ("unit__name_fi", "unit_name_fi"),
            ("unit__name_en", "unit_name_en"),
            ("unit__name_sv", "unit_name_sv"),
            "max_persons",
            "surface_area",
            "rank",
            ("reservation_unit_type__rank", "type_rank"),
        ]

    @staticmethod
    def get_text_search(qs: ReservationUnitQuerySet, name: str, value: str) -> QuerySet:
        query_str = build_elastic_query_str(value)
        sq = SearchQuery.do_search("reservation_units", {"query_string": {"query": query_str}})
        return qs.from_search_results(sq)

    @staticmethod
    def get_max_persons_gte(qs: ReservationUnitQuerySet, name: str, value: int) -> QuerySet:
        return qs.filter(Q(max_persons__gte=value) | Q(max_persons__isnull=True))

    @staticmethod
    def get_max_persons_lte(qs: ReservationUnitQuerySet, name: str, value: int) -> QuerySet:
        return qs.filter(Q(max_persons__lte=value) | Q(max_persons__isnull=True))

    @staticmethod
    def get_min_persons_gte(qs: ReservationUnitQuerySet, name: str, value: int) -> QuerySet:
        return qs.filter(Q(min_persons__gte=value) | Q(min_persons__isnull=True))

    @staticmethod
    def get_min_persons_lte(qs: ReservationUnitQuerySet, name: str, value: int) -> QuerySet:
        return qs.filter(Q(min_persons__lte=value) | Q(min_persons__isnull=True))

    @staticmethod
    def get_is_visible(qs: ReservationUnitQuerySet, name: str, value: bool) -> QuerySet:
        now = local_datetime()

        qs = qs.filter(is_draft=False, is_archived=False)
        published = (  #
            (  #
                Q(publish_begins__lte=now) | Q(publish_begins__isnull=True)
            )
            & (  #
                Q(publish_ends__gt=now) | Q(publish_ends__isnull=True) | Q(publish_ends__lt=F("publish_begins"))
            )
        )

        if value:
            return qs.filter(published)
        return qs.exclude(published)

    @staticmethod
    def get_reservation_kind(qs: ReservationUnitQuerySet, name: str, value: str) -> QuerySet:
        if name.upper() == ReservationKind.DIRECT_AND_SEASON:
            return qs.filter(reservation_kind__isnull=False)

        return qs.filter(reservation_kind__icontains=value)

    @staticmethod
    def get_state(qs: ReservationUnitQuerySet, name: str, value: list[str]):
        queries = [ReservationUnitStateHelper.get_state_query(state) for state in value]
        query = reduce(operator.or_, (query for query in queries))
        return qs.filter(query).distinct()

    @staticmethod
    def get_reservation_state(qs: ReservationUnitQuerySet, name: str, value: list[str]) -> QuerySet:
        query: Q = Q()
        aliases: dict[str, Expression | F] = {}
        for state in value:
            query_state = ReservationUnitReservationStateHelper.get_state_query(state)
            query |= query_state.filters
            aliases |= query_state.aliases
        return qs.alias(**aliases).filter(query).distinct()

    def get_only_with_permission(self, qs: ReservationUnitQuerySet, name: str, value: bool) -> QuerySet:
        """Returns reservation units where the user has any kind of permissions in its unit"""
        if not value:
            return qs

        user = self.request.user

        if user.is_anonymous:
            return qs.none()
        elif user.is_superuser or user.general_roles.exists():
            return qs

        return qs.filter(
            Q(unit_id__in=user.unit_roles.values_list("unit", flat=True))
            | Q(unit__unit_groups__in=user.unit_roles.values_list("unit_group", flat=True))
            | Q(
                unit_id__in=Unit.objects.filter(
                    service_sectors__in=user.service_sector_roles.values_list("service_sector", flat=True)
                )
            )
        ).distinct()

    @staticmethod
    def get_filter_reservable(qs: ReservationUnitQuerySet, name: str, value: dict[str, Any]) -> QuerySet:
        """
        Filter reservation units by their reservability.

        Always annotates the queryset with `first_reservable_datetime` and `is_closed` fields.

        If 'show_only_reservable' is True, then only reservation units, which are reservable with the given filters
        are returned. Otherwise, all reservation units are returned.
        """
        # Since the calculation of `first_reservable_datetime` is quite heavy, allow skipping it if not needed.
        # Note that if the calculation is skipped, querying `first_reservable_datetime` or `is_closed`
        # fill raise an error.
        calculate_first_reservable_time: bool = value.get("calculate_first_reservable_time", False)
        if not calculate_first_reservable_time:
            return qs

        date_start: date | None = value["reservable_date_start"]
        date_end: date | None = value["reservable_date_end"]
        time_start: time | None = value["reservable_time_start"]
        time_end: time | None = value["reservable_time_end"]
        minimum_duration_minutes: Decimal | None = value["reservable_minimum_duration_minutes"]

        # Annotate all ReservationUnits with `first_reservable_datetime` since we need the info in the GraphQL object.
        # If the GQL field is not selected for the query, then this is unnecessary, but if we do not annotate the info
        # here, the object type we would need to fetch this info one item at a time, which is inefficient.
        qs = qs.with_first_reservable_time(
            filter_date_start=date_start,
            filter_date_end=date_end,
            filter_time_start=time_start,
            filter_time_end=time_end,
            minimum_duration_minutes=minimum_duration_minutes,
        )

        show_everything: bool = not value.get("show_only_reservable", True)
        if show_everything:
            return qs

        return qs.exclude(first_reservable_datetime=None)
