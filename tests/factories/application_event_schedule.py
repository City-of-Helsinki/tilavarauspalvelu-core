import datetime
import random
from collections.abc import Iterable
from typing import Any

import factory
from django.utils.timezone import get_default_timezone
from factory import fuzzy

from applications.choices import PriorityChoice, WeekdayChoice
from applications.models import ApplicationEventSchedule
from reservations.models import RecurringReservation

from ._base import GenericDjangoModelFactory

__all__ = [
    "ApplicationEventScheduleFactory",
]


class ApplicationEventScheduleFactory(GenericDjangoModelFactory[ApplicationEventSchedule]):
    class Meta:
        model = ApplicationEventSchedule

    day = fuzzy.FuzzyChoice(choices=WeekdayChoice.values)
    begin = datetime.time(12, 0, tzinfo=get_default_timezone())
    end = datetime.time(14, 0, tzinfo=get_default_timezone())

    allocated_day = None
    allocated_begin = None
    allocated_end = None

    declined = False
    priority = fuzzy.FuzzyChoice(choices=PriorityChoice.values)

    application_event = factory.SubFactory("tests.factories.ApplicationEventFactory")
    allocated_reservation_unit = None

    @classmethod
    def create_allocated(cls, **kwargs: Any) -> ApplicationEventSchedule:
        from .reservation_unit import ReservationUnitFactory

        day = random.choice(WeekdayChoice.values)  # noqa: S311
        kwargs.setdefault("day", day)
        kwargs.setdefault("allocated_day", day)
        kwargs.setdefault("allocated_begin", cls.begin)
        kwargs.setdefault("allocated_end", cls.end)

        unit_key = "allocated_reservation_unit"
        unit_kwargs = cls.pop_sub_kwargs(unit_key, kwargs)
        if unit_key not in kwargs:
            kwargs[unit_key] = ReservationUnitFactory.create(**unit_kwargs)

        return cls.create(**kwargs)

    @factory.post_generation
    def recurring_reservations(
        self,
        create: bool,
        recurring_reservations: Iterable[RecurringReservation] | None,
        **kwargs: Any,
    ) -> None:
        if not create:
            return

        if not recurring_reservations and kwargs:
            from . import RecurringReservationFactory

            kwargs.setdefault("application_event_schedule", self)
            RecurringReservationFactory.create(**kwargs)
