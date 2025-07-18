from __future__ import annotations

from typing import TYPE_CHECKING

import django_filters
from django.db.models import Q
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from tilavarauspalvelu.enums import ReservationKind, UserRoleChoice
from tilavarauspalvelu.models import Unit
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.models.unit.queryset import UnitQuerySet
    from tilavarauspalvelu.typing import AnyUser, WSGIRequest

__all__ = [
    "UnitAllFilterSet",
    "UnitFilterSet",
]


class UnitFilterSetMixin:
    request: WSGIRequest

    def filter_by_only_with_permission(self, qs: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        if not value:
            return qs

        user: AnyUser = self.request.user
        if user.is_anonymous:
            return qs.none()
        if user.is_superuser:
            return qs

        # All roles except the notification manager work with units.
        role_choices = set(UserRoleChoice) - {UserRoleChoice.NOTIFICATION_MANAGER}
        if user.permissions.has_general_role(role_choices=role_choices):
            return qs

        u_ids = list(user.active_unit_roles)
        g_ids = list(user.active_unit_group_roles)

        return qs.filter(Q(id__in=u_ids) | Q(unit_groups__in=g_ids)).distinct()

    # These filters use information across the relationship between Unit and ReservationUnit.
    # FilterSets apply individual filters in separate `queryset.filter(...)` calls.
    #
    # Due to how Django works when spanning `to-many` relationships in qs.filter(...) calls,
    # (see https://docs.djangoproject.com/en/5.0/topics/db/queries/#spanning-multi-valued-relationships),
    # this means that using a combination of these filters would result in a queryset where
    # ANY of their conditions are true for ANY ReservationUnit linked to a given Unit.
    #     e.g. using `published_reservation_units=True` and `only_direct_bookable=True`
    #     would return all Units where ANY of their ReservationUnit are EITHER published OR directly bookable.
    #
    # In this case, this is incorrect, since we want less permissive behavior:
    #     e.g. the aforementioned filter should return all Units where ANY of their ReservationUnit are
    #     BOTH published AND directly bookable.
    #
    # The incorrect behavior also has the side effect of adding multiple SQL joins to the
    # many-to-many though table between Unit and ReservationUnit, which makes the query
    # slower, since more duplication is needed.
    #
    # To prevent this, we need these filters to execute in order, and set `queryset.query.filter_is_sticky = True`
    # to indicate to the queryset that it should reuse joins it found from one filter to the next.
    # Note that this only applies until the next time the queryset is cloned, (e.g. when using
    # `queryset.filter(...)` or `.distinct()`) and thus needs to be reapplied between them.
    @staticmethod
    def filter_by_published_reservation_units(qs: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        now = local_datetime()

        if value:
            query = (
                Q(reservation_units__is_archived=False)
                & Q(reservation_units__is_draft=False)
                & (
                    Q(reservation_units__publish_begins_at__isnull=True)
                    | Q(reservation_units__publish_begins_at__lte=now)
                )
                & (Q(reservation_units__publish_ends_at__isnull=True) | Q(reservation_units__publish_ends_at__gt=now))
            )

        else:
            query = (
                Q(reservation_units__is_archived=True)
                | Q(reservation_units__is_draft=True)
                | (Q(reservation_units__publish_begins_at__gte=now))
                | (Q(reservation_units__publish_ends_at__lt=now))
            )

        # Prevent multiple joins, see explanation above.
        qs.query.filter_is_sticky = True
        qs = qs.filter(query)
        qs.query.filter_is_sticky = True
        return qs.distinct()

    @staticmethod
    def filter_by_only_direct_bookable(qs: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        if not value:
            return qs

        # Prevent multiple joins, see explanation above.
        qs.query.filter_is_sticky = True
        qs = qs.filter(reservation_units__reservation_kind__in=ReservationKind.allows_direct)
        qs.query.filter_is_sticky = True
        return qs.distinct()

    @staticmethod
    def filter_by_only_seasonal_bookable(qs: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        if not value:
            return qs

        # Prevent multiple joins, see explanation above.
        qs.query.filter_is_sticky = True
        qs = qs.filter(reservation_units__reservation_kind__in=ReservationKind.allows_season)
        qs.query.filter_is_sticky = True
        return qs.distinct()

    def filter_by_own_reservations(self, qs: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        user = self.request.user

        if user.is_anonymous:
            return qs.none()

        # Prevent multiple joins, see explanation above.
        qs.query.filter_is_sticky = True
        qs = qs.filter(Q(reservation_units__reservations__user=user, _negated=not value))
        qs.query.filter_is_sticky = True
        return qs.distinct()


class UnitFilterSet(ModelFilterSet, UnitFilterSetMixin):
    pk = IntMultipleChoiceFilter()
    unit_group = IntMultipleChoiceFilter(field_name="unit_groups")

    name_fi = django_filters.CharFilter(field_name="name_fi", lookup_expr="istartswith")
    name_en = django_filters.CharFilter(field_name="name_en", lookup_expr="istartswith")
    name_sv = django_filters.CharFilter(field_name="name_sv", lookup_expr="istartswith")

    only_with_permission = django_filters.BooleanFilter(method="filter_by_only_with_permission")

    # These filters, need to be defined in sequence (to be executed in sequence). See explanation in UnitFilterSetMixin.
    published_reservation_units = django_filters.BooleanFilter(method="filter_by_published_reservation_units")
    own_reservations = django_filters.BooleanFilter(method="filter_by_own_reservations")
    only_direct_bookable = django_filters.BooleanFilter(method="filter_by_only_direct_bookable")
    only_seasonal_bookable = django_filters.BooleanFilter(method="filter_by_only_seasonal_bookable")

    class Meta:
        model = Unit
        fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }
        order_by = [
            "pk",
            "name_fi",
            "name_en",
            "name_sv",
            "rank",
            "reservation_count",
            "reservation_units_count",
            "unit_group_name_fi",
            "unit_group_name_en",
            "unit_group_name_sv",
        ]

    @staticmethod
    def order_by_reservation_units_count(qs: UnitQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_reservation_units_count(desc=desc)

    @staticmethod
    def order_by_reservation_count(qs: UnitQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_reservation_count(desc=desc)

    @staticmethod
    def order_by_unit_group_name_fi(qs: UnitQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_unit_group_name(language="fi", desc=desc)

    @staticmethod
    def order_by_unit_group_name_en(qs: UnitQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_unit_group_name(language="en", desc=desc)

    @staticmethod
    def order_by_unit_group_name_sv(qs: UnitQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_unit_group_name(language="sv", desc=desc)


class UnitAllFilterSet(ModelFilterSet, UnitFilterSetMixin):
    unit = IntMultipleChoiceFilter()
    unit_group = IntMultipleChoiceFilter(field_name="unit_groups")

    name_fi = django_filters.CharFilter(field_name="name_fi", lookup_expr="istartswith")
    name_en = django_filters.CharFilter(field_name="name_en", lookup_expr="istartswith")
    name_sv = django_filters.CharFilter(field_name="name_sv", lookup_expr="istartswith")

    only_with_permission = django_filters.BooleanFilter(method="filter_by_only_with_permission")

    # These filters, need to be defined in sequence (to be executed in sequence). See explanation in UnitFilterSetMixin.
    published_reservation_units = django_filters.BooleanFilter(method="filter_by_published_reservation_units")
    own_reservations = django_filters.BooleanFilter(method="filter_by_own_reservations")
    only_direct_bookable = django_filters.BooleanFilter(method="filter_by_only_direct_bookable")
    only_seasonal_bookable = django_filters.BooleanFilter(method="filter_by_only_seasonal_bookable")

    class Meta:
        model = Unit
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
