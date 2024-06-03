from typing import TYPE_CHECKING

import django_filters
from django.db import models
from django.db.models import Count, Q, QuerySet
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from api.graphql.types.unit.types import Unit
from common.date_utils import local_datetime
from permissions.helpers import has_any_general_permission
from permissions.models import GeneralPermissionChoices
from reservation_units.enums import ReservationKind

if TYPE_CHECKING:
    from common.typing import AnyUser

__all__ = [
    "UnitFilterSet",
]


class UnitFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    name_fi = django_filters.CharFilter(field_name="name_fi", lookup_expr="istartswith")
    name_en = django_filters.CharFilter(field_name="name_en", lookup_expr="istartswith")
    name_sv = django_filters.CharFilter(field_name="name_sv", lookup_expr="istartswith")

    service_sector = django_filters.NumberFilter(field_name="service_sectors__pk")

    only_with_permission = django_filters.BooleanFilter(method="get_only_with_permission")

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
    # `queryset.filter(...)` or `queryset.exclude(...)`) and thus needs to be reapplied.
    published_reservation_units = django_filters.BooleanFilter(method="get_published_reservation_units")
    own_reservations = django_filters.BooleanFilter(method="get_own_reservations")
    only_direct_bookable = django_filters.BooleanFilter(method="get_only_direct_bookable")
    only_seasonal_bookable = django_filters.BooleanFilter(method="get_only_seasonal_bookable")

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
            ("unit_groups__name", "unit_group_name"),
        ]

    def filter_queryset(self, queryset):
        queryset = queryset.annotate(
            reservation_count=Count("reservationunit__reservation"),
            reservation_units_count=Count("reservationunit"),
        )

        return super().filter_queryset(queryset)

    def filter_by_pk(self, qs, name, value):
        if value:
            return qs.filter(id__in=[model.id for model in value])

        return qs

    def get_only_with_permission(self, qs: QuerySet, name: str, value: bool) -> QuerySet:
        """Returns units where the user has any kind of permissions"""
        if not value:
            return qs

        user: AnyUser = self.request.user
        if user.is_anonymous:
            return qs.none()
        if user.is_superuser or has_any_general_permission(user, GeneralPermissionChoices.required_for_unit):
            return qs

        unit_ids = list(user.unit_permissions)
        unit_group_ids = list(user.unit_group_permissions)

        return qs.filter(Q(id__in=unit_ids) | Q(unit_groups__in=unit_group_ids)).distinct()

    def get_published_reservation_units(self, qs, name, value):
        now = local_datetime()

        if value:
            query = (
                Q(reservationunit__is_archived=False)
                & Q(reservationunit__is_draft=False)
                & (Q(reservationunit__publish_begins__isnull=True) | Q(reservationunit__publish_begins__lte=now))
                & (Q(reservationunit__publish_ends__isnull=True) | Q(reservationunit__publish_ends__gt=now))
                & (
                    Q(reservationunit__reservation_begins__isnull=True)
                    | Q(reservationunit__reservation_begins__lte=now)
                )
                & (Q(reservationunit__reservation_ends__isnull=True) | Q(reservationunit__reservation_ends__gt=now))
            )

        else:
            query = (
                Q(reservationunit__is_archived=True)
                | Q(reservationunit__is_draft=True)
                | (Q(reservationunit__publish_begins__gte=now))
                | (Q(reservationunit__publish_ends__lt=now))
                | (Q(reservationunit__reservation_begins__lte=now))
                | (Q(reservationunit__reservation_ends__gt=now))
            )

        qs = qs.filter(query)

        # Prevent multiple joins, see explanation above.
        qs.query.filter_is_sticky = True
        return qs

    def get_own_reservations(self, qs, name, value):
        user = self.request.user

        if user.is_anonymous:
            return qs.none()

        units_with_reservations = Q(reservationunit__reservation__user=user, _negated=not value)
        qs = qs.filter(units_with_reservations)

        # Prevent multiple joins, see explanation above.
        qs.query.filter_is_sticky = True
        return qs

    def get_only_direct_bookable(self, qs: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        if value:
            qs = qs.filter(
                reservationunit__reservation_kind__in=[
                    ReservationKind.DIRECT,
                    ReservationKind.DIRECT_AND_SEASON,
                ],
            )

            # Prevent multiple joins, see explanation above.
            qs.query.filter_is_sticky = True

        return qs

    def get_only_seasonal_bookable(self, qs: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        if value:
            qs = qs.filter(
                reservationunit__reservation_kind__in=[
                    ReservationKind.SEASON,
                    ReservationKind.DIRECT_AND_SEASON,
                ],
            )

            # Prevent multiple joins, see explanation above.
            qs.query.filter_is_sticky = True

        return qs
