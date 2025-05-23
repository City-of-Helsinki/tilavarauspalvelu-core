from __future__ import annotations

import graphene
from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.enums import ResourceLocationType
from tilavarauspalvelu.models import Resource

from .filtersets import ResourceFilterSet
from .permissions import ResourcePermission


class ResourceNode(DjangoNode):
    location_type = graphene.Field(
        graphene.Enum.from_enum(ResourceLocationType),
        required=True,
    )

    class Meta:
        model = Resource
        fields = [
            "pk",
            "name",
            "location_type",
            "space",
        ]
        filterset_class = ResourceFilterSet
        permission_classes = [ResourcePermission]
