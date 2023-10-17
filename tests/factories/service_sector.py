from collections.abc import Iterable
from typing import Any

import factory
from factory import fuzzy

from spaces.models import ServiceSector, Unit

from ._base import GenericDjangoModelFactory

__all__ = [
    "ServiceSectorFactory",
]


class ServiceSectorFactory(GenericDjangoModelFactory[ServiceSector]):
    class Meta:
        model = ServiceSector

    name = fuzzy.FuzzyText()

    @factory.post_generation
    def units(self, create: bool, units: Iterable[Unit] | None, **kwargs: Any) -> None:
        if not create:
            return

        if not units and kwargs:
            from .unit import UnitFactory

            self.units.add(UnitFactory.create(**kwargs))

        for unit in units or []:
            self.units.add(unit)
