from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from reservation_units.models import Purpose

__all__ = [
    "PurposeFilterSet",
]


class PurposeFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = Purpose
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
