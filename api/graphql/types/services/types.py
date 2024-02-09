import graphene

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.duration_field import Duration
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from services.models import Service


class ServiceType(OldPrimaryKeyObjectType):
    buffer_time_before = Duration()
    buffer_time_after = Duration()

    class Meta:
        model = Service
        fields = ["pk", "service_type", "buffer_time_before", "buffer_time_after", *get_all_translatable_fields(model)]

        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection
