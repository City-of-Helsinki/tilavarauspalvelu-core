from spaces.models import Building

from ._base import GenericDjangoModelFactory

__all__ = [
    "BuildingFactory",
]


class BuildingFactory(GenericDjangoModelFactory[Building]):
    class Meta:
        model = Building
