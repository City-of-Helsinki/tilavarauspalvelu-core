from datetime import timedelta

import pytest

from common.date_utils import local_datetime
from reservations.choices import ReservationStateChoice
from reservations.models import Reservation
from reservations.pruning import prune_inactive_reservations
from tests.factories import ReservationFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_prune_inactive_reservations__deletes_old_reservations_with_state_created():
    twenty_minutes_ago = local_datetime() - timedelta(minutes=20)
    ReservationFactory.create(created_at=twenty_minutes_ago, state=ReservationStateChoice.CREATED)

    prune_inactive_reservations()

    assert Reservation.objects.exists() is False


def test_prune_inactive_reservations__does_not_delete_inactive_reservations_with_state():
    twenty_minutes_ago = local_datetime() - timedelta(minutes=20)

    for state, _ in ReservationStateChoice.choices:
        if state == ReservationStateChoice.CREATED:
            continue
        ReservationFactory.create(created_at=twenty_minutes_ago, state=state)

    prune_inactive_reservations()

    assert Reservation.objects.count() == len(ReservationStateChoice.choices) - 1


def test_prune_inactive_reservations__does_not_delete_recent_reservations():
    under_twenty_minutes_ago = local_datetime() - timedelta(minutes=19)
    ReservationFactory.create(created_at=under_twenty_minutes_ago, state=ReservationStateChoice.CREATED)

    prune_inactive_reservations()

    assert Reservation.objects.exists() is True
