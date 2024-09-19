from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import RealEstate

__all__ = [
    "RealEstateNode",
]


class RealEstateNode(DjangoNode):
    class Meta:
        model = RealEstate
        fields = [
            "pk",
            "name",
            "surface_area",
        ]
