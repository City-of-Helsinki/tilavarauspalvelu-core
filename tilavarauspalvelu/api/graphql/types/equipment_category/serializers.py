from graphene_django_extensions import NestingModelSerializer

from tilavarauspalvelu.models import EquipmentCategory

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
