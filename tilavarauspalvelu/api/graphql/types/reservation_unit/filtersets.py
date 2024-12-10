from __future__ import annotations

import base64
from typing import TYPE_CHECKING, Any

import django_filters
from django.contrib.postgres.search import SearchQuery
from django.db import models
from django.db.models import Q
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import EnumMultipleChoiceFilter, IntMultipleChoiceFilter

from tilavarauspalvelu.enums import ReservationKind, ReservationUnitPublishingState, ReservationUnitReservationState
from tilavarauspalvelu.models import ReservationUnit
from utils.db import build_search
from utils.utils import get_text_search_language

if TYPE_CHECKING:
    import datetime
    from decimal import Decimal

    from django.db.models import QuerySet
    from query_optimizer.validators import PaginationArgs

    from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet
    from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "ReservationUnitAllFilterSet",
    "ReservationUnitFilterSet",
]


class ReservationUnitFilterSetMixin:
    def get_only_with_permission(self, qs: ReservationUnitQuerySet, name: str, value: bool) -> QuerySet:
        """Returns reservation units where the user has any kind of permissions in its unit"""
        if not value:
            return qs

        user: AnyUser = self.request.user
        if user.is_anonymous:
            return qs.none()
        if user.is_superuser:
            return qs

        if user.permissions.has_general_role():
            return qs

        unit_ids = list(user.active_unit_roles)
        unit_group_ids = list(user.active_unit_group_roles)

        return qs.filter(Q(unit_id__in=unit_ids) | Q(unit__unit_groups__in=unit_group_ids)).distinct()


class ReservationUnitFilterSet(ModelFilterSet, ReservationUnitFilterSetMixin):
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

    publishing_state = EnumMultipleChoiceFilter(
        method="filter_by_publishing_state",
        enum=ReservationUnitPublishingState,
    )
    reservation_state = EnumMultipleChoiceFilter(
        method="filter_by_reservation_state",
        enum=ReservationUnitReservationState,
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

    def get_text_search(self, qs: ReservationUnitQuerySet, name: str, value: str) -> QuerySet:
        language = get_text_search_language(self.request)
        search = build_search(value, separator="&")
        query = SearchQuery(value=search, config=language, search_type="raw")
        match language:
            # Do search mostly with full text search, but also search some columns with containment search.
            # PostgreSQL full text search doesn't support postfix searching, so things like "room" won't find
            # reservation units with names like "workroom" or "bathroom". Don't do this for all fields to keep
            # performance reasonable.
            case "finnish":
                return qs.filter(models.Q(search_vector_fi=query) | models.Q(name_fi__icontains=value))
            case "english":
                return qs.filter(models.Q(search_vector_en=query) | models.Q(name_en__icontains=value))
            case "swedish":
                return qs.filter(models.Q(search_vector_sv=query) | models.Q(name_sv__icontains=value))

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
        return qs.visible() if value else qs.hidden()

    @staticmethod
    def get_reservation_kind(qs: ReservationUnitQuerySet, name: str, value: str) -> QuerySet:
        if name.upper() == ReservationKind.DIRECT_AND_SEASON:
            return qs.filter(reservation_kind__isnull=False)
        return qs.filter(reservation_kind__icontains=value)

    @staticmethod
    def filter_by_publishing_state(qs: ReservationUnitQuerySet, name: str, value: list[str]) -> models.QuerySet:
        return qs.with_publishing_state_in(value)

    @staticmethod
    def filter_by_reservation_state(qs: ReservationUnitQuerySet, name: str, value: list[str]) -> models.QuerySet:
        return qs.with_reservation_state_in(value)

    def get_filter_reservable(self, qs: ReservationUnitQuerySet, name: str, value: dict[str, Any]) -> QuerySet:
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

        # Calculate a cache key caching results for pagination.
        # Pagination arguments do not affect the calculated results (note: ordering does!).
        unaffecting = {"first", "last", "offset", "after", "before"}
        args = sorted(f"{key}={value}" for key, value in self.data.items() if key not in unaffecting)
        cache_key: str = base64.b64encode(",".join(args).encode()).decode()

        # Fetch the pagination information from the request.
        # This is set by the 'DjangoConnectionField' for each connection field in the request.
        # In this case, we want the 'reservation_units' entrypoints connection field pagination args,
        # so that we can limit the number of reservation units that we calculate the 'first_reservable_time' for.
        pagination_info: dict[str, PaginationArgs] | None = getattr(self.request, "optimizer_pagination", None)
        pagination_args = pagination_info.get("reservation_units") if pagination_info is not None else None

        date_start: datetime.date | None = value["reservable_date_start"]
        date_end: datetime.date | None = value["reservable_date_end"]
        time_start: datetime.time | None = value["reservable_time_start"]
        time_end: datetime.time | None = value["reservable_time_end"]
        minimum_duration_minutes: Decimal | None = value["reservable_minimum_duration_minutes"]
        show_only_reservable = bool(value.get("show_only_reservable", False))

        # Annotate all ReservationUnits with `first_reservable_datetime` since we need the info in the GraphQL object.
        # If the GQL field is not selected for the query, then this is unnecessary, but if we do not annotate the info
        # here, the object type we would need to fetch this info one item at a time, which is inefficient.
        qs = qs.with_first_reservable_time(
            filter_date_start=date_start,
            filter_date_end=date_end,
            filter_time_start=time_start,
            filter_time_end=time_end,
            minimum_duration_minutes=minimum_duration_minutes,
            show_only_reservable=show_only_reservable,
            pagination_args=pagination_args,
            cache_key=cache_key,
        )

        if not show_only_reservable:
            return qs

        return qs.exclude(first_reservable_datetime=None)


class ReservationUnitAllFilterSet(ModelFilterSet, ReservationUnitFilterSetMixin):
    unit = IntMultipleChoiceFilter()
    only_with_permission = django_filters.BooleanFilter(method="get_only_with_permission")

    class Meta:
        model = ReservationUnit
        fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }
        order_by = [
            "name_fi",
            "name_en",
            "name_sv",
            "rank",
        ]
