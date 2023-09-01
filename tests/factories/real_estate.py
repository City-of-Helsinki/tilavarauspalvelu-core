from spaces.models import RealEstate

from ._base import GenericDjangoModelFactory

__all__ = [
    "RealEstateFactory",
]


class RealEstateFactory(GenericDjangoModelFactory[RealEstate]):
    class Meta:
        model = RealEstate
