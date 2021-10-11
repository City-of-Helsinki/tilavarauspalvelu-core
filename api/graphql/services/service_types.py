import graphene

from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.translate_fields import get_all_translatable_fields
from services.models import Service


class ServiceType(PrimaryKeyObjectType):
    buffer_time_before = graphene.String()
    buffer_time_after = graphene.String()

    class Meta:
        model = Service
        fields = [
            "id",
            "service_type",
            "buffer_time_before",
            "buffer_time_after",
        ] + get_all_translatable_fields(model)

        interfaces = (graphene.relay.Node,)
