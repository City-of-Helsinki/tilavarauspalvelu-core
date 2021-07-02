import graphene
from graphene_django import DjangoObjectType

from api.graphql.spaces.space_types import BuildingType
from resources.models import Resource


class ResourceType(DjangoObjectType):
    building = graphene.List(BuildingType)

    class Meta:
        model = Resource
        fields = (
            "id",
            "location_type",
            "name",
            "space",
            "buffer_time_before",
            "buffer_time_after",
        )
