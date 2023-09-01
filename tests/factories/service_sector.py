import factory
from factory import fuzzy

from spaces.models import ServiceSector

from ._base import GenericDjangoModelFactory

__all__ = [
    "ServiceSectorFactory",
]


class ServiceSectorFactory(GenericDjangoModelFactory[ServiceSector]):
    class Meta:
        model = ServiceSector

    name = fuzzy.FuzzyText()

    @factory.post_generation
    def units(self, create, units, **kwargs):
        if not create or not units:
            return

        for unit in units:
            self.units.add(unit)
