from __future__ import annotations

import factory

from tilavarauspalvelu.models import SalesItem

from ._base import FakerFI, ForeignKeyFactory, GenericDjangoModelFactory

__all__ = [
    "SalesItemFactory",
]


class SalesItemFactory(GenericDjangoModelFactory[SalesItem]):
    class Meta:
        model = SalesItem

    name = FakerFI("word", unique=True)
    material = factory.Sequence(lambda number: f"{10000000 + number}")
    main_ledger_account = "340025"

    tax_level = ForeignKeyFactory("tests.factories.TaxLevelFactory", required=True)

    reservation_price_lines = ReverseForeignKeyFactory("tests.factories.ReservationPriceLineFactory")
