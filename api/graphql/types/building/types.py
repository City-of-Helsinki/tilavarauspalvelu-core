import graphene
from query_optimizer import RelatedField

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from api.graphql.types.real_estate.types import RealEstateType
from spaces.models import Building


class BuildingType(OldPrimaryKeyObjectType):
    real_estate = RelatedField(RealEstateType)

    class Meta:
        model = Building
        fields = ["pk", "real_estate", "surface_area", *get_all_translatable_fields(model)]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection
