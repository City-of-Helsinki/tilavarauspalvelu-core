from graphene_django_extensions import DjangoNode

from services.models import Service

__all__ = [
    "ServiceNode",
]


class ServiceNode(DjangoNode):
    class Meta:
        model = Service
        fields = [
            "pk",
            "name",
            "service_type",
            "buffer_time_before",
            "buffer_time_after",
        ]
