from __future__ import annotations

from graphene_django_extensions.filters import IntChoiceFilter, IntMultipleChoiceFilter, ModelFilterSet

from tilavarauspalvelu.models import Equipment

__all__ = [
    "EquipmentAllFilterSet",
    "EquipmentFilterSet",
]

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.models.equipment.queryset import EquipmentQuerySet


class EquipmentFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    rank_gte = IntChoiceFilter(field_name="category__rank", lookup_expr="gte")
    rank_lte = IntChoiceFilter(field_name="category__rank", lookup_expr="lte")

    class Meta:
        model = Equipment
        fields = {
            "name": ["exact", "icontains", "istartswith"],
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }
        order_by = [
            "name",
            "name_fi",
            "name_en",
            "name_sv",
            ("category__rank", "category_rank"),
        ]

    @staticmethod
    def order_by_name_sv(qs: EquipmentQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_translated(field="name", language="sv", desc=desc)

    @staticmethod
    def order_by_name_en(qs: EquipmentQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_translated(field="name", language="en", desc=desc)


class EquipmentAllFilterSet(ModelFilterSet):
    class Meta:
        model = Equipment
        order_by = [
            "name",
            "name_fi",
            "name_en",
            "name_sv",
            ("category__rank", "category_rank"),
        ]

    @staticmethod
    def order_by_name_sv(qs: EquipmentQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_translated(field="name", language="sv", desc=desc)

    @staticmethod
    def order_by_name_en(qs: EquipmentQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_translated(field="name", language="en", desc=desc)
