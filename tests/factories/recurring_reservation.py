import datetime

import factory
from factory import fuzzy

from common.date_utils import DEFAULT_TIMEZONE
from tilavarauspalvelu.models import RecurringReservation

from ._base import GenericDjangoModelFactory, OneToManyFactory

__all__ = [
    "RecurringReservationFactory",
]


class RecurringReservationFactory(GenericDjangoModelFactory[RecurringReservation]):
    class Meta:
        model = RecurringReservation
        exclude = ["begin", "end"]

    name = fuzzy.FuzzyText()
    description = fuzzy.FuzzyText()
    recurrence_in_days = 14
    weekdays = "1,2,3,4,5"  # ti, ke, to, pe, la

    begin = fuzzy.FuzzyDateTime(start_dt=datetime.datetime(2023, 1, 1, tzinfo=DEFAULT_TIMEZONE))
    end = factory.LazyAttribute(lambda r: r.begin + datetime.timedelta(days=30, hours=1))

    begin_date = factory.LazyAttribute(lambda r: r.begin.date())
    begin_time = factory.LazyAttribute(lambda r: r.begin.time())

    end_date = factory.LazyAttribute(lambda r: r.end.date())
    end_time = factory.LazyAttribute(lambda r: r.end.time())

    user = factory.SubFactory("tests.factories.UserFactory")
    reservation_unit = factory.SubFactory("tests.factories.ReservationUnitFactory")
    age_group = factory.SubFactory("tests.factories.AgeGroupFactory")
    ability_group = factory.SubFactory("tests.factories.AbilityGroupFactory")
    allocated_time_slot = factory.SubFactory("tests.factories.AllocatedTimeSlotFactory")

    rejected_occurrences = OneToManyFactory("tests.factories.RejectedOccurrenceFactory")
    reservations = OneToManyFactory("tests.factories.ReservationFactory")
