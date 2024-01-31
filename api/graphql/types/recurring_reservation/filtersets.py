from typing import Literal

import django_filters
from django.db import models

from common.filtersets import BaseModelFilterSet, IntChoiceFilter, IntMultipleChoiceFilter
from reservations.models import RecurringReservation


class RecurringReservationFilterSet(BaseModelFilterSet):
    reservation_unit_name_fi = django_filters.CharFilter(method="filter_by_reservation_unit_name")
    reservation_unit_name_en = django_filters.CharFilter(method="filter_by_reservation_unit_name")
    reservation_unit_name_sv = django_filters.CharFilter(method="filter_by_reservation_unit_name")

    user = IntChoiceFilter()
    unit = IntMultipleChoiceFilter(field_name="reservation_unit__unit")
    reservation_unit = IntMultipleChoiceFilter()
    reservation_unit_type = IntMultipleChoiceFilter(field_name="reservation_unit__reservation_unit_type")

    order_by = django_filters.OrderingFilter(
        fields=[
            "pk",
            "name",
            "created",
            "begin_date",
            "end_date",
            "begin_time",
            "end_time",
            ("reservation_unit__name_fi", "reservation_unit_name_fi"),
            ("reservation_unit__name_en", "reservation_unit_name_en"),
            ("reservation_unit__name_sv", "reservation_unit_name_sv"),
            ("reservation_unit__unit__name_fi", "unit_name_fi"),
            ("reservation_unit__unit__name_en", "unit_name_en"),
            ("reservation_unit__unit__name_sv", "unit_name_sv"),
        ]
    )

    class Meta:
        model = RecurringReservation
        fields = {
            "name": ["exact"],
            "begin_date": ["gte"],
            "begin_time": ["gte"],
            "end_date": ["lte"],
            "end_time": ["lte"],
        }

    @staticmethod
    def filter_by_reservation_unit_name(qs: models.QuerySet, name: str, value: str) -> models.QuerySet:
        language: Literal["fi", "sv", "en"] = name[-2:]  # type: ignore[assignment]
        statement = models.Q()
        for word in value.split(","):
            statement |= models.Q(**{f"reservation_unit__name_{language}__istartswith": word.strip()})

        return qs.filter(statement)
