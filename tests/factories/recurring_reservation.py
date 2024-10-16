import datetime
from typing import Any

import factory
from factory import fuzzy

from tilavarauspalvelu.enums import ReservationStartInterval, ReservationStateChoice, WeekdayChoice
from tilavarauspalvelu.models import RecurringReservation
from utils.date_utils import DEFAULT_TIMEZONE, get_periods_between

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
    recurrence_in_days = 7
    weekdays = f"{WeekdayChoice.MONDAY}"

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

    @classmethod
    def create_with_matching_reservations(cls, **kwargs: Any) -> RecurringReservation:
        """Create a RecurringReservation with reservations that match it's information."""
        from .reservation import ReservationFactory
        from .space import SpaceFactory

        sub_kwargs = cls.pop_sub_kwargs("reservations", kwargs)
        sub_kwargs.setdefault("state", ReservationStateChoice.CONFIRMED)

        kwargs.setdefault("reservation_unit__reservation_start_interval", ReservationStartInterval.INTERVAL_15_MINUTES)
        series = cls.create(**kwargs)

        # Add a space so that overlapping reservations can be checked.
        space = SpaceFactory.create(unit=series.reservation_unit.unit)
        series.reservation_unit.spaces.add(space)

        weekdays: list[int] = [int(val) for val in series.weekdays.split(",") if val != ""]
        if not weekdays:
            weekdays = [series.begin_date.weekday()]

        for weekday in weekdays:
            delta: int = weekday - series.begin_date.weekday()
            if delta < 0:
                delta += 7

            begin_date = series.begin_date + datetime.timedelta(days=delta)

            periods = get_periods_between(
                start_date=begin_date,
                end_date=series.end_date,
                start_time=series.begin_time,
                end_time=series.end_time,
                interval=series.recurrence_in_days,
                tzinfo=DEFAULT_TIMEZONE,
            )
            for begin, end in periods:
                ReservationFactory.create(
                    recurring_reservation=series,
                    reservation_unit=[series.reservation_unit],
                    begin=begin,
                    end=end,
                    **sub_kwargs,
                )

        return series
