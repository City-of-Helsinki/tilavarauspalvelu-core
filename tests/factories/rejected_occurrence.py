import datetime

import factory
from factory import fuzzy

from reservations.choices import RejectionReadinessChoice
from reservations.models import RejectedOccurrence

from ._base import GenericDjangoModelFactory

__all__ = [
    "RejectedOccurrenceFactory",
]


class RejectedOccurrenceFactory(GenericDjangoModelFactory[RejectedOccurrence]):
    class Meta:
        model = RejectedOccurrence

    begin_datetime = fuzzy.FuzzyDateTime(start_dt=datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
    end_datetime = factory.LazyAttribute(lambda ro: ro.begin_datetime + datetime.timedelta(hours=1))
    rejection_reason = fuzzy.FuzzyChoice(choices=RejectionReadinessChoice.values)

    recurring_reservation = factory.SubFactory("tests.factories.RecurringReservationFactory")
