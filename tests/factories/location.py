from spaces.models import Location

from ._base import GenericDjangoModelFactory

__all__ = [
    "LocationFactory",
]


class LocationFactory(GenericDjangoModelFactory[Location]):
    class Meta:
        model = Location
