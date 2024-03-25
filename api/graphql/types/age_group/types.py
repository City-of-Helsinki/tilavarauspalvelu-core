from graphene_django_extensions import DjangoNode

from api.graphql.types.age_group.permissions import AgeGroupPermission
from reservations.models import AgeGroup

__all__ = [
    "AgeGroupNode",
]


class AgeGroupNode(DjangoNode):
    class Meta:
        model = AgeGroup
        fields = [
            "pk",
            "minimum",
            "maximum",
        ]
        permission_classes = [AgeGroupPermission]
