from __future__ import annotations

import datetime

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.models import RecurringReservation
from tilavarauspalvelu.services.pruning import prune_recurring_reservations
from utils.date_utils import local_datetime

from tests.factories import RecurringReservationFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_prune_recurring_reservations__recurring_reservations_without_reservations_are_deleted():
    with freeze_time(local_datetime() - datetime.timedelta(days=1)):
        RecurringReservationFactory.create()

    prune_recurring_reservations()

    assert RecurringReservation.objects.exists() is False


def test_prune_recurring_reservations__recurring_reservations_with_reservations_are_not_deleted():
    with freeze_time(local_datetime() - datetime.timedelta(days=1)):
        RecurringReservationFactory.create(reservations__name="foo")

    prune_recurring_reservations()

    assert RecurringReservation.objects.exists() is True


def test_prune_recurring_reservations__recurring_reservations_deletion_respects_remove_older_than_days():
    with freeze_time(local_datetime() - datetime.timedelta(hours=23, minutes=59)):
        RecurringReservationFactory.create()

    prune_recurring_reservations()

    assert RecurringReservation.objects.exists() is True
