import datetime
from collections.abc import Iterable
from typing import Any

import factory
from factory import fuzzy

from reservations.models import RecurringReservation, Reservation

from ._base import GenericDjangoModelFactory
from .reservation import ReservationFactory

__all__ = [
    "RecurringReservationFactory",
]


class RecurringReservationFactory(GenericDjangoModelFactory[RecurringReservation]):
    class Meta:
        model = RecurringReservation
        exclude = ["begin", "end"]

    name = fuzzy.FuzzyText()
    description = fuzzy.FuzzyText()
    recurrence_in_days = fuzzy.FuzzyInteger(1, 14)
    weekdays = "1,2,3,4,5"

    begin = fuzzy.FuzzyDateTime(start_dt=datetime.datetime(2023, 1, 1, tzinfo=datetime.UTC))
    end = factory.LazyAttribute(lambda r: r.begin + datetime.timedelta(days=30))

    begin_date = factory.LazyAttribute(lambda r: r.begin.date())
    begin_time = factory.LazyAttribute(lambda r: r.begin.time())

    end_date = factory.LazyAttribute(lambda r: r.end.date())
    end_time = factory.LazyAttribute(lambda r: r.end.time())

    user = factory.SubFactory("tests.factories.UserFactory")
    application_event_schedule = factory.SubFactory("tests.factories.ApplicationEventScheduleFactory")
    reservation_unit = factory.SubFactory("tests.factories.ReservationUnitFactory")
    age_group = factory.SubFactory("tests.factories.AgeGroupFactory")
    ability_group = factory.SubFactory("tests.factories.AbilityGroupFactory")

    @factory.post_generation
    def reservations(self, create: bool, reservations: Iterable[Reservation] | None, **kwargs: Any):
        if not create:
            return

        if not reservations and kwargs:
            self.reservations.add(ReservationFactory.create(**kwargs))

        for reservation in reservations or []:
            self.reservations.add(reservation)
