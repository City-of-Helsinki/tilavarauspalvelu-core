import django_filters
from django.db import models
from django.db.models import Q
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from api.graphql.types.unit.types import Unit
from common.date_utils import local_datetime
from common.db import SubqueryCount
from reservation_units.enums import ReservationKind
from reservation_units.models import ReservationUnit
from reservations.models import Reservation
from spaces.querysets.unit import UnitQuerySet

__all__ = [
    "UnitFilterSet",
]


class UnitFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    name_fi = django_filters.CharFilter(field_name="name_fi", lookup_expr="istartswith")
    name_en = django_filters.CharFilter(field_name="name_en", lookup_expr="istartswith")
    name_sv = django_filters.CharFilter(field_name="name_sv", lookup_expr="istartswith")

    service_sector = django_filters.NumberFilter(field_name="service_sectors__pk")

    only_with_permission = django_filters.BooleanFilter(method="filter_by_only_with_permission")
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

    def filter_by_only_with_permission(self, qs: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        """Returns units where the user has any kind of permissions"""
        if not value:
            return qs

        user = self.request.user

        if user.is_anonymous:
            return qs.none()
        elif user.is_superuser or user.general_roles.exists():
            return qs

        return qs.filter(
            Q(id__in=user.unit_roles.values_list("unit", flat=True))
            | Q(unit_groups__in=user.unit_roles.values_list("unit_group", flat=True))
        ).distinct()

    def filter_by_own_reservations(self, qs: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        user = self.request.user

        if user.is_anonymous:
            return qs.none()

        units_with_reservations = Q(reservationunit__reservation__user=user)

        if value:
            return qs.filter(units_with_reservations).distinct()

        return qs.exclude(units_with_reservations).distinct()

    @staticmethod
    def filter_by_published_reservation_units(qs: models.QuerySet, name: str, value: bool) -> models.QuerySet:
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

        return qs.filter(query)

    @staticmethod
    def filter_by_only_direct_bookable(qs: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        if value:
            return qs.filter(
                reservationunit__reservation_kind__in=[
                    ReservationKind.DIRECT,
                    ReservationKind.DIRECT_AND_SEASON,
                ],
            )
        return qs

    @staticmethod
    def filter_by_only_seasonal_bookable(qs: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        if value:
            return qs.filter(
                reservationunit__reservation_kind__in=[
                    ReservationKind.SEASON,
                    ReservationKind.DIRECT_AND_SEASON,
                ],
            )
        return qs

    @staticmethod
    def order_by_reservation_units_count(qs: models.QuerySet, desc: bool) -> models.QuerySet:
        return qs.alias(
            reservation_units_count=SubqueryCount(
                ReservationUnit.objects.filter(unit=models.OuterRef("pk")).values("id"),
            ),
        ).order_by(models.OrderBy(models.F("reservation_units_count"), descending=desc))

    @staticmethod
    def order_by_reservation_count(qs: models.QuerySet, desc: bool) -> models.QuerySet:
        return qs.alias(
            reservation_count=SubqueryCount(
                Reservation.objects.filter(reservation_unit__unit=models.OuterRef("pk")).values("id"),
            ),
        ).order_by(models.OrderBy(models.F("reservation_count"), descending=desc))

    @staticmethod
    def order_by_unit_group_name_fi(qs: UnitQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_unit_group_name(language="fi", desc=desc)

    @staticmethod
    def order_by_unit_group_name_en(qs: UnitQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_unit_group_name(language="en", desc=desc)

    @staticmethod
    def order_by_unit_group_name_sv(qs: UnitQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_unit_group_name(language="sv", desc=desc)
