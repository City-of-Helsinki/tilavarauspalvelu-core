from django.db import models
from graphene_django_extensions import DjangoNode
from graphene_django_extensions.fields import RelatedField
from query_optimizer import DjangoListField

from api.graphql.types.space.permissions import SpacePermission
from common.typing import GQLInfo
from spaces.models import Space

from .filtersets import SpaceFilterSet

__all__ = [
    "SpaceNode",
]


class SpaceNode(DjangoNode):
    parent = RelatedField(lambda: SpaceNode)
    children = DjangoListField(lambda: SpaceNode)
    resources = DjangoListField("api.graphql.types.resource.types.ResourceNode")

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

    def resolve_resources(root: Space, info: GQLInfo) -> models.QuerySet:
        return root.resource_set.all()
