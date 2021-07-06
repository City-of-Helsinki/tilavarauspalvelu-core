import graphene

from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.spaces.space_types import BuildingType
from resources.models import Resource


class ResourceType(PrimaryKeyObjectType):
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

        filter_fields = {
            "name": ["exact", "icontains", "istartswith"],
        }

        interfaces = (graphene.relay.Node,)

    def resolve_buffer_time_before(self, info):
        if self.buffer_time_before is None:
            return None
        return self.buffer_time_before.total_seconds()

    def resolve_buffer_time_after(self, info):
        if self.buffer_time_after is None:
            return None
        return self.buffer_time_after.total_seconds()
