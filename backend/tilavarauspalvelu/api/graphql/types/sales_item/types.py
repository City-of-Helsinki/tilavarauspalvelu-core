from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import SalesItem

from .filtersets import SalesItemFilterSet
from .permissions import SalesItemPermission

__all__ = [
    "SalesItemNode",
]


class SalesItemNode(DjangoNode):
    class Meta:
        model = SalesItem
        fields = [
            "pk",
            "name",
            "tax_level",
        ]
        filterset_class = SalesItemFilterSet
        permission_classes = [SalesItemPermission]
