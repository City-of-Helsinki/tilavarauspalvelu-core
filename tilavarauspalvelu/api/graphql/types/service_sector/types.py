from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import ServiceSector

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
