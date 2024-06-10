import graphene
from graphene_django_extensions import DjangoNode

from resources.choices import ResourceLocationType
from resources.models import Resource
from tilavarauspalvelu.api.graphql.types.resource.filtersets import ResourceFilterSet
from tilavarauspalvelu.api.graphql.types.resource.permissions import ResourcePermission


class ResourceNode(DjangoNode):
    location_type = graphene.Field(graphene.Enum.from_enum(ResourceLocationType))

    class Meta:
        model = Resource
        fields = [
            "pk",
            "name",
            "location_type",
            "space",
            "buffer_time_before",
            "buffer_time_after",
        ]
        filterset_class = ResourceFilterSet
        permission_classes = [ResourcePermission]
