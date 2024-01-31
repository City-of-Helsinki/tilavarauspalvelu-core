import datetime
from collections.abc import Iterable
from typing import Any

import factory
from factory import fuzzy

from reservations.models import RecurringReservation, Reservation

from ._base import GenericDjangoModelFactory


class RecurringReservationFactory(GenericDjangoModelFactory[RecurringReservation]):
    class Meta:
        model = RecurringReservation
        exclude = ["timestamp"]

    name = fuzzy.FuzzyText()
    description = fuzzy.FuzzyText()

    timestamp = fuzzy.FuzzyDateTime(start_dt=datetime.datetime(2020, 1, 1, tzinfo=datetime.UTC))
    begin_date = factory.LazyAttribute(lambda a: a.timestamp.date())
    begin_time = factory.LazyAttribute(lambda a: a.timestamp.time())

    end_date = factory.LazyAttribute(lambda a: a.begin_date + datetime.timedelta(days=1))
    end_time = factory.LazyAttribute(lambda a: a.begin_time)

    recurrence_in_days = 7
    weekdays = factory.LazyFunction(list)

    application_event_schedule = factory.SubFactory("tests.factories.ApplicationEventScheduleFactory")
    reservation_unit = factory.SubFactory("tests.factories.ReservationUnitFactory")
    age_group = factory.SubFactory("tests.factories.AgeGroupFactory")
    ability_group = factory.SubFactory("tests.factories.AbilityGroupFactory")
    user = factory.SubFactory("tests.factories.UserFactory")

    @factory.post_generation
    def reservations(self, create: bool, reservations: Iterable[Reservation] | None, **kwargs: Any):
        if not create:
            return

        if not reservations and kwargs:
            from tests.factories import ReservationFactory

            self.reservations.add(ReservationFactory.create(**kwargs))

        for reservation in reservations or []:
            self.reservations.add(reservation)
