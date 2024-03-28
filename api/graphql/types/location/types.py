import graphene
from graphene_django_extensions import DjangoNode

from common.typing import GQLInfo
from spaces.models import Location

__all__ = [
    "LocationNode",
]


class LocationNode(DjangoNode):
    longitude = graphene.String()
    latitude = graphene.String()

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
        return root.lon

    def resolve_latitude(root: Location, info: GQLInfo) -> float | None:
        return root.lat
