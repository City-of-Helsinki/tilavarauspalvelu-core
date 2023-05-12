from datetime import datetime

import factory
from django.utils import timezone
from factory import post_generation
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyChoice, FuzzyDateTime, FuzzyInteger, FuzzyText

from applications.models import PRIORITIES
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.models import STATE_CHOICES


class ReservationCancelReasonFactory(DjangoModelFactory):
    class Meta:
        model = "reservations.ReservationCancelReason"


class ReservationDenyReasonFactory(DjangoModelFactory):
    class Meta:
        model = "reservations.ReservationDenyReason"


class RecurringReservationFactory(DjangoModelFactory):
    class Meta:
        model = "reservations.RecurringReservation"

    reservation_unit = factory.SubFactory(ReservationUnitFactory)


class ReservationPurposeFactory(DjangoModelFactory):
    class Meta:
        model = "reservations.ReservationPurpose"

    name = FuzzyText()


class AgeGroupFactory(DjangoModelFactory):
    class Meta:
        model = "reservations.AgeGroup"

    minimum = FuzzyInteger(low=0, high=100)
    maximum = FuzzyInteger(low=0, high=100)


class ReservationMetadataSetFactory(DjangoModelFactory):
    class Meta:
        model = "reservations.ReservationMetadataSet"

    name = FuzzyText()


class ReservationFactory(DjangoModelFactory):
    class Meta:
        model = "reservations.Reservation"

    reservee_first_name = FuzzyText()
    reservee_last_name = FuzzyText()
    sku = FuzzyText()
    name = FuzzyText()
    description = FuzzyText()

    state = FuzzyChoice(
        choices=(
            STATE_CHOICES.CREATED,
            STATE_CHOICES.CANCELLED,
            STATE_CHOICES.CONFIRMED,
            STATE_CHOICES.DENIED,
        )
    )
    priority = FuzzyInteger(
        low=PRIORITIES.PRIORITY_LOW, high=PRIORITIES.PRIORITY_HIGH, step=100
    )
    begin = FuzzyDateTime(
        start_dt=datetime(2021, 1, 1, tzinfo=timezone.utc),
        end_dt=datetime(2022, 5, 31, tzinfo=timezone.utc),
    )
    end = FuzzyDateTime(
        start_dt=datetime(2021, 1, 1, tzinfo=timezone.utc),
        end_dt=datetime(2022, 5, 31, tzinfo=timezone.utc),
    )

    @post_generation
    def reservation_unit(self, create, reservation_units, **kwargs):
        if not create or not reservation_units:
            return

        for resunit in reservation_units:
            self.reservation_unit.add(resunit)


class AbilityGroupFactory(DjangoModelFactory):
    class Meta:
        model = "reservations.AbilityGroup"

    name = FuzzyText()
