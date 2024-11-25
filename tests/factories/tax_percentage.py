from __future__ import annotations

from decimal import Decimal

from factory.fuzzy import FuzzyChoice

from tilavarauspalvelu.models import TaxPercentage

from ._base import GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "TaxPercentageFactory",
]


class TaxPercentageFactory(GenericDjangoModelFactory[TaxPercentage]):
    class Meta:
        model = TaxPercentage
        django_get_or_create = ["value"]

    value = FuzzyChoice(choices=[Decimal(val) for val in ("0.0", "10.0", "14.0", "24.0", "25.5")])

    reservation_unit_pricings = ReverseForeignKeyFactory("tests.factories.ReservationUnitPricingFactory")
