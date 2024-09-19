import graphene
from django.db import models
from graphene_django_extensions import DjangoNode
from query_optimizer import AnnotatedField

from common.typing import GQLInfo
from tilavarauspalvelu.models import Location

__all__ = [
    "LocationNode",
]


class LocationNode(DjangoNode):
    longitude = AnnotatedField(graphene.String, expression=models.F("coordinates"))
    latitude = AnnotatedField(graphene.String, expression=models.F("coordinates"))

    class Meta:
        model = Location
        fields = [
            "pk",
            "address_zip",
            "longitude",
            "latitude",
            "address_street",
            "address_city",
        ]

    def resolve_longitude(root: Location, info: GQLInfo) -> float | None:
        coordinates = getattr(root, "longitude", None)
        if coordinates is None:
            return None
        return coordinates.x

    def resolve_latitude(root: Location, info: GQLInfo) -> float | None:
        coordinates = getattr(root, "latitude", None)
        if coordinates is None:
            return None
        return coordinates.y
