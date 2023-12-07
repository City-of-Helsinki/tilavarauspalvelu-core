import operator
from functools import reduce

import django_filters
from django.db.models import Expression, F, Q
from django.utils import timezone
from elasticsearch_django.models import SearchQuery

from common.filtersets import BaseModelFilterSet, IntMultipleChoiceFilter
from elastic_django.reservation_units.query_builder import (
    ReservationUnitQueryBuilderMixin,
)
from reservation_units.enums import ReservationState, ReservationUnitState
from reservation_units.models import (
    Equipment,
    ReservationKind,
    ReservationUnit,
)
from reservation_units.utils.reservation_unit_reservation_state_helper import (
    ReservationUnitReservationStateHelper,
)
from reservation_units.utils.reservation_unit_state_helper import (
    ReservationUnitStateHelper,
)
from spaces.models import Unit


class ReservationUnitsFilterSet(BaseModelFilterSet, ReservationUnitQueryBuilderMixin):
    pk = IntMultipleChoiceFilter()
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
        # Must use upper case characters for value to comply with GraphQL Enum
        choices=tuple((state.value, state.value) for state in ReservationUnitState),
    )

    reservation_state = django_filters.MultipleChoiceFilter(
        method="get_reservation_state",
        choices=tuple((state.name, state.value) for state in ReservationState),
    )

    only_with_permission = django_filters.BooleanFilter(method="get_only_with_permission")

    order_by = django_filters.OrderingFilter(
        fields=(
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
        )
    )

    class Meta:
        model = ReservationUnit
        fields = ["pk", "unit", "keyword_groups"]  # TODO : Remove or clear

    def get_text_search(self, qs, property, value: str):
        query_str = self.build_elastic_query_str(value)

        sq = SearchQuery.do_search("reservation_units", {"query_string": {"query": query_str}})

        return ReservationUnit.objects.from_search_results(sq)

    def get_max_persons_gte(self, qs, property, value):
        filters = Q(max_persons__gte=value) | Q(max_persons__isnull=True)
        return qs.filter(filters)

    def get_max_persons_lte(self, qs, property, value):
        filters = Q(max_persons__lte=value) | Q(max_persons__isnull=True)
        return qs.filter(filters)

    def get_min_persons_gte(self, qs, property, value):
        filters = Q(min_persons__gte=value) | Q(min_persons__isnull=True)
        return qs.filter(filters)

    def get_min_persons_lte(self, qs, property, value):
        filters = Q(min_persons__lte=value) | Q(min_persons__isnull=True)
        return qs.filter(filters)

    def get_is_visible(self, qs, property, value):
        now = timezone.now()
        qs = qs.filter(is_draft=False, is_archived=False)
        published = (Q(publish_begins__lte=now) | Q(publish_begins__isnull=True)) & (
            Q(publish_ends__gt=now)
            | Q(publish_ends__isnull=True)
            | Q(
                publish_ends__lt=F("publish_begins")
            )  # When end is before begin and begin is now or before it is considered as (re)published.
        )

        if value:
            return qs.filter(published)
        return qs.exclude(published)

    def get_reservation_kind(self, qs, property, value):
        if property.upper() == ReservationKind.DIRECT_AND_SEASON:
            return qs.filter(reservation_kind__isnull=False)

        return qs.filter(reservation_kind__icontains=value)

    def get_state(self, qs, property, value: list[str]):
        queries = []
        for state in value:
            queries.append(ReservationUnitStateHelper.get_state_query(state))
        query = reduce(operator.or_, (query for query in queries))
        return qs.filter(query).distinct()

    def get_reservation_state(self, qs, property, value: list[str]):
        query: Q = Q()
        aliases: dict[str, Expression | F] = {}
        for state in value:
            query_state = ReservationUnitReservationStateHelper.get_state_query(state)
            query |= query_state.filters
            aliases |= query_state.aliases
        return qs.alias(**aliases).filter(query).distinct()

    def get_only_with_permission(self, qs, property, value):
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


class EquipmentFilterSet(django_filters.FilterSet):
    rank_gte = django_filters.NumberFilter(field_name="category__rank", lookup_expr="gte")
    rank_lte = django_filters.NumberFilter(field_name="category__rank", lookup_expr="lte")

    order_by = django_filters.OrderingFilter(
        fields=("name", ("category__rank", "category_rank")),
    )

    class Meta:
        model = Equipment
        fields = ["name"]


class PurposeFilterSet(django_filters.FilterSet):
    order_by = django_filters.OrderingFilter(
        fields=("rank", "name_fi", "name_en", "name_sv"),
    )

    def filter_queryset(self, queryset):
        return super().filter_queryset(queryset.order_by("rank"))


class ReservationUnitTypeFilterSet(django_filters.FilterSet):
    order_by = django_filters.OrderingFilter(
        fields=("rank", "name_fi", "name_en", "name_sv"),
    )

    def filter_queryset(self, queryset):
        return super().filter_queryset(queryset.order_by("rank"))
