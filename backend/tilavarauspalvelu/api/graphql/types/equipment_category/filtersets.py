from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from tilavarauspalvelu.models import EquipmentCategory

__all__ = [
    "EquipmentCategoryFilterSet",
]


class EquipmentCategoryFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = EquipmentCategory
