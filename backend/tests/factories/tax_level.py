from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any

import factory
from factory import LazyAttribute

from tilavarauspalvelu.models import TaxLevel

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ReverseForeignKeyFactory
from .tax_level_rate import TaxLevelRateFactory

if TYPE_CHECKING:
    from collections.abc import Iterable

    from tilavarauspalvelu.models import TaxLevelRate

__all__ = [
    "TaxLevelFactory",
]


class TaxLevelFactory(GenericDjangoModelFactory[TaxLevel]):
    class Meta:
        model = TaxLevel

    name = FakerFI("word", unique=True)
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word", unique=True)
    name_sv = FakerSV("word", unique=True)

    reservation_unit_pricings = ReverseForeignKeyFactory("tests.factories.ReservationUnitPricingFactory")

    @factory.post_generation
    def rates(self: TaxLevel, create: bool, rates: Iterable[TaxLevelRate] | None, **kwargs: Any) -> None:
        # Give `rates=[]` to create a tax level without any rates.
        if not create or rates is not None:
            return

        kwargs.setdefault("begins", datetime.date(2000, 1, 1))
        kwargs.setdefault("percentage", Decimal("25.5"))
        TaxLevelRateFactory.create(tax_level=self, **kwargs)
