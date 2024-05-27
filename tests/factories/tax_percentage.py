from _decimal import Decimal

from factory.fuzzy import FuzzyChoice

from reservation_units.models import TaxPercentage

from ._base import GenericDjangoModelFactory

__all__ = [
    "TaxPercentageFactory",
]


class TaxPercentageFactory(GenericDjangoModelFactory[TaxPercentage]):
    class Meta:
        model = TaxPercentage
        django_get_or_create = ["value"]

    value = FuzzyChoice(choices=(Decimal("10.0"), Decimal("14.0"), Decimal("24.0")))
