from __future__ import annotations

from factory import LazyAttribute

from tilavarauspalvelu.models import PricingGroup

from ._base import FakerEN, FakerFI, FakerSV, ForeignKeyFactory, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "PricingGroupFactory",
]


class PricingGroupFactory(GenericDjangoModelFactory[PricingGroup]):
    class Meta:
        model = PricingGroup

    name = FakerFI("word")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    unit_group = ForeignKeyFactory("tests.factories.UnitGroupFactory")

    components = ReverseForeignKeyFactory("tests.factories.PriceComponentFactory")
    reservation_unit_pricing_groups = ReverseForeignKeyFactory("tests.factories.ReservationUnitPricingGroupFactory")
