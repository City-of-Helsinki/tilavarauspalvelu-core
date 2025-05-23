from __future__ import annotations

from typing import TYPE_CHECKING

from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from tilavarauspalvelu.models import ReservationUnitType

if TYPE_CHECKING:
    from django.db.models import QuerySet

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
