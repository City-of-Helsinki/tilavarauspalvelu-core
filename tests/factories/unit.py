import factory

from spaces.models import Unit, UnitGroup

from ._base import GenericDjangoModelFactory

__all__ = [
    "UnitFactory",
    "UnitGroupFactory",
]


class UnitFactory(GenericDjangoModelFactory[Unit]):
    class Meta:
        model = Unit


class UnitGroupFactory(GenericDjangoModelFactory[UnitGroup]):
    class Meta:
        model = UnitGroup

    @factory.post_generation
    def units(self, create, units, **kwargs):
        if not create or not units:
            return

        for unit in units:
            self.units.add(unit)
