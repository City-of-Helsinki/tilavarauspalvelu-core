import datetime
from typing import Any

import factory
from factory import fuzzy

from applications.enums import WeekdayChoice
from applications.models.application_round_time_slot import ApplicationRoundTimeSlot
from applications.typing import TimeSlotDB

from ._base import GenericDjangoModelFactory

__all__ = [
    "ApplicationRoundTimeSlotFactory",
]


class ApplicationRoundTimeSlotFactory(GenericDjangoModelFactory[ApplicationRoundTimeSlot]):
    class Meta:
        model = ApplicationRoundTimeSlot

    reservation_unit = factory.SubFactory("tests.factories.ReservationUnitFactory")
    weekday = fuzzy.FuzzyChoice(choices=WeekdayChoice.values)
    closed = False
    reservable_times = factory.LazyAttribute(
        lambda instance: [
            TimeSlotDB(
                begin=datetime.time(hour=10, minute=0).isoformat(timespec="seconds"),
                end=datetime.time(hour=12, minute=0).isoformat(timespec="seconds"),
            ),
        ]
    )

    @classmethod
    def create_closed(cls, **kwargs: Any) -> ApplicationRoundTimeSlot:
        kwargs["closed"] = True
        kwargs["reservable_times"] = []
        return cls.create(**kwargs)
