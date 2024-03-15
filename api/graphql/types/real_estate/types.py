import graphene

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from spaces.models import RealEstate


class RealEstateType(OldPrimaryKeyObjectType):
    class Meta:
        model = RealEstate
        fields = ["pk", "surface_area", *get_all_translatable_fields(model)]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection
