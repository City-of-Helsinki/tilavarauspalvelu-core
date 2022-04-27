import graphene

from api.graphql.base_connection import TilavarausBaseConnection
from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.duration_field import Duration
from api.graphql.translate_fields import get_all_translatable_fields
from services.models import Service


class ServiceType(PrimaryKeyObjectType):
    buffer_time_before = Duration()
    buffer_time_after = Duration()

    class Meta:
        model = Service
        fields = [
            "pk",
            "service_type",
            "buffer_time_before",
            "buffer_time_after",
        ] + get_all_translatable_fields(model)

        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection
