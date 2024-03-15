import graphene

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from common.typing import GQLInfo
from spaces.models import Location


class LocationType(OldPrimaryKeyObjectType):
    longitude = graphene.String()
    latitude = graphene.String()

    class Meta:
        model = Location
        fields = ["address_zip", "longitude", "latitude", *get_all_translatable_fields(model)]

        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    def resolve_longitude(root: Location, info: GQLInfo):
        return root.lon

    def resolve_latitude(root: Location, info: GQLInfo):
        return root.lat
