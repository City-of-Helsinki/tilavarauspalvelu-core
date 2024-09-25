from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import Qualifier

from .filtersets import QualifierFilterSet
from .permissions import QualifierPermission

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
