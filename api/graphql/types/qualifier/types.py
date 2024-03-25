from graphene_django_extensions import DjangoNode

from api.graphql.types.qualifier.filtersets import QualifierFilterSet
from api.graphql.types.qualifier.permissions import QualifierPermission
from reservation_units.models import Qualifier

__all__ = [
    "QualifierNode",
]


class QualifierNode(DjangoNode):
    class Meta:
        model = Qualifier
        fields = [
            "pk",
            "name",
        ]
        filterset_class = QualifierFilterSet
        permission_classes = [QualifierPermission]
