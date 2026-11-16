from __future__ import annotations

from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from tilavarauspalvelu.models import Sport

__all__ = [
    "SportFilterSet",
]

from typing import TYPE_CHECKING

from utils.fields.filters import TranslatedCharFilter

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.models.sport.queryset import SportQuerySet


class SportFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    name_fi = TranslatedCharFilter(field_name="name_fi", lookup_expr="istartswith")
    name_en = TranslatedCharFilter(field_name="name_en", lookup_expr="istartswith")
    name_sv = TranslatedCharFilter(field_name="name_sv", lookup_expr="istartswith")

    class Meta:
        model = Sport
        fields = [
            "name_fi",
            "name_en",
            "name_sv",
        ]
        order_by = [
            "rank",
            "name_fi",
            "name_en",
            "name_sv",
        ]

    @staticmethod
    def order_by_name_sv(qs: SportQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_translated(field="name", language="sv", desc=desc)

    @staticmethod
    def order_by_name_en(qs: SportQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_translated(field="name", language="en", desc=desc)
