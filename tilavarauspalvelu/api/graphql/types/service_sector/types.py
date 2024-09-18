from graphene_django_extensions import DjangoNode

from spaces.models import ServiceSector

from .permissions import ServiceSectorPermission

__all__ = [
    "ServiceSectorNode",
]


class ServiceSectorNode(DjangoNode):
    class Meta:
        model = ServiceSector
        fields = [
            "pk",
            "name",
        ]
        permission_classes = [ServiceSectorPermission]
