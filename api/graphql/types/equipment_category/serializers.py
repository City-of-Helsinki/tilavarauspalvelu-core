from graphene_django_extensions import NestingModelSerializer

from reservation_units.models import EquipmentCategory

__all__ = [
    "EquipmentCategorySerializer",
]


class EquipmentCategorySerializer(NestingModelSerializer):
    class Meta:
        model = EquipmentCategory
        fields = [
            "pk",
            "name",
        ]
