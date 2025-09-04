import datetime
from typing import NotRequired, TypedDict

from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.search import SearchQuery
from django.db import models
from lookup_property import L
from undine import DjangoExpression, Filter, FilterSet, GQLInfo
from undine.exceptions import EmptyFilterResult

from tilavarauspalvelu.enums import (
    AccessType,
    ReservationKind,
    ReservationUnitPublishingState,
    ReservationUnitReservationState,
    UserRoleChoice,
)
from tilavarauspalvelu.models import ReservationUnit, ReservationUnitAccessType, User
from utils.date_utils import local_date
from utils.db import SubqueryArray, build_search
from utils.utils import get_text_search_language

__all__ = [
    "ReservationUnitAllFilterSet",
    "ReservationUnitFilterSet",
]


class AccessTypeFilterData(TypedDict):
    access_types: list[AccessType]
    access_type_begin_date: NotRequired[datetime.date | None]
    access_type_end_date: NotRequired[datetime.date | None]


class ReservationUnitFilterSet(FilterSet[ReservationUnit]):
    pk = Filter(lookup="in")
    uuid = Filter("ext_uuid")
    tprek_id = Filter("unit__tprek_id")
    tprek_department_id = Filter("unit__tprek_department_id")
    unit = Filter(lookup="in")
    unit_group = Filter("unit__unit_groups", lookup="in", distinct=True)
    reservation_unit_type = Filter(lookup="in")

    @Filter
    def min_persons_lte(self, info: GQLInfo[User], *, value: int) -> models.Q:
        return models.Q(min_persons__lte=value) | models.Q(min_persons__isnull=True)

    @Filter
    def min_persons_gte(self, info: GQLInfo[User], *, value: int) -> models.Q:
        return models.Q(min_persons__gte=value) | models.Q(min_persons__isnull=True)

    @Filter
    def max_persons_lte(self, info: GQLInfo[User], *, value: int) -> models.Q:
        return models.Q(max_persons__lte=value) | models.Q(max_persons__isnull=True)

    @Filter
    def max_persons_gte(self, info: GQLInfo[User], *, value: int) -> models.Q:
        return models.Q(max_persons__gte=value) | models.Q(max_persons__isnull=True)

    @Filter
    def persons_allowed(self, info: GQLInfo[User], *, value: int) -> models.Q:
        more_than_min = models.Q(min_persons__lte=value) | models.Q(min_persons__isnull=True)
        less_than_max = models.Q(max_persons__gte=value) | models.Q(max_persons__isnull=True)
        return more_than_min & less_than_max

    @Filter
    def text_search(self, info: GQLInfo[User], *, value: str) -> models.Q:
        language = get_text_search_language(info.context)
        search = build_search(value, separator="&")
        query = SearchQuery(value=search, config=language, search_type="raw")
        match language:
            # Do search mostly with full text search, but also search some columns with containment search.
            # PostgreSQL full text search doesn't support postfix searching, so things like "room" won't find
            # reservation units with names like "workroom" or "bathroom". Don't do this for all fields to keep
            # performance reasonable.
            case "finnish":
                return models.Q(search_vector_fi=query) | models.Q(name_fi__icontains=value)
            case "swedish":
                return models.Q(search_vector_sv=query) | models.Q(name_sv__icontains=value)
            case _:  # English and default
                return models.Q(search_vector_en=query) | models.Q(name_en__icontains=value)

    purposes = Filter(lookup="in")

    @Filter
    def equipments(self, info: GQLInfo[User], *, value: list[int]) -> models.Q:
        return models.Q(equipment_ids__contains=value)

    @equipments.aliases
    def equipments_aliases(self, info: GQLInfo[User], *, value: list[int]) -> dict[str, DjangoExpression]:  # noqa: ARG002
        return {"equipment_ids": ArrayAgg("equipments")}

    is_draft = Filter()

    @Filter
    def is_visible(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        is_published = models.Q(is_draft=False, is_archived=False)
        is_visible = models.Q(L(is_visible=True))
        return is_published & (is_visible if value else ~is_visible)

    @Filter(distinct=True)
    def only_with_permission(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        """Returns reservation units where the user has any kind of permissions in its unit"""
        return filter_only_with_permission(info, value=value)

    @Filter(distinct=True)
    def only_with_manage_permission(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        """Returns reservation units where the user has a manage permissions in its unit"""
        return filter_only_with_manage_permission(info, value=value)

    application_round = Filter("application_rounds", lookup="in", distinct=True)

    name_fi_exact = Filter("name_fi", lookup="iexact")
    name_en_exact = Filter("name_sv", lookup="iexact")
    name_sv_exact = Filter("name_en", lookup="iexact")

    name_fi_contains = Filter("name_fi", lookup="icontains")
    name_en_contains = Filter("name_sv", lookup="icontains")
    name_sv_contains = Filter("name_en", lookup="icontains")

    name_fi_startswith = Filter("name_fi", lookup="istartswith")
    name_en_startswith = Filter("name_sv", lookup="istartswith")
    name_sv_startswith = Filter("name_en", lookup="istartswith")

    description_fi_startswith = Filter("description_fi", lookup="iexact")
    description_sv_startswith = Filter("description_sv", lookup="iexact")
    description_en_startswith = Filter("description_en", lookup="iexact")

    description_fi_contains = Filter("description_fi", lookup="icontains")
    description_sv_contains = Filter("description_sv", lookup="icontains")
    description_en_contains = Filter("description_en", lookup="icontains")

    surface_area_gte = Filter("surface_area", lookup="gte")
    surface_area_lte = Filter("surface_area", lookup="lte")

    rank_gte = Filter("rank", lookup="gte")
    rank_lte = Filter("rank", lookup="lte")

    type_rank_gte = Filter("reservation_unit_type__rank", lookup="gte")
    type_rank_lte = Filter("reservation_unit_type__rank", lookup="lte")

    @Filter
    def reservation_kind(self, info: GQLInfo[User], *, value: ReservationKind) -> models.Q:
        match value:
            case ReservationKind.DIRECT:
                return models.Q(reservation_kind__in=ReservationKind.allows_direct)
            case ReservationKind.SEASON:
                return models.Q(reservation_kind__in=ReservationKind.allows_season)
            case ReservationKind.DIRECT_AND_SEASON:
                return models.Q(reservation_kind=value)
        return models.Q()

    @Filter
    def publishing_state(self, info: GQLInfo[User], *, value: list[ReservationUnitPublishingState]) -> models.Q:
        return models.Q(L(publishing_state__in=value))

    @Filter
    def reservation_state(self, info: GQLInfo[User], *, value: list[ReservationUnitReservationState]) -> models.Q:
        return models.Q(L(reservation_state__in=value))

    reservation_form = Filter(lookup="in")

    @Filter
    def access_type(self, info: GQLInfo[User], *, value: AccessTypeFilterData) -> models.Q:
        access_types = value["access_types"]
        if not access_types:
            return models.Q()

        return models.Q(available_access_types__overlap=access_types)

    @access_type.aliases
    def access_type_aliases(self, info: GQLInfo[User], *, value: AccessTypeFilterData) -> dict[str, DjangoExpression]:
        period_start = models.Value(value.get("access_type_begin_date") or local_date())
        period_end = models.Value(value.get("access_type_end_date") or datetime.date.max)
        return {
            "available_access_types": SubqueryArray(
                queryset=(
                    ReservationUnitAccessType.objects.filter(reservation_unit=models.OuterRef("pk"))
                    .filter(L(end_date__gt=period_start) & models.Q(begin_date__lte=period_end))
                    .values("access_type")
                ),
                agg_field="access_type",
                coalesce_output_type="varchar",
                output_field=models.CharField(null=True),
            ),
        }


class ReservationUnitAllFilterSet(FilterSet[ReservationUnit]):
    name_fi_exact = Filter("name_fi", lookup="iexact")
    name_sv_exact = Filter("name_sv", lookup="iexact")
    name_en_exact = Filter("name_en", lookup="iexact")

    name_fi_contains = Filter("name_fi", lookup="icontains")
    name_sv_contains = Filter("name_sv", lookup="icontains")
    name_en_contains = Filter("name_en", lookup="icontains")

    name_fi_startswith = Filter("name_fi", lookup="istartswith")
    name_sv_startswith = Filter("name_sv", lookup="istartswith")
    name_en_startswith = Filter("name_en", lookup="istartswith")

    unit = Filter(lookup="in")

    @Filter(distinct=True)
    def only_with_permission(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        """Returns reservation units where the user has any kind of permissions in its unit"""
        return filter_only_with_permission(info, value=value)

    @Filter(distinct=True)
    def only_with_manage_permission(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        """Returns reservation units where the user has a manage permissions in its unit"""
        return filter_only_with_manage_permission(info, value=value)


def filter_only_with_permission(info: GQLInfo[User], *, value: bool) -> models.Q:
    if not value:
        return models.Q()

    user = info.context.user
    if user.is_anonymous:
        raise EmptyFilterResult

    if user.is_superuser:
        return models.Q()

    if user.permissions.has_general_role():
        return models.Q()

    unit_ids = list(user.active_unit_roles)
    unit_group_ids = list(user.active_unit_group_roles)

    return models.Q(unit__in=unit_ids) | models.Q(unit__unit_groups__in=unit_group_ids)


def filter_only_with_manage_permission(info: GQLInfo[User], *, value: bool) -> models.Q:
    if not value:
        return models.Q()

    user = info.context.user
    if user.is_anonymous:
        raise EmptyFilterResult

    if user.is_superuser:
        return models.Q()

    role_choices = UserRoleChoice.can_manage_reservations()
    if user.permissions.has_general_role(role_choices=role_choices):
        return models.Q()

    unit_ids = user.permissions.unit_ids_where_has_role(role_choices=role_choices)
    unit_group_ids = user.permissions.unit_group_ids_where_has_role(role_choices=role_choices)

    return models.Q(unit__in=unit_ids) | models.Q(unit__unit_groups__in=unit_group_ids)
