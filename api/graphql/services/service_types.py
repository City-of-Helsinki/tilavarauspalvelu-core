import graphene
from graphene_django import DjangoObjectType

from services.models import Service


class ServiceType(DjangoObjectType):
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
