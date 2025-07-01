from __future__ import annotations

import datetime
from typing import Any

import factory
from factory import fuzzy

from tilavarauspalvelu.enums import WeekdayChoice
from tilavarauspalvelu.models import ApplicationRoundTimeSlot
from tilavarauspalvelu.typing import TimeSlotDB

from ._base import ForeignKeyFactory, GenericDjangoModelFactory

__all__ = [
    "ApplicationRoundTimeSlotFactory",
]


class ApplicationRoundTimeSlotFactory(GenericDjangoModelFactory[ApplicationRoundTimeSlot]):
    class Meta:
        model = ApplicationRoundTimeSlot

    reservation_unit = ForeignKeyFactory("tests.factories.ReservationUnitFactory")

    weekday = fuzzy.FuzzyChoice(choices=WeekdayChoice.values)
    is_closed = False
    reservable_times = factory.LazyAttribute(
        lambda _: [
            TimeSlotDB(
                begin=datetime.time(hour=10, minute=0).isoformat(timespec="seconds"),
                end=datetime.time(hour=12, minute=0).isoformat(timespec="seconds"),
            ),
        ]
    )

    @classmethod
    def create_closed(cls, **kwargs: Any) -> ApplicationRoundTimeSlot:
        kwargs["is_closed"] = True
        kwargs["reservable_times"] = []
        return cls.create(**kwargs)
