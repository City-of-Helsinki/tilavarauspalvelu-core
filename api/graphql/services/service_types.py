import graphene

from api.graphql.base_type import PrimaryKeyObjectType
from services.models import Service


class ServiceType(PrimaryKeyObjectType):
    buffer_time_before = graphene.String()
    buffer_time_after = graphene.String()

    class Meta:
        model = Service
        fields = (
            "id",
            "name",
            "service_type",
            "buffer_time_before",
            "buffer_time_after",
        )

        interfaces = (graphene.relay.Node,)
