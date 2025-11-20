from __future__ import annotations

from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from tilavarauspalvelu.models import IntendedUse

__all__ = [
    "IntendedUseFilterSet",
]

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.models.intended_use.queryset import IntendedUseQuerySet


class IntendedUseFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = IntendedUse
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
    def order_by_name_sv(qs: IntendedUseQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_translated(field="name", language="sv", desc=desc)

    @staticmethod
    def order_by_name_en(qs: IntendedUseQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_translated(field="name", language="en", desc=desc)
