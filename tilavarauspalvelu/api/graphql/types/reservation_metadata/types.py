from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import ReservationMetadataField, ReservationMetadataSet

from .permissions import ReservationMetadataSetPermission

__all__ = [
    "ReservationMetadataFieldNode",
    "ReservationMetadataSetNode",
]


class ReservationMetadataFieldNode(DjangoNode):
    class Meta:
        model = ReservationMetadataField
        fields = [
            "pk",
            "field_name",
        ]


class ReservationMetadataSetNode(DjangoNode):
    class Meta:
        model = ReservationMetadataSet
        fields = [
            "pk",
            "name",
            "supported_fields",
            "required_fields",
        ]
        permission_classes = [ReservationMetadataSetPermission]
