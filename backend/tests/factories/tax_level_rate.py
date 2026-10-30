from __future__ import annotations

import datetime
from decimal import Decimal

from tilavarauspalvelu.models import TaxLevelRate

from ._base import ForeignKeyFactory, GenericDjangoModelFactory

__all__ = [
    "TaxLevelRateFactory",
]


class TaxLevelRateFactory(GenericDjangoModelFactory[TaxLevelRate]):
    class Meta:
        model = TaxLevelRate

    begins = datetime.date(2000, 1, 1)
    percentage = Decimal("25.5")

    tax_level = ForeignKeyFactory("tests.factories.TaxLevelFactory", rates=[])
