import graphene

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from spaces.models import ServiceSector


class ServiceSectorType(OldPrimaryKeyObjectType):
    class Meta:
        model = ServiceSector
        fields = ["id", *get_all_translatable_fields(model)]
        filter_fields = []
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection
