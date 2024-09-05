from collections.abc import Iterable
from typing import Any

import factory
from factory import fuzzy

from spaces.models import ServiceSector, Unit, UnitGroup

from ._base import GenericDjangoModelFactory, NullableSubFactory

__all__ = [
    "UnitFactory",
    "UnitGroupFactory",
]


class UnitFactory(GenericDjangoModelFactory[Unit]):
    class Meta:
        model = Unit

    tprek_id = None
    tprek_department_id = None
    name = fuzzy.FuzzyText()
    description = ""
    short_description = ""
    web_page = ""
    email = ""
    phone = ""
    rank = 0
    payment_merchant = NullableSubFactory("tests.factories.PaymentMerchantFactory", null=True)
    payment_accounting = NullableSubFactory("tests.factories.PaymentAccountingFactory", null=True)
    origin_hauki_resource = None

    @factory.post_generation
    def service_sectors(self, create: bool, service_sectors: Iterable[ServiceSector] | None, **kwargs: Any) -> None:
        if not create:
            return

        if not service_sectors and kwargs:
            from .service_sector import ServiceSectorFactory

            self.service_sectors.add(ServiceSectorFactory.create(**kwargs))

        for service_sector in service_sectors or []:
            self.service_sectors.add(service_sector)

    @factory.post_generation
    def unit_groups(self, create: bool, unit_groups: Iterable[UnitGroup] | None, **kwargs: Any) -> None:
        if not create:
            return

        if not unit_groups and kwargs:
            unit_groups = [UnitGroupFactory(**kwargs)]

        for unit_group in unit_groups or []:
            unit_group.units.add(self)


class UnitGroupFactory(GenericDjangoModelFactory[UnitGroup]):
    class Meta:
        model = UnitGroup
        django_get_or_create = ["name"]

    name = fuzzy.FuzzyText()

    @factory.post_generation
    def units(self, create: bool, units: Iterable[Unit] | None, **kwargs: Any) -> None:
        if not create:
            return

        if not units and kwargs:
            self.units.add(UnitFactory.create(**kwargs))

        for unit in units or []:
            self.units.add(unit)
