from datetime import timedelta

import pytest
from freezegun import freeze_time

from common.date_utils import local_datetime
from reservations.models import RecurringReservation
from reservations.pruning import prune_recurring_reservations
from tests.factories import RecurringReservationFactory, ReservationFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_prune_recurring_reservations__recurring_reservations_without_reservations_are_deleted():
    with freeze_time(local_datetime() - timedelta(days=1)):
        RecurringReservationFactory.create()

    prune_recurring_reservations()

    assert RecurringReservation.objects.exists() is False


def test_prune_recurring_reservations__recurring_reservations_with_reservations_are_not_deleted():
    with freeze_time(local_datetime() - timedelta(days=1)):
        RecurringReservationFactory.create(reservations=[ReservationFactory.create()])

    prune_recurring_reservations()

    assert RecurringReservation.objects.exists() is True


def test_prune_recurring_reservations__recurring_reservations_deletion_respects_remove_older_than_days():
    with freeze_time(local_datetime() - timedelta(hours=23, minutes=59)):
        RecurringReservationFactory.create()

    prune_recurring_reservations()

    assert RecurringReservation.objects.exists() is True
