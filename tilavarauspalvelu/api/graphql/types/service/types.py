from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import Service

from .permissions import ServicePermission

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
        permission_classes = [ServicePermission]
