from datetime import datetime

from factory import post_generation
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyChoice, FuzzyDateTime, FuzzyInteger
from pytz import UTC

from applications.models import PRIORITIES
from reservations.models import STATE_CHOICES


class ReservationFactory(DjangoModelFactory):
    class Meta:
        model = "reservations.Reservation"

    state = FuzzyChoice(
        choices=(
            STATE_CHOICES.CREATED,
            STATE_CHOICES.CANCELLED,
            STATE_CHOICES.CONFIRMED,
            STATE_CHOICES.DENIED,
            STATE_CHOICES.REQUESTED,
            STATE_CHOICES.WAITING_FOR_PAYMENT,
        )
    )
    priority = FuzzyInteger(
        low=PRIORITIES.PRIORITY_LOW, high=PRIORITIES.PRIORITY_HIGH, step=100
    )
    begin = FuzzyDateTime(
        start_dt=datetime(2021, 1, 1, tzinfo=UTC),
        end_dt=datetime(2022, 5, 31, tzinfo=UTC),
    )
    end = FuzzyDateTime(
        start_dt=datetime(2021, 1, 1, tzinfo=UTC),
        end_dt=datetime(2022, 5, 31, tzinfo=UTC),
    )

    @post_generation
    def reservation_unit(self, create, reservation_units, **kwargs):
        if not create or not reservation_units:
            return

        for resunit in reservation_units:
            self.reservation_unit.add(resunit)
