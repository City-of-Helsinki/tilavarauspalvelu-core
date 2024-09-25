import datetime

from factory import fuzzy

from tests.factories._base import GenericDjangoModelFactory
from tilavarauspalvelu.models import ReservationUnitCancellationRule

__all__ = [
    "ReservationUnitCancellationRuleFactory",
]


class ReservationUnitCancellationRuleFactory(GenericDjangoModelFactory[ReservationUnitCancellationRule]):
    class Meta:
        model = ReservationUnitCancellationRule

    name = fuzzy.FuzzyText()
    can_be_cancelled_time_before = datetime.timedelta(hours=24)
    needs_handling = False
