from __future__ import annotations

from typing import TYPE_CHECKING

import django_filters
from django.db.models import Q
from graphene_django_extensions import ModelFilterSet

from tilavarauspalvelu.models import RecurringReservation, ReservationUnit, ReservationUnitType, Unit, User

if TYPE_CHECKING:
    from django.db.models import QuerySet

__all__ = [
    "RecurringReservationFilterSet",
]


class RecurringReservationFilterSet(ModelFilterSet):
    begin_date = django_filters.DateFilter(field_name="begin_date", lookup_expr="gte")
    end_date = django_filters.DateFilter(field_name="end_date", lookup_expr="lte")
    begin_time = django_filters.TimeFilter(field_name="begin_time", lookup_expr="gte")
    end_time = django_filters.TimeFilter(field_name="end_time", lookup_expr="lte")

    user = django_filters.ModelChoiceFilter(field_name="user", queryset=User.objects.all())

    reservation_unit_name_fi = django_filters.CharFilter(method="get_reservation_unit_name")
    reservation_unit_name_en = django_filters.CharFilter(method="get_reservation_unit_name")
    reservation_unit_name_sv = django_filters.CharFilter(method="get_reservation_unit_name")

    unit = django_filters.ModelMultipleChoiceFilter(method="get_unit", queryset=Unit.objects.all())

    reservation_unit = django_filters.ModelMultipleChoiceFilter(
        method="get_reservation_unit", queryset=ReservationUnit.objects.all()
    )

    reservation_unit_type = django_filters.ModelMultipleChoiceFilter(
        method="get_reservation_unit_type", queryset=ReservationUnitType.objects.all()
    )

    class Meta:
        model = RecurringReservation
        fields = [
            "name",
        ]
        order_by = [
            "pk",
            "name",
            "created",
            "begin_date",
            "begin_time",
            "end_date",
            "end_time",
            ("reservation_unit__name_fi", "reservation_unit_name_fi"),
            ("reservation_unit__name_en", "reservation_unit_name_en"),
            ("reservation_unit__name_sv", "reservation_unit_name_sv"),
            ("reservation_unit__unit__name_fi", "unit_name_fi"),
            ("reservation_unit__unit__name_en", "unit_name_en"),
            ("reservation_unit__unit__name_sv", "unit_name_sv"),
        ]

    def get_reservation_unit_name(
        self,
        qs: QuerySet[RecurringReservation],
        name: str,
        value: str,
    ) -> QuerySet[RecurringReservation]:
        language = name[-2:]
        words = value.split(",")

        query = Q()
        for word in words:
            word = word.strip()
            if language == "en":
                query |= Q(reservation_unit__name_en__istartswith=word)
            elif language == "sv":
                query |= Q(reservation_unit__name_sv__istartswith=word)
            else:
                query |= Q(reservation_unit__name_fi__istartswith=word)

        return qs.filter(query).distinct()

    def get_unit(
        self,
        qs: QuerySet[RecurringReservation],
        name: str,
        value: list[int],
    ) -> QuerySet[RecurringReservation]:
        if not value:
            return qs

        return qs.filter(reservation_unit__unit__in=value)

    def get_reservation_unit(
        self,
        qs: QuerySet[RecurringReservation],
        name: str,
        value: list[int],
    ) -> QuerySet[RecurringReservation]:
        if not value:
            return qs

        return qs.filter(reservation_unit__in=value)

    def get_reservation_unit_type(
        self,
        qs: QuerySet[RecurringReservation],
        name: str,
        value: list[str],
    ) -> QuerySet[RecurringReservation]:
        if not value:
            return qs
        return qs.filter(reservation_unit__reservation_unit_type__in=value)
