import operator
from functools import reduce

import django_filters
from django.db.models import Q

from reservation_units.models import ReservationUnit, ReservationUnitType
from reservations.models import Reservation, User
from spaces.models import Unit


class RecurringReservationFilterSet(django_filters.FilterSet):
    begin_date = django_filters.DateFilter(field_name="begin_date", lookup_expr="gte")
    end_date = django_filters.DateFilter(field_name="end_date", lookup_expr="lte")
    begin_time = django_filters.TimeFilter(field_name="begin_time", lookup_expr="gte")
    end_time = django_filters.TimeFilter(field_name="end_time", lookup_expr="lte")

    user = django_filters.ModelChoiceFilter(
        field_name="user", queryset=User.objects.all()
    )

    reservation_unit_name_fi = django_filters.CharFilter(
        method="get_reservation_unit_name"
    )
    reservation_unit_name_en = django_filters.CharFilter(
        method="get_reservation_unit_name"
    )
    reservation_unit_name_sv = django_filters.CharFilter(
        method="get_reservation_unit_name"
    )

    unit = django_filters.ModelMultipleChoiceFilter(
        method="get_unit", queryset=Unit.objects.all()
    )

    reservation_unit = django_filters.ModelMultipleChoiceFilter(
        method="get_reservation_unit", queryset=ReservationUnit.objects.all()
    )

    reservation_unit_type = django_filters.ModelMultipleChoiceFilter(
        method="get_reservation_unit_type", queryset=ReservationUnitType.objects.all()
    )

    order_by = django_filters.OrderingFilter(
        fields=(
            "created",
            "begin_date",
            "end_date",
            "begin_time",
            "end_time",
            "name",
            "pk",
            ("reservation_unit__name_fi", "reservation_unit_name_fi"),
            ("reservation_unit__name_en", "reservation_unit_name_en"),
            ("reservation_unit__name_sv", "reservation_unit_name_sv"),
            ("reservation_unit__unit__name_fi", "unit_name_fi"),
            ("reservation_unit__unit__name_en", "unit_name_en"),
            ("reservation_unit__unit__name_sv", "unit_name_sv"),
        )
    )

    class Meta:
        model = Reservation
        fields = ["begin", "end"]

    def get_reservation_unit_name(self, qs, property: str, value: str):
        language = property[-2:]
        words = value.split(",")
        queries = []
        for word in words:
            word = word.strip()
            if language == "en":
                queries.append(Q(reservation_unit__name_en__istartswith=word))
            elif language == "sv":
                queries.append(Q(reservation_unit__name_sv__istartswith=word))
            else:
                queries.append(Q(reservation_unit__name_fi__istartswith=word))

        query = reduce(operator.or_, (query for query in queries))
        return qs.filter(query).distinct()

    def get_unit(self, qs, property, value):
        if not value:
            return qs

        return qs.filter(reservation_unit__unit__in=value)

    def get_reservation_unit(self, qs, property, value):
        if not value:
            return qs

        return qs.filter(reservation_unit__in=value)

    def get_reservation_unit_type(self, qs, property, value):
        if not value:
            return qs
        return qs.filter(reservation_unit__reservation_unit_type__in=value)
