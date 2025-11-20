from __future__ import annotations

from typing import TYPE_CHECKING

from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from tilavarauspalvelu.models import ReservationUnitType

if TYPE_CHECKING:
    from django.db import models
    from django.db.models import QuerySet

    from tilavarauspalvelu.models.reservation_unit_type.queryset import ReservationUnitTypeQuerySet


__all__ = [
    "ReservationUnitTypeFilterSet",
]


class ReservationUnitTypeFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = ReservationUnitType
        fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }
        order_by = [
            "rank",
            "name_fi",
            "name_en",
            "name_sv",
        ]

    def filter_queryset(self, queryset: QuerySet) -> QuerySet:
        return super().filter_queryset(queryset.order_by("rank"))

    @staticmethod
    def order_by_name_sv(qs: ReservationUnitTypeQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_translated(field="name", language="sv", desc=desc)

    @staticmethod
    def order_by_name_en(qs: ReservationUnitTypeQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_translated(field="name", language="en", desc=desc)
