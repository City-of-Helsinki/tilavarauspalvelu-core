from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from tilavarauspalvelu.models import SalesItem

__all__ = [
    "SalesItemFilterSet",
]


class SalesItemFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = SalesItem
        fields = []
        order_by = [
            "pk",
            "name",
        ]
