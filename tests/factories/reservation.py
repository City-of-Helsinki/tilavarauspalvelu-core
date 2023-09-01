from datetime import datetime

import factory
from django.utils import timezone
from factory import fuzzy

from applications.models import PRIORITIES
from reservations.models import (
    STATE_CHOICES,
    RecurringReservation,
    Reservation,
    ReservationCancelReason,
    ReservationDenyReason,
    ReservationMetadataSet,
    ReservationPurpose,
)

from ._base import GenericDjangoModelFactory

__all__ = [
    "ReservationFactory",
    "ReservationCancelReasonFactory",
    "ReservationDenyReasonFactory",
    "RecurringReservationFactory",
    "ReservationPurposeFactory",
    "ReservationMetadataSetFactory",
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
            STATE_CHOICES.CREATED,
            STATE_CHOICES.CANCELLED,
            STATE_CHOICES.CONFIRMED,
            STATE_CHOICES.DENIED,
        )
    )
    priority = fuzzy.FuzzyInteger(low=PRIORITIES.PRIORITY_LOW, high=PRIORITIES.PRIORITY_HIGH, step=100)
    begin = fuzzy.FuzzyDateTime(
        start_dt=datetime(2021, 1, 1, tzinfo=timezone.utc),
        end_dt=datetime(2022, 5, 31, tzinfo=timezone.utc),
    )
    end = fuzzy.FuzzyDateTime(
        start_dt=datetime(2021, 1, 1, tzinfo=timezone.utc),
        end_dt=datetime(2022, 5, 31, tzinfo=timezone.utc),
    )

    @factory.post_generation
    def reservation_unit(self, create, reservation_units, **kwargs):
        if not create or not reservation_units:
            return

        for reservation_unit in reservation_units:
            self.reservation_unit.add(reservation_unit)


class ReservationCancelReasonFactory(GenericDjangoModelFactory[ReservationCancelReason]):
    class Meta:
        model = ReservationCancelReason


class ReservationDenyReasonFactory(GenericDjangoModelFactory[ReservationDenyReason]):
    class Meta:
        model = ReservationDenyReason


class RecurringReservationFactory(GenericDjangoModelFactory[RecurringReservation]):
    class Meta:
        model = RecurringReservation

    reservation_unit = factory.SubFactory("tests.factories.ReservationUnitFactory")


class ReservationPurposeFactory(GenericDjangoModelFactory[ReservationPurpose]):
    class Meta:
        model = ReservationPurpose

    name = fuzzy.FuzzyText()


class ReservationMetadataSetFactory(GenericDjangoModelFactory[ReservationMetadataSet]):
    class Meta:
        model = ReservationMetadataSet
        django_get_or_create = ["name"]

    name = fuzzy.FuzzyText()
