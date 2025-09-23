from __future__ import annotations

from graphene_django_extensions.filters import IntChoiceFilter, IntMultipleChoiceFilter, ModelFilterSet

from tilavarauspalvelu.models import Equipment

__all__ = [
    "EquipmentAllFilterSet",
    "EquipmentFilterSet",
]


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
