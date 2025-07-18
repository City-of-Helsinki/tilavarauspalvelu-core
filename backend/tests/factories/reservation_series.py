from __future__ import annotations

import datetime
from typing import Any, Literal

from factory import LazyAttribute, fuzzy

from tilavarauspalvelu.enums import ReservationStartInterval, ReservationStateChoice, Weekday
from tilavarauspalvelu.models import Reservation, ReservationSeries
from utils.date_utils import DEFAULT_TIMEZONE, get_periods_between, local_datetime

from ._base import (
    FakerFI,
    ForeignKeyFactory,
    ForwardOneToOneFactory,
    GenericDjangoModelFactory,
    ReverseForeignKeyFactory,
)

__all__ = [
    "ReservationSeriesFactory",
]


class ReservationSeriesFactory(GenericDjangoModelFactory[ReservationSeries]):
    class Meta:
        model = ReservationSeries
        exclude = ["begin", "end"]

    name = FakerFI("word")
    description = FakerFI("sentence")
    recurrence_in_days = 7
    weekdays = [Weekday.MONDAY.value]

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

    rejected_occurrences = ReverseForeignKeyFactory("tests.factories.RejectedOccurrenceFactory")
    reservations = ReverseForeignKeyFactory("tests.factories.ReservationFactory")

    @classmethod
    def create_with_matching_reservations(cls, **kwargs: Any) -> ReservationSeries:
        """Create a ReservationSeries with reservations that match it's information."""
        from .reservation import ReservationFactory
        from .space import SpaceFactory

        sub_kwargs = cls.pop_sub_kwargs("reservations", kwargs)
        sub_kwargs.setdefault("state", ReservationStateChoice.CONFIRMED)

        kwargs.setdefault("reservation_unit__reservation_start_interval", ReservationStartInterval.INTERVAL_15_MINUTES)
        series: ReservationSeries = cls.create(**kwargs)

        # Add a space so that overlapping reservations can be checked.
        space = SpaceFactory.create(unit=series.reservation_unit.unit)
        series.reservation_unit.spaces.add(space)

        weekdays: list[Weekday] = [Weekday(weekday) for weekday in series.weekdays]
        if not weekdays:
            weekday_number: Literal[0, 1, 2, 3, 4, 5, 6] = series.begin_date.weekday()  # type: ignore[assignment]
            weekdays = [Weekday.from_week_day(weekday_number)]

        reservations: list[Reservation] = []

        weekday: Weekday
        for weekday in weekdays:
            delta: int = weekday.as_weekday_number - series.begin_date.weekday()
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
                reservation = ReservationFactory.build(
                    reservation_series=series,
                    user=series.user,
                    begins_at=begin,
                    ends_at=end,
                    reservation_unit=series.reservation_unit,
                    **sub_kwargs,
                )
                reservations.append(reservation)

        Reservation.objects.bulk_create(reservations)
        return series
