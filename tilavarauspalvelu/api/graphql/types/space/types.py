from django.db import models
from graphene_django_extensions import DjangoNode
from graphene_django_extensions.fields import RelatedField
from query_optimizer import DjangoListField

from tilavarauspalvelu.models import Space
from tilavarauspalvelu.typing import GQLInfo

from .filtersets import SpaceFilterSet
from .permissions import SpacePermission

__all__ = [
    "SpaceNode",
]


class SpaceNode(DjangoNode):
    parent = RelatedField(lambda: SpaceNode)
    children = DjangoListField(lambda: SpaceNode)

    class Meta:
        model = Space
        fields = [
            "pk",
            "name",
            "max_persons",
            "surface_area",
            "code",
            "parent",
            "building",
            "unit",
            "resources",
            "children",
        ]
        filterset_class = SpaceFilterSet
        permission_classes = [SpacePermission]

    def resolve_children(root: Space, info: GQLInfo) -> models.QuerySet:
        return Space.objects.filter(parent=root)
