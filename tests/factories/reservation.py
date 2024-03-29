from datetime import UTC, datetime
from typing import Any

import factory
from factory import fuzzy

from reservation_units.models import ReservationUnit
from reservations.choices import ReservationStateChoice
from reservations.models import (
    Reservation,
)

from ._base import GenericDjangoModelFactory

__all__ = [
    "ReservationFactory",
]


class ReservationFactory(GenericDjangoModelFactory[Reservation]):
    class Meta:
        model = Reservation

    reservee_first_name = fuzzy.FuzzyText()
    reservee_last_name = fuzzy.FuzzyText()
    sku = fuzzy.FuzzyText()
    name = fuzzy.FuzzyText()
    description = fuzzy.FuzzyText()

    state = fuzzy.FuzzyChoice(
        choices=(
            ReservationStateChoice.CREATED,
            ReservationStateChoice.CANCELLED,
            ReservationStateChoice.CONFIRMED,
            ReservationStateChoice.DENIED,
        )
    )
    user = factory.SubFactory("tests.factories.UserFactory")
    begin = fuzzy.FuzzyDateTime(
        start_dt=datetime(2021, 1, 1, tzinfo=UTC),
        end_dt=datetime(2022, 5, 31, tzinfo=UTC),
    )
    end = fuzzy.FuzzyDateTime(
        start_dt=datetime(2021, 1, 1, tzinfo=UTC),
        end_dt=datetime(2022, 5, 31, tzinfo=UTC),
    )

    @classmethod
    def create_for_reservation_unit(cls, reservation_unit: ReservationUnit, **kwargs: Any) -> Reservation:
        """Create a Reservation for a single ReservationUnit with its buffer times."""
        kwargs.setdefault("state", ReservationStateChoice.CREATED)

        return cls.create(
            buffer_time_before=reservation_unit.buffer_time_before,
            buffer_time_after=reservation_unit.buffer_time_after,
            reservation_unit=[reservation_unit],
            **kwargs,
        )

    @factory.post_generation
    def reservation_unit(self, create: bool, reservation_units: list[ReservationUnit], **kwargs: Any):
        if not create:
            return

        if not reservation_units and kwargs:
            from .reservation_unit import ReservationUnitFactory

            self.reservation_unit.add(ReservationUnitFactory.create(**kwargs))

        for reservation_unit in reservation_units or []:
            self.reservation_unit.add(reservation_unit)
