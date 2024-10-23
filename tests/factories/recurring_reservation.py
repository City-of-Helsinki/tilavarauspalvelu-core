import datetime
from typing import Any

from factory import LazyAttribute, fuzzy

from tilavarauspalvelu.enums import ReservationStartInterval, ReservationStateChoice, WeekdayChoice
from tilavarauspalvelu.models import RecurringReservation
from utils.date_utils import DEFAULT_TIMEZONE, get_periods_between, local_datetime

from ._base import (
    FakerFI,
    ForeignKeyFactory,
    ForwardOneToOneFactory,
    GenericDjangoModelFactory,
    ReverseForeignKeyFactory,
)

__all__ = [
    "RecurringReservationFactory",
]


class RecurringReservationFactory(GenericDjangoModelFactory[RecurringReservation]):
    class Meta:
        model = RecurringReservation
        exclude = ["begin", "end"]

    name = FakerFI("word")
    description = FakerFI("sentence")
    recurrence_in_days = 7
    weekdays = str(WeekdayChoice.MONDAY)

    begin = fuzzy.FuzzyDateTime(start_dt=local_datetime(2023, 1, 1))
    end = LazyAttribute(lambda r: r.begin + datetime.timedelta(days=30, hours=1))

    begin_date = LazyAttribute(lambda r: r.begin.date())
    begin_time = LazyAttribute(lambda r: r.begin.time())

    end_date = LazyAttribute(lambda r: r.end.date())
    end_time = LazyAttribute(lambda r: r.end.time())

    reservation_unit = ForeignKeyFactory("tests.factories.ReservationUnitFactory")
    user = ForeignKeyFactory("tests.factories.UserFactory", required=True)

    allocated_time_slot = ForwardOneToOneFactory("tests.factories.AllocatedTimeSlotFactory")
    age_group = ForeignKeyFactory("tests.factories.AgeGroupFactory")

    ability_group = ForeignKeyFactory("tests.factories.AbilityGroupFactory")

    rejected_occurrences = ReverseForeignKeyFactory("tests.factories.RejectedOccurrenceFactory")
    reservations = ReverseForeignKeyFactory("tests.factories.ReservationFactory")

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
                    reservation_units=[series.reservation_unit],
                    begin=begin,
                    end=end,
                    **sub_kwargs,
                )

        return series
