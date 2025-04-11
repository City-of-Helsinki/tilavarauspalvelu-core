from __future__ import annotations

from typing import TYPE_CHECKING

import django_filters
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter
from lookup_property import L

from tilavarauspalvelu.models import ReservationUnitAccessType
from utils.date_utils import local_date

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.models.reservation_unit_access_type.queryset import ReservationUnitAccessTypeQuerySet


__all__ = [
    "ReservationUnitAccessTypeFilterSet",
]


class ReservationUnitAccessTypeFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    is_active_or_future = django_filters.BooleanFilter(method="filter_is_active_or_future")

    class Meta:
        model = ReservationUnitAccessType
        order_by = ["pk", "begin_date"]

    @staticmethod
    def filter_is_active_or_future(qs: ReservationUnitAccessTypeQuerySet, name: str, value: bool) -> QuerySet:
        today = local_date()
        ftr = L(end_date__gt=today)
        return qs.filter(ftr if value else ~ftr)
