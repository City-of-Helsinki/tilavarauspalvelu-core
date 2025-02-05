from __future__ import annotations

import datetime

from factory import LazyAttribute, fuzzy

from tilavarauspalvelu.enums import RejectionReadinessChoice
from tilavarauspalvelu.models import RejectedOccurrence
from utils.date_utils import utc_datetime

from ._base import ForeignKeyFactory, GenericDjangoModelFactory

__all__ = [
    "RejectedOccurrenceFactory",
]


class RejectedOccurrenceFactory(GenericDjangoModelFactory[RejectedOccurrence]):
    class Meta:
        model = RejectedOccurrence

    begin_datetime = fuzzy.FuzzyDateTime(start_dt=utc_datetime(2024, 1, 1))
    end_datetime = LazyAttribute(lambda i: i.begin_datetime + datetime.timedelta(hours=1))
    rejection_reason = fuzzy.FuzzyChoice(choices=RejectionReadinessChoice.values)

    recurring_reservation = ForeignKeyFactory("tests.factories.RecurringReservationFactory")
